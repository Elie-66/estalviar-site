import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { trouverDesign } from "../../../lib/designs";
import { utilisateurConnecte } from "../../../lib/utilisateurServeur";
import { VERSION_CGV } from "../../../lib/infosLegales";
import { nettoyerFacturation } from "../../../lib/factures";
import { MAX_CARTES_GROUPEES, normaliser } from "../../../lib/commandeGroupee";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;

/**
 * Commande groupée (professionnels) : une liste de cartes, chacune envoyée à son destinataire.
 * Le serveur revérifie tout (enseignes, montants, emails) et prépare le paiement Stripe.
 * Après le paiement, la livraison est la même que pour un panier classique (traiterPaiementPanier).
 */
export async function POST(req) {
  try {
    const { lignes, options = {}, emailAcheteur, facturation, accepteCgv, locale } = await req.json();
    const langue = ["fr", "en", "de", "es", "it"].includes(locale) ? locale : "fr";
    const client = await utilisateurConnecte(req);

    if (!Array.isArray(lignes) || lignes.length === 0) {
      return NextResponse.json({ error: "La liste est vide" }, { status: 400 });
    }
    if (lignes.length > MAX_CARTES_GROUPEES) {
      return NextResponse.json({ error: `${MAX_CARTES_GROUPEES} cartes maximum par commande` }, { status: 400 });
    }
    if (!EMAIL_VALIDE.test(emailAcheteur || "")) {
      return NextResponse.json({ error: "Email de contact invalide" }, { status: 400 });
    }
    if (accepteCgv !== true) {
      return NextResponse.json({ error: "Merci d'accepter les conditions générales de vente." }, { status: 400 });
    }
    const societe = nettoyerFacturation(facturation);
    if (!societe?.societe || !societe.adresse) {
      return NextResponse.json({ error: "Raison sociale et adresse obligatoires pour la facture" }, { status: 400 });
    }

    // Date d'envoi commune (facultative), comprise à l'heure de Paris
    const dateEnvoi = /^\d{4}-\d{2}-\d{2}$/.test(options.dateEnvoi || "") ? options.dateEnvoi : null;
    const heureEnvoi = dateEnvoi && /^\d{2}:\d{2}$/.test(options.heureEnvoi || "") ? options.heureEnvoi : dateEnvoi ? "09:00" : null;

    const { data: catalogue } = await supabase
      .from("catalogue")
      .select("slug, nom, image, couleur, montant_min, montant_max, actif");
    const parNom = new Map();
    for (const c of catalogue || []) {
      if (!c.actif) continue;
      parNom.set(normaliser(c.nom), c);
      parNom.set(normaliser(c.slug), c);
    }

    const articles = [];
    for (const [i, l] of lignes.entries()) {
      const n = i + 1;
      const carte = parNom.get(normaliser(l.marque));
      if (!carte) return NextResponse.json({ error: `Ligne ${n} : enseigne « ${String(l.marque || "").slice(0, 40)} » introuvable` }, { status: 400 });
      const montant = Number(l.montant);
      if (!Number.isInteger(montant) || montant < carte.montant_min || montant > carte.montant_max) {
        return NextResponse.json(
          { error: `Ligne ${n} : montant invalide pour ${carte.nom} (entre ${carte.montant_min} € et ${carte.montant_max} €, sans centimes)` },
          { status: 400 }
        );
      }
      const email = texte(l.email, 120);
      if (email && !EMAIL_VALIDE.test(email)) {
        return NextResponse.json({ error: `Ligne ${n} : email invalide` }, { status: 400 });
      }
      const design = trouverDesign(options.design, carte.couleur);
      articles.push({
        slug: carte.slug,
        marque: carte.nom,
        image: carte.image,
        montant,
        design: design.nom,
        background: design.background,
        texteFonce: design.texteFonce,
        beneficiaire: texte(l.prenom, 40),
        message: texte(l.message, 120) || texte(options.message, 120),
        dateEnvoi,
        heureEnvoi,
        emailBeneficiaire: email,
      });
    }

    const montantTotal = articles.reduce((s, a) => s + a.montant, 0);

    const { data: panier, error: erreurPanier } = await supabase
      .from("paniers")
      .insert({
        email_acheteur: emailAcheteur.trim(),
        articles,
        montant_total: montantTotal,
        statut: "en_attente",
        profil_id: client?.id || null,
        cgv_version: VERSION_CGV,
        cgv_acceptees_le: new Date().toISOString(),
        facturation: societe,
      })
      .select("id")
      .single();
    if (erreurPanier) {
      console.error(erreurPanier);
      return NextResponse.json({ error: "Impossible de préparer la commande" }, { status: 500 });
    }

    // Stripe : une ligne par enseigne et par montant (« 25 × Carte cadeau Fnac 50 € »)
    const groupes = new Map();
    for (const a of articles) {
      const cle = `${a.marque}|${a.montant}`;
      groupes.set(cle, { marque: a.marque, montant: a.montant, quantite: (groupes.get(cle)?.quantite || 0) + 1 });
    }
    const origine = req.headers.get("origin") || "https://estalviar.com";
    const page = `${origine}/${langue}/professionnels/commande-groupee`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [...groupes.values()].map((g) => ({
        price_data: {
          currency: "eur",
          product_data: { name: `Carte cadeau ${g.marque}` },
          unit_amount: g.montant * 100,
        },
        quantity: g.quantite,
      })),
      customer_email: emailAcheteur.trim(),
      client_reference_id: panier.id,
      metadata: { type: "panier", panier_id: panier.id, groupee: "oui" },
      success_url: `${page}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${page}?annule=1`,
      managed_payments: { enabled: false },
    });
    await supabase.from("paniers").update({ stripe_session_id: session.id }).eq("id", panier.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erreur lors de la préparation du paiement" }, { status: 500 });
  }
}
