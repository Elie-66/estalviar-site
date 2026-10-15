import Stripe from "stripe";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAcces, journaliser } from "../../../lib/verifierAdmin";
import { creerAvoir, donneesAvoir, pdfFacture, nomFichierFacture, euros } from "../../../lib/factures";
import { EXPEDITEUR, SITE } from "../../../lib/emailCarte";
import { enveloppeEmail, titreEmail, texteEmail } from "../../../lib/emailTemplate";
import { echapperHtml } from "../../../lib/designs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const arrondi = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Où en est l'envoi du code ?
 * • « pas encore » : carte programmée à plus de 29 jours (elle n'est pas encore chez Resend)
 * • « programmé » : email programmé chez Resend, qu'on peut encore annuler
 * • « envoyé » : le code est parti, on ne peut plus le reprendre
 */
function etatEnvoi(commande) {
  if (["a_programmer"].includes(commande.statut)) return "pas_encore";
  if (commande.email_statut === "annule") return "pas_encore";
  if (commande.email_statut === "programme" && commande.email_id) return "programme";
  if (!commande.code) return "pas_encore"; // participation à une cagnotte : pas de code
  return "envoye";
}

/**
 * Part de la carte payée par carte bancaire (le reste a été payé avec du cashback).
 * Ex. : panier de 100 € dont 10 € de cashback → une carte de 50 € a été payée 45 € par carte.
 */
async function partPayeeParCarte(commande) {
  if (!commande.panier_id) return { montant: Number(commande.montant), panier: null };
  const { data: panier } = await supabaseAdmin
    .from("paniers")
    .select("id, montant_total, cashback_utilise, stripe_session_id")
    .eq("id", commande.panier_id)
    .maybeSingle();
  const total = Number(panier?.montant_total) || 0;
  const cashback = Number(panier?.cashback_utilise) || 0;
  const ratio = total > 0 ? (total - cashback) / total : 1;
  return { montant: arrondi(Number(commande.montant) * ratio), panier };
}

// GET ?commande=… → ce qui serait remboursé (pour la fenêtre de confirmation)
export async function GET(req) {
  if (!(await verifierAcces(req, "commandes", "modifier"))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("commande");
  const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", id).maybeSingle();
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const { montant, panier } = await partPayeeParCarte(commande);
  return NextResponse.json({
    etatEnvoi: etatEnvoi(commande),
    montantCarte: montant,
    partCashback: arrondi(Number(commande.montant) - montant),
    stripePossible: !!panier?.stripe_session_id,
    dejaRembourse: commande.statut === "remboursee",
  });
}

// POST { commandeId, viaStripe } → rembourse (si demandé), passe la carte en « remboursée », crée et envoie l'avoir
export async function POST(req) {
  const acces = await verifierAcces(req, "commandes", "modifier");
  if (!acces) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { commandeId, viaStripe, malgreEnvoi } = await req.json();
    const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", commandeId).maybeSingle();
    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const { montant, panier } = await partPayeeParCarte(commande);

    // 0) Le code ne doit pas partir : on annule l'email programmé chez Resend.
    //    Si le code a déjà été envoyé, on ne rembourse que sur confirmation expresse (geste commercial).
    let etat = commande.statut === "remboursee" ? "pas_encore" : etatEnvoi(commande);
    if (etat === "programme") {
      const { error: erreurAnnulation } = await resend.emails.cancel(commande.email_id);
      if (erreurAnnulation) {
        etat = "envoye"; // trop tard : Resend l'a déjà envoyé
      } else {
        await supabaseAdmin.from("commandes").update({ email_statut: "annule", email_maj_le: new Date().toISOString() }).eq("id", commande.id);
      }
    }
    if (etat === "envoye" && !malgreEnvoi) {
      return NextResponse.json(
        { error: "Le code de cette carte a déjà été envoyé : il reste utilisable. Cochez « Rembourser quand même » si c'est un geste commercial.", codeEnvoye: true },
        { status: 409 }
      );
    }

    // 1) Remboursement Stripe (une seule fois par carte, même si on clique deux fois)
    let remboursementId = commande.stripe_remboursement || null;
    if (viaStripe && !remboursementId) {
      if (!panier?.stripe_session_id) {
        return NextResponse.json({ error: "Paiement Stripe introuvable pour cette carte : remboursez depuis Stripe puis choisissez « Déjà remboursé »." }, { status: 400 });
      }
      const session = await stripe.checkout.sessions.retrieve(panier.stripe_session_id);
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
      if (!paymentIntent) return NextResponse.json({ error: "Paiement Stripe introuvable" }, { status: 400 });
      const remboursement = await stripe.refunds.create(
        { payment_intent: paymentIntent, amount: Math.round(montant * 100), metadata: { commande_id: String(commande.id) } },
        { idempotencyKey: `remboursement-${commande.id}` }
      );
      remboursementId = remboursement.id;
    }

    // 2) La carte passe en « remboursée » (les points et le cashback liés sont retirés par la base)
    await supabaseAdmin
      .from("commandes")
      .update({ statut: "remboursee", rembourse_le: commande.rembourse_le || new Date().toISOString(), stripe_remboursement: remboursementId })
      .eq("id", commande.id);

    // 3) Avoir (seulement pour une carte qui a une facture : achat en boutique)
    let avoir = null;
    if (commande.panier_id) {
      const { data: facture } = await supabaseAdmin.from("factures").select("*").eq("panier_id", String(commande.panier_id)).maybeSingle();
      const donnees = donneesAvoir({ commande, facture, rembourseCarte: montant });
      donnees.total = montant;
      if (montant < Number(commande.montant)) {
        donnees.lignes[0].libelle += " (part payée par carte bancaire)";
        donnees.lignes[0].prix_unitaire = montant;
        donnees.lignes[0].total = montant;
      }
      const { data: avoirExistant } = await supabaseAdmin
        .from("factures").select("numero").eq("type", "avoir").eq("commande_id", String(commande.id)).maybeSingle();
      avoir = await creerAvoir(supabaseAdmin, donnees);

      // 4) Email au client avec l'avoir en PDF (une seule fois, même si on clique deux fois)
      if (!avoirExistant) try {
        const pdf = await pdfFacture(avoir);
        const marque = String(commande.marque || "").replace(/^Cagnotte\s*/i, "");
        const contenu =
          titreEmail("Votre remboursement") +
          texteEmail(`La carte cadeau <strong>${echapperHtml(marque)}</strong>${commande.beneficiaire ? ` pour ${echapperHtml(commande.beneficiaire)}` : ""} a été remboursée : <strong>${euros(montant)}</strong>${viaStripe ? " sur votre carte bancaire. Selon votre banque, le montant apparaît sous 5 à 10 jours" : ""}.`) +
          texteEmail(`Vous trouverez l'avoir <strong>${avoir.numero}</strong> en pièce jointe${avoir.facture_origine ? ` (il se rapporte à la facture ${avoir.facture_origine})` : ""}.`) +
          texteEmail(`Une question ? Répondez simplement à cet email ou écrivez-nous à <a href="mailto:info@estalviar.com" style="color:#C9A227;">info@estalviar.com</a>.`);
        await resend.emails.send({
          from: EXPEDITEUR,
          to: avoir.email_client,
          subject: `Votre remboursement (avoir ${avoir.numero})`,
          html: enveloppeEmail({ titre: "Votre remboursement", contenuHtml: contenu, siteUrl: SITE }),
          attachments: [{ filename: nomFichierFacture(avoir), content: Buffer.from(pdf) }],
        });
      } catch (e) {
        console.error("Email d'avoir non envoyé", commande.id, e);
      }
    }

    await journaliser(acces, "rembourser carte", {
      commande: commande.id, montant, stripe: !!remboursementId, avoir: avoir?.numero || null,
      code: etat === "envoye" ? "déjà envoyé" : "jamais envoyé",
    });
    return NextResponse.json({ ok: true, avoir: avoir?.numero || null, montant, stripe: !!remboursementId, envoiAnnule: etat !== "envoye" });
  } catch (e) {
    console.error("Remboursement", e);
    const message = e?.type?.startsWith?.("Stripe") ? `Stripe a refusé le remboursement : ${e.message}` : "Le remboursement n'a pas pu être fait";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
