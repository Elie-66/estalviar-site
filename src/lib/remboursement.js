// Remboursement d'une carte : Stripe, statut, avoir, email au client.
// Un membre de l'équipe ne rembourse pas directement : il fait une DEMANDE, que le propriétaire valide par email.
// UNIQUEMENT côté serveur.

import crypto from "node:crypto";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabaseAdmin, journaliser } from "./verifierAdmin";
import { creerAvoir, donneesAvoir, pdfFacture, nomFichierFacture, euros } from "./factures";
import { EXPEDITEUR, SITE, articleDepuisCommande, construireEmailCarte, dateHeureParis } from "./emailCarte";
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from "./emailTemplate";
import { echapperHtml } from "./designs";
import { dechiffrerCode } from "./chiffrement";
import { noterEnvoi, idEmail } from "./suiviEnvoi";
import { PROPRIETAIRES } from "./admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const arrondi = (n) => Math.round(Number(n) * 100) / 100;
export const DUREE_VALIDATION_JOURS = 7;

const nomMarque = (commande) => String(commande.marque || "").replace(/^Cagnotte\s*/i, "");

/**
 * Où en est l'envoi du code ?
 * • « pas_encore » : carte programmée à plus de 29 jours (pas encore chez Resend), ou envoi annulé
 * • « programme » : email programmé chez Resend, qu'on peut encore annuler
 * • « envoye » : le code est parti, on ne peut plus le reprendre
 */
export function etatEnvoi(commande) {
  if (commande.statut === "a_programmer") return "pas_encore";
  if (["annule", "suspendu"].includes(commande.email_statut)) return "pas_encore";
  if (commande.email_statut === "programme" && commande.email_id) return "programme";
  if (!commande.code) return "pas_encore"; // participation à une cagnotte : pas de code
  return "envoye";
}

/**
 * Part de la carte payée par carte bancaire (le reste a été payé avec du cashback).
 * Ex. : panier de 100 € dont 10 € de cashback → une carte de 50 € a été payée 45 € par carte.
 */
export async function partPayeeParCarte(commande) {
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

/** Annule l'email programmé chez Resend. Renvoie false si c'est trop tard (déjà envoyé). */
async function annulerEmailProgramme(commande, nouveauStatut = "annule") {
  const { error } = await resend.emails.cancel(commande.email_id);
  if (error) return false;
  await supabaseAdmin
    .from("commandes")
    .update({ email_statut: nouveauStatut, email_maj_le: new Date().toISOString() })
    .eq("id", commande.id);
  return true;
}

// ---------------------------------------------------------------------------
// REMBOURSEMENT (fait directement par le propriétaire, ou après sa validation)
// ---------------------------------------------------------------------------
export async function executerRemboursement({ commande, viaStripe, malgreEnvoi, acces }) {
  const { montant, panier } = await partPayeeParCarte(commande);

  // 0) Le code ne doit pas partir : on annule l'email programmé chez Resend.
  //    Si le code a déjà été envoyé, on ne rembourse que sur confirmation expresse (geste commercial).
  let etat = commande.statut === "remboursee" ? "pas_encore" : etatEnvoi(commande);
  if (etat === "programme" && !(await annulerEmailProgramme(commande))) etat = "envoye";
  if (etat === "envoye" && !malgreEnvoi) {
    return {
      ok: false, code: 409, codeEnvoye: true,
      erreur: "Le code de cette carte a déjà été envoyé : il reste utilisable. Cochez « Rembourser quand même » si c'est un geste commercial.",
    };
  }

  // 1) Remboursement Stripe (une seule fois par carte, même si on clique deux fois)
  let remboursementId = commande.stripe_remboursement || null;
  if (viaStripe && !remboursementId) {
    if (!panier?.stripe_session_id) {
      return { ok: false, code: 400, erreur: "Paiement Stripe introuvable pour cette carte : remboursez depuis Stripe puis choisissez « Déjà remboursé »." };
    }
    const session = await stripe.checkout.sessions.retrieve(panier.stripe_session_id);
    const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (!paymentIntent) return { ok: false, code: 400, erreur: "Paiement Stripe introuvable" };
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

    // 4) Email au client avec l'avoir en PDF (une seule fois)
    if (!avoirExistant) {
      try {
        const pdf = await pdfFacture(avoir);
        const contenu =
          titreEmail("Votre remboursement") +
          texteEmail(`La carte cadeau <strong>${echapperHtml(nomMarque(commande))}</strong>${commande.beneficiaire ? ` pour ${echapperHtml(commande.beneficiaire)}` : ""} a été remboursée : <strong>${euros(montant)}</strong>${viaStripe ? " sur votre carte bancaire. Selon votre banque, le montant apparaît sous 5 à 10 jours" : ""}.`) +
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
  }

  await journaliser(acces, "rembourser carte", {
    commande: commande.id, montant, stripe: !!remboursementId, avoir: avoir?.numero || null,
    code: etat === "envoye" ? "déjà envoyé" : "jamais envoyé",
  });
  return { ok: true, avoir: avoir?.numero || null, montant, stripe: !!remboursementId, envoiAnnule: etat !== "envoye" };
}

// ---------------------------------------------------------------------------
// DEMANDE DE REMBOURSEMENT (membre de l'équipe → validation par le propriétaire)
// ---------------------------------------------------------------------------
const hacher = (jeton) => crypto.createHash("sha256").update(String(jeton)).digest("hex");

/**
 * Crée la demande, met la carte en attente (le code ne part pas pendant ce temps)
 * et envoie un email de validation au propriétaire.
 */
export async function demanderRemboursement({ commande, viaStripe, malgreEnvoi, motif, acces }) {
  if (["remboursee", "annulee"].includes(commande.statut)) {
    return { ok: false, code: 409, erreur: "Cette carte est déjà remboursée ou annulée." };
  }
  const { data: existante } = await supabaseAdmin
    .from("demandes_remboursement").select("id").eq("commande_id", String(commande.id)).eq("statut", "en_attente").maybeSingle();
  if (existante) return { ok: false, code: 409, erreur: "Une demande de remboursement attend déjà la validation du propriétaire." };

  // Le code ne doit pas partir pendant l'attente
  let etat = etatEnvoi(commande);
  let emailSuspendu = false;
  if (etat === "programme") {
    emailSuspendu = await annulerEmailProgramme(commande, "suspendu");
    if (!emailSuspendu) etat = "envoye";
  }
  if (etat === "envoye" && !malgreEnvoi) {
    return {
      ok: false, code: 409, codeEnvoye: true,
      erreur: "Le code de cette carte a déjà été envoyé : il reste utilisable. Cochez « Rembourser quand même » si c'est un geste commercial.",
    };
  }

  const { montant } = await partPayeeParCarte(commande);
  const jeton = crypto.randomBytes(32).toString("base64url");
  const { data: demande, error } = await supabaseAdmin
    .from("demandes_remboursement")
    .insert({
      commande_id: String(commande.id),
      demande_par: acces.email,
      via_stripe: !!viaStripe,
      malgre_envoi: !!malgreEnvoi,
      motif: typeof motif === "string" ? motif.trim().slice(0, 300) || null : null,
      montant,
      statut_carte_avant: commande.statut,
      email_suspendu: emailSuspendu,
      jeton_hache: hacher(jeton),
      expire_le: new Date(Date.now() + DUREE_VALIDATION_JOURS * 86400000).toISOString(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  // Carte « en litige » pendant l'attente : la tâche d'envoi des cartes programmées la laisse de côté
  if (commande.statut === "a_programmer" || emailSuspendu) {
    await supabaseAdmin.from("commandes").update({ statut: "litige" }).eq("id", commande.id);
  }

  // Email de validation au propriétaire
  const lien = `${SITE}/fr/admin/remboursement/${demande.id}?jeton=${jeton}`;
  const contenu =
    titreEmail("Remboursement à valider") +
    texteEmail(`<strong>${echapperHtml(acces.email)}</strong> demande le remboursement d'une carte :`) +
    texteEmail(
      `Carte <strong>${echapperHtml(nomMarque(commande))}</strong> de ${euros(commande.montant)}${commande.beneficiaire ? ` pour ${echapperHtml(commande.beneficiaire)}` : ""}<br/>` +
      `Achetée par ${echapperHtml(commande.email_acheteur || "")}<br/>` +
      `Montant à rembourser : <strong>${euros(montant)}</strong> ${viaStripe ? "sur la carte bancaire du client (Stripe)" : "(déjà remboursé depuis Stripe, avoir seulement)"}` +
      (etat === "envoye" ? `<br/><span style="color:#B5563F;"><strong>Attention : le code a déjà été envoyé</strong> (geste commercial).</span>` : "") +
      (demande.motif ? `<br/>Motif : ${echapperHtml(demande.motif)}` : "")
    ) +
    boutonEmail({ texte: "Voir et valider", lien }) +
    texteEmail(`Rien ne se passe tant que vous n'avez pas validé. Le code de la carte ne sera pas envoyé pendant ce temps. Ce lien expire dans ${DUREE_VALIDATION_JOURS} jours.`);
  for (const proprietaire of PROPRIETAIRES) {
    try {
      await resend.emails.send({
        from: EXPEDITEUR,
        to: proprietaire,
        subject: `À valider : remboursement de ${euros(montant)} (${nomMarque(commande)})`,
        html: enveloppeEmail({ titre: "Remboursement à valider", contenuHtml: contenu, siteUrl: SITE }),
      });
    } catch (e) {
      console.error("Email de validation non envoyé", demande.id, e);
    }
  }

  await journaliser(acces, "demander remboursement", { commande: commande.id, montant, demande: demande.id });
  return { ok: true, enAttente: true, demande: demande.id };
}

/** Vérifie le lien reçu par email (jeton secret, une seule utilisation, pas expiré) */
export async function demandeDepuisLien(id, jeton) {
  if (!/^[0-9a-f-]{36}$/i.test(String(id || "")) || !jeton) return null;
  const { data: demande } = await supabaseAdmin.from("demandes_remboursement").select("*").eq("id", id).maybeSingle();
  if (!demande) return null;
  const attendu = Buffer.from(demande.jeton_hache || "");
  const recu = Buffer.from(hacher(jeton));
  if (attendu.length !== recu.length || !crypto.timingSafeEqual(attendu, recu)) return null;
  return demande;
}

/** Le propriétaire valide : le remboursement est fait */
export async function validerDemande({ demande, acces }) {
  if (demande.statut !== "en_attente") return { ok: false, code: 409, erreur: "Cette demande a déjà été traitée." };
  if (new Date(demande.expire_le) < new Date()) return { ok: false, code: 410, erreur: "Ce lien a expiré : refaites la demande depuis l'admin." };

  // Réservation : une seule validation possible
  const { data: reservee } = await supabaseAdmin
    .from("demandes_remboursement")
    .update({ statut: "en_cours" })
    .eq("id", demande.id).eq("statut", "en_attente")
    .select("id").maybeSingle();
  if (!reservee) return { ok: false, code: 409, erreur: "Cette demande a déjà été traitée." };

  const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", demande.commande_id).maybeSingle();
  try {
    // La carte était « en litige » pendant l'attente : on l'évalue avec son statut d'avant
    const resultat = await executerRemboursement({
      commande: { ...commande, statut: commande.statut === "litige" ? demande.statut_carte_avant : commande.statut },
      viaStripe: demande.via_stripe, malgreEnvoi: true, acces,
    });
    await supabaseAdmin.from("demandes_remboursement").update({
      statut: resultat.ok ? "validee" : "erreur", traitee_le: new Date().toISOString(), traitee_par: acces?.email || "lien email", resultat,
    }).eq("id", demande.id);
    return resultat;
  } catch (e) {
    await supabaseAdmin.from("demandes_remboursement").update({ statut: "en_attente" }).eq("id", demande.id);
    throw e;
  }
}

/** Le propriétaire refuse : la carte reprend son cours normal (le code repart à la date prévue) */
export async function refuserDemande({ demande, acces }) {
  const { data: reservee } = await supabaseAdmin
    .from("demandes_remboursement")
    .update({ statut: "refusee", traitee_le: new Date().toISOString(), traitee_par: acces?.email || "lien email" })
    .eq("id", demande.id).eq("statut", "en_attente")
    .select("id").maybeSingle();
  if (!reservee) return { ok: false, code: 409, erreur: "Cette demande a déjà été traitée." };

  const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", demande.commande_id).maybeSingle();
  if (commande?.statut === "litige") {
    await supabaseAdmin.from("commandes").update({ statut: demande.statut_carte_avant || "payee" }).eq("id", commande.id);
  }
  // L'email du code avait été suspendu : on le reprogramme (ou on l'envoie tout de suite si la date est passée)
  if (demande.email_suspendu && commande && demande.statut_carte_avant !== "a_programmer") {
    try {
      const article = await articleDepuisCommande(supabaseAdmin, commande);
      const quand = dateHeureParis(commande.date_envoi, commande.heure_envoi);
      const options = {
        from: EXPEDITEUR,
        to: commande.email_destinataire || commande.email_acheteur,
        subject: `Votre carte cadeau ${article.marque}`,
        html: construireEmailCarte({ article, code: dechiffrerCode(commande.code), jeton: commande.jeton_carte }),
      };
      if (quand && quand > new Date()) options.scheduledAt = quand.toISOString();
      const reponse = await resend.emails.send(options);
      if (reponse.error) throw new Error(reponse.error.message);
      await noterEnvoi(supabaseAdmin, commande.id, idEmail(reponse), { programme: !!options.scheduledAt });
    } catch (e) {
      console.error("Carte non reprogrammée après refus", commande.id, e);
    }
  }
  await journaliser(acces || { email: "lien email" }, "refuser remboursement", { commande: demande.commande_id, demande: demande.id });
  return { ok: true, refusee: true };
}
