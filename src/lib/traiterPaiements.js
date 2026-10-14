// Traitement des paiements Stripe confirmés — UNIQUEMENT côté serveur.
// Utilisé par la page de confirmation ET par le webhook Stripe.
// Chaque paiement n'est traité qu'une seule fois, même si on l'appelle plusieurs fois.

import crypto from "node:crypto";
import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { chiffrerCode } from "./chiffrement";
import { echapperHtml } from "./designs";
import { calculerCashbackGagne, REGLES_CASHBACK } from "./cashback";
import { calculerCode, filtreCartes } from "./codeInfluence";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://estalviar.com";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Code provisoire (en attendant les vrais codes Tillo), généré de façon imprévisible
function genererCode() {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

function construireEmailCarte({ article, code }) {
  const logoUrl = `${SITE}${article.image || "/logos/estalviar-icone.svg"}`;
  const couleurTexte = article.texteFonce ? "#12172B" : "#F6F2E9";
  const couleurTexteAtt = article.texteFonce ? "rgba(18,23,43,0.6)" : "rgba(246,242,233,0.6)";
  const beneficiaire = echapperHtml(article.beneficiaire);
  const message = echapperHtml(article.message);

  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0d1022;">
      <div style="border-radius: 16px; padding: 28px; background: ${article.background}; border: 1px solid rgba(201,162,39,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <img src="${logoUrl}" alt="${echapperHtml(article.marque)}" height="28" style="display:block;" />
          <span style="color:#C9A227; font-size:10px; letter-spacing:2px; text-transform:uppercase;">Estalviar</span>
        </div>
        ${beneficiaire ? `<p style="color:${couleurTexte}; font-size:14px; margin:20px 0 0;">Pour ${beneficiaire}</p>` : '<div style="margin-top:20px;"></div>'}
        ${message ? `<p style="color:${couleurTexteAtt}; font-size:13px; font-style:italic; margin:4px 0 16px;">"${message}"</p>` : ""}
        <div style="height:1px; background:rgba(201,162,39,0.3); margin:16px 0;"></div>
        <p style="color:${couleurTexte}; font-size:36px; font-weight:bold; margin:0;">
          ${article.montant} <span style="color:#C9A227; font-size:18px;">€</span>
        </p>
        <p style="color:${couleurTexteAtt}; font-size:11px; letter-spacing:2px; margin-top:16px;">
          ${code}
        </p>
      </div>
    </div>
  `;
}

async function ajouterPoints(email, montant) {
  if (!email) return;
  const { data: profil } = await supabase
    .from("profils")
    .select("id, points")
    .ilike("email", email)
    .maybeSingle();
  if (profil) {
    await supabase
      .from("profils")
      .update({ points: (profil.points || 0) + Math.floor(montant) })
      .eq("id", profil.id);
  }
}

const centimes = (euros) => Math.round(Number(euros) * 100);

// ---------------------------------------------------------------------------
// ACHAT DE CARTES (boutique)
// ---------------------------------------------------------------------------
export async function traiterPaiementPanier(sessionOuId) {
  const session =
    typeof sessionOuId === "string"
      ? await stripe.checkout.sessions.retrieve(sessionOuId)
      : sessionOuId;

  if (session.payment_status !== "paid") {
    return { ok: false, code: 400, erreur: "Paiement non confirmé" };
  }
  const panierId = session.metadata?.panier_id;
  if (session.metadata?.type !== "panier" || !panierId) {
    return { ok: false, code: 400, erreur: "Paiement non reconnu" };
  }

  // 1) On « réserve » le panier : une seule exécution peut passer de en_attente à en_cours
  const { data: panier } = await supabase
    .from("paniers")
    .update({ statut: "en_cours", stripe_session_id: session.id })
    .eq("id", panierId)
    .eq("statut", "en_attente")
    .select("*")
    .maybeSingle();

  if (!panier) {
    // Déjà traité (ou en cours de traitement) : on ne livre rien une deuxième fois
    return { ok: true, dejaTraite: true };
  }

  // 2) Le montant payé doit correspondre EXACTEMENT au panier enregistré (moins le cashback utilisé)
  const cashbackUtilise = Number(panier.cashback_utilise) || 0;
  const attendu = centimes(panier.montant_total) - centimes(cashbackUtilise);
  if (session.amount_total !== attendu || session.currency !== "eur") {
    await supabase.from("paniers").update({ statut: "anomalie" }).eq("id", panier.id);
    console.error("Montant Stripe différent du panier", panier.id, session.amount_total, panier.montant_total);
    return { ok: false, code: 400, erreur: "Montant incohérent, commande bloquée pour vérification" };
  }

  const emailAcheteur = panier.email_acheteur;
  const maintenant = new Date();

  // Le cashback réservé pour cette commande est définitivement utilisé
  if (cashbackUtilise > 0) {
    await supabase.rpc("cashback_confirmer", { p_panier: panier.id });
  }

  // Profil du client (pour les points et le cashback) — lu AVANT d'ajouter les points de cette commande
  let profil = null;
  if (panier.profil_id) {
    ({ data: profil } = await supabase.from("profils").select("id, points").eq("id", panier.profil_id).maybeSingle());
  }
  if (!profil) {
    ({ data: profil } = await supabase.from("profils").select("id, points").ilike("email", emailAcheteur).maybeSingle());
  }
  const pointsAvant = profil?.points || 0;

  for (const article of panier.articles) {
    const code = genererCode();
    const emailDestinataire = article.emailBeneficiaire || emailAcheteur;

    let dateHeureEnvoi = null;
    if (article.dateEnvoi && article.heureEnvoi) {
      dateHeureEnvoi = new Date(`${article.dateEnvoi}T${article.heureEnvoi}:00`);
    }
    const joursAvant = dateHeureEnvoi
      ? (dateHeureEnvoi.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    const statut = dateHeureEnvoi && joursAvant > 30 ? "a_programmer" : "payee";

    await supabase.from("commandes").insert({
      email_acheteur: emailAcheteur,
      email_beneficiaire: article.emailBeneficiaire || null,
      email_destinataire: emailDestinataire,
      marque: article.marque,
      montant: article.montant,
      beneficiaire: article.beneficiaire,
      message: article.message,
      design: article.design,
      code: chiffrerCode(code),
      date_envoi: article.dateEnvoi,
      heure_envoi: article.heureEnvoi,
      statut,
    });

    if (statut === "payee") await ajouterPoints(emailAcheteur, article.montant);
    if (statut === "a_programmer") continue;

    const optionsEnvoi = {
      from: "Estalviar <onboarding@resend.dev>",
      to: emailDestinataire,
      subject: `Votre carte cadeau ${article.marque}`,
      html: construireEmailCarte({ article, code }),
    };
    if (dateHeureEnvoi && joursAvant > 0) {
      optionsEnvoi.scheduledAt = dateHeureEnvoi.toISOString();
    }
    try {
      await resend.emails.send(optionsEnvoi);
    } catch (e) {
      console.error("Email non envoyé (la carte reste renvoyable depuis l'admin)", e);
    }
  }

  // CASHBACK GAGNÉ
  // • Avec un code influenceuse : le cashback du code REMPLACE le cashback fidélité.
  // • Sinon : selon le palier, la notoriété et la marge de chaque marque.
  // Une commande payée (même en partie) avec du cashback ne rapporte PAS de nouveau cashback.
  // Les points de fidélité (palier) sont ajoutés dans tous les cas, plus haut.
  if (profil && cashbackUtilise === 0) {
    try {
      const slugs = panier.articles.map((a) => a.slug).filter(Boolean);
      const [{ data: marges }, { data: fiches }] = await Promise.all([
        supabase.from("marges_marques").select("slug, marge").in("slug", slugs),
        supabase.from("catalogue").select("slug, notoriete, categorie").in("slug", slugs),
      ]);
      const infos = {};
      const margesParSlug = {};
      const categoriesParSlug = {};
      (marges || []).forEach((m) => {
        infos[m.slug] = { marge: m.marge };
        margesParSlug[m.slug] = Number(m.marge);
      });
      (fiches || []).forEach((f) => {
        infos[f.slug] = { ...(infos[f.slug] || {}), notoriete: f.notoriete };
        categoriesParSlug[f.slug] = f.categorie;
      });
      const dateCommande = new Date().toLocaleDateString("fr-FR");

      let codeApplique = false;
      if (panier.code_influence_id) {
        const { data: fiche } = await supabase
          .from("codes_influence")
          .select("id, code, categories, marques")
          .eq("id", panier.code_influence_id)
          .maybeSingle();
        const calcul = calculerCode(panier.articles, margesParSlug, filtreCartes(fiche, categoriesParSlug));
        if (fiche && calcul.cashbackAbonne > 0) {
          // La base revérifie TOUTES les conditions du code (période, quantité, limite par client)
          // en le verrouillant : deux paiements simultanés ne peuvent pas dépasser les limites.
          // La période est jugée à la date où le client a lancé sa commande.
          const { data: resultatCode, error: erreurCode } = await supabase.rpc("code_enregistrer_utilisation", {
            p_code: fiche.id,
            p_panier: panier.id,
            p_profil: profil.id,
            p_montant: panier.montant_total,
            p_cashback: calcul.cashbackAbonne,
            p_commission: calcul.commission,
            p_date: panier.created_at || new Date().toISOString(),
          });
          if (erreurCode || resultatCode !== "ok") {
            console.error("Code partenaire non appliqué", panier.id, erreurCode?.message || resultatCode);
          } else {
            await supabase.rpc("cashback_crediter", {
              p_profil: profil.id,
              p_montant: calcul.cashbackAbonne,
              p_panier: panier.id,
              p_jours_attente: REGLES_CASHBACK.joursAttente,
              p_description: `Commande du ${dateCommande} (code ${fiche.code})`,
            });
            codeApplique = true;
          }
        }
      }

      if (!codeApplique) {
        const gain = calculerCashbackGagne(panier.articles, infos, pointsAvant);
        if (gain.montant > 0) {
          await supabase.rpc("cashback_crediter", {
            p_profil: profil.id,
            p_montant: gain.montant,
            p_panier: panier.id,
            p_jours_attente: REGLES_CASHBACK.joursAttente,
            p_description: `Commande du ${dateCommande} (palier ${gain.palier})`,
          });
        }
      }
    } catch (e) {
      console.error("Cashback non crédité", panier.id, e);
    }
  }

  await supabase
    .from("paniers")
    .update({ statut: "traite", traite_le: new Date().toISOString() })
    .eq("id", panier.id);

  return { ok: true };
}

// Paiement abandonné ou expiré : on rend le cashback réservé
export async function libererPanierAbandonne(session) {
  const panierId = session?.metadata?.panier_id;
  if (session?.metadata?.type !== "panier" || !panierId) return;
  const { data: panier } = await supabase
    .from("paniers")
    .update({ statut: "abandonne" })
    .eq("id", panierId)
    .eq("statut", "en_attente")
    .select("id")
    .maybeSingle();
  if (panier) await supabase.rpc("cashback_liberer", { p_panier: panier.id });
}

// ---------------------------------------------------------------------------
// CONTRIBUTION À UNE CAGNOTTE
// ---------------------------------------------------------------------------
export async function traiterPaiementContribution(sessionOuId, contributionIdAttendu) {
  const session =
    typeof sessionOuId === "string"
      ? await stripe.checkout.sessions.retrieve(sessionOuId)
      : sessionOuId;

  if (session.payment_status !== "paid") {
    return { ok: false, code: 400, erreur: "Paiement non confirmé" };
  }

  // Le paiement doit appartenir à CETTE contribution (lien écrit par le serveur dans Stripe)
  const contributionId = session.metadata?.contribution_id;
  if (session.metadata?.type !== "contribution" || !contributionId) {
    return { ok: false, code: 400, erreur: "Paiement non reconnu" };
  }
  if (contributionIdAttendu && String(contributionIdAttendu) !== String(contributionId)) {
    return { ok: false, code: 400, erreur: "Ce paiement ne correspond pas à cette contribution" };
  }

  // Réservation : une seule exécution peut passer de en_attente à payee
  const { data: contribution } = await supabase
    .from("contributions_cagnotte")
    .update({ statut: "payee" })
    .eq("id", contributionId)
    .eq("statut", "en_attente")
    .select("*")
    .maybeSingle();

  if (!contribution) return { ok: true, dejaTraite: true };

  if (session.amount_total !== centimes(contribution.montant) || session.currency !== "eur") {
    await supabase.from("contributions_cagnotte").update({ statut: "anomalie" }).eq("id", contribution.id);
    console.error("Montant Stripe différent de la contribution", contribution.id);
    return { ok: false, code: 400, erreur: "Montant incohérent, contribution bloquée pour vérification" };
  }

  const { data: cagnotte } = await supabase
    .from("cagnottes")
    .select("*")
    .eq("id", contribution.cagnotte_id)
    .single();

  const nouveauMontant = (Number(cagnotte.montant_collecte) || 0) + Number(contribution.montant);
  const complete = nouveauMontant >= cagnotte.montant_objectif;

  // Le statut ne change que si la cagnotte est encore ouverte (jamais de réouverture après clôture)
  const majCagnotte = { montant_collecte: nouveauMontant };
  if (["ouverte", "complete"].includes(cagnotte.statut)) {
    majCagnotte.statut = complete ? "complete" : "ouverte";
  } else {
    console.error("Contribution payée après la clôture de la cagnotte", cagnotte.id, contribution.id);
  }
  await supabase.from("cagnottes").update(majCagnotte).eq("id", cagnotte.id);

  if (contribution.email_contributeur) {
    await supabase.from("commandes").insert({
      email_acheteur: contribution.email_contributeur,
      marque: `Cagnotte ${cagnotte.marque}`,
      montant: contribution.montant,
      beneficiaire: cagnotte.beneficiaire,
      message: contribution.message || null,
      design: cagnotte.design,
      statut: "payee",
    });
    await ajouterPoints(contribution.email_contributeur, contribution.montant);
  }

  return { ok: true };
}
