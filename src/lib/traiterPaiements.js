// Traitement des paiements Stripe confirmés — UNIQUEMENT côté serveur.
// Utilisé par la page de confirmation ET par le webhook Stripe.
// Chaque paiement n'est traité qu'une seule fois, même si on l'appelle plusieurs fois.

import crypto from "node:crypto";
import Stripe from "stripe";
import { Resend } from "resend";
import { createClient } from "@supabase/supabase-js";
import { chiffrerCode } from "./chiffrement";
import { echapperHtml } from "./designs";
import {
  SITE, EXPEDITEUR, JOURS_MAX_PROGRAMMATION, genererCode, construireEmailCarte, dateHeureParis,
} from "./emailCarte";
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from "./emailTemplate";
import { calculerCashbackGagne, REGLES_CASHBACK } from "./cashback";
import { calculerCode, filtreCartes } from "./codeInfluence";
import { noterEnvoi } from "./suiviEnvoi";
import {
  creerFacture, pdfFacture, nomFichierFacture, donneesFacturePanier, donneesFactureContribution, euros,
} from "./factures";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Pour comparer des emails sans tenir compte des majuscules : « _ » et « % » sont des jokers
// dans ilike, on les neutralise (sinon « jea_@x.fr » pourrait désigner « jean@x.fr »).
export const emailExact = (email) => String(email).replace(/[\\%_]/g, (c) => `\\${c}`);

// Renvoie true si l'email correspond à un compte (les points ont été ajoutés)
async function ajouterPoints(email, montant) {
  if (!email) return false;
  const { data: profil } = await supabase
    .from("profils")
    .select("id, points")
    .ilike("email", emailExact(email))
    .maybeSingle();
  if (profil) {
    await supabase
      .from("profils")
      .update({ points: (profil.points || 0) + Math.floor(montant) })
      .eq("id", profil.id);
    return true;
  }
  return false;
}

// Email de remerciement au participant d'une cagnotte (+ invitation à créer un compte)
function construireEmailMerciContribution({ contribution, cagnotte, compteExiste, avecFacture }) {
  const nom = echapperHtml(contribution.nom_contributeur);
  const beneficiaire = echapperHtml(cagnotte.beneficiaire);
  const montant = Number(contribution.montant);
  const points = Math.floor(montant);
  const lienCagnotte = `${SITE}/fr/cagnotte/${encodeURIComponent(cagnotte.slug)}`;
  const lienInscription = `${SITE}/fr/inscription?email=${encodeURIComponent(contribution.email_contributeur)}`;

  let contenu =
    titreEmail("Merci pour votre participation !") +
    texteEmail(`${nom ? `Bonjour ${nom},<br/><br/>` : ""}Votre participation de <strong>${montant} €</strong> à la cagnotte pour <strong>${beneficiaire}</strong> a bien été enregistrée.${avecFacture ? " Votre facture est jointe à cet email." : ""}`);

  if (compteExiste) {
    contenu += texteEmail(`Elle vous rapporte <strong>${points} point${points > 1 ? "s" : ""} de fidélité</strong> sur votre compte Estalviar.`);
    contenu += boutonEmail({ texte: "Voir la cagnotte", lien: lienCagnotte });
  } else {
    contenu += texteEmail(
      `Créez votre compte Estalviar avec cette adresse email : cette participation comptera aussitôt pour votre palier fidélité (<strong>${points} point${points > 1 ? "s" : ""}</strong>), et vos prochains achats vous rapporteront du cashback.`
    );
    contenu += boutonEmail({ texte: "Créer mon compte", lien: lienInscription });
    contenu += texteEmail(`<a href="${lienCagnotte}" style="color:#C9A227;">Voir la cagnotte</a>`);
  }
  return enveloppeEmail({ titre: "Merci pour votre participation", contenuHtml: contenu, siteUrl: SITE });
}

const centimes = (montant) => Math.round(Number(montant) * 100);

// Facture : créée une seule fois par paiement, puis jointe à l'email (en pièce jointe PDF)
async function factureEnPieceJointe(donnees) {
  try {
    const facture = await creerFacture(supabase, donnees);
    const pdf = await pdfFacture(facture);
    return { facture, pieceJointe: { filename: nomFichierFacture(facture), content: Buffer.from(pdf) } };
  } catch (e) {
    console.error("Facture non créée", donnees.panier_id || donnees.contribution_id, e);
    return { facture: null, pieceJointe: null };
  }
}

// Email « Commande confirmée » envoyé à l'acheteur, avec sa facture
function construireEmailConfirmation({ panier, facture, compteExiste }) {
  const quand = (a) => {
    const date = dateHeureParis(a.dateEnvoi, a.heureEnvoi);
    if (!date || date <= new Date()) return "Envoyée maintenant";
    return `Envoi prévu le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" })} à ${a.heureEnvoi}`;
  };
  // Commande groupée : une ligne par enseigne et par montant (« 25 × Fnac »), le détail est dans la facture
  const groupee = (panier.articles || []).length > 12;
  let lignesGroupees = "";
  if (groupee) {
    const groupes = {};
    for (const a of panier.articles) {
      const cle = `${a.marque}|${a.montant}`;
      groupes[cle] = groupes[cle] || { marque: a.marque, montant: Number(a.montant), n: 0 };
      groupes[cle].n += 1;
    }
    const premier = panier.articles[0];
    lignesGroupees = Object.values(groupes).map((g) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #eee; font-family:Arial, sans-serif; font-size:14px; color:#12172B;">
        <strong>${g.n} × ${echapperHtml(g.marque)}</strong> de ${euros(g.montant)}
        <div style="font-size:12px; color:#777; margin-top:3px;">${quand(premier)}, chacune à son destinataire</div>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #eee; font-family:Arial, sans-serif; font-size:14px; color:#12172B; text-align:right; white-space:nowrap; vertical-align:top;">${euros(g.n * g.montant)}</td>
    </tr>`).join("");
  }
  const lignes = groupee ? lignesGroupees : (panier.articles || []).map((a) => `
    <tr>
      <td style="padding:12px 0; border-bottom:1px solid #eee; font-family:Arial, sans-serif; font-size:14px; color:#12172B;">
        <strong>${echapperHtml(a.marque)}</strong>${a.beneficiaire ? ` pour ${echapperHtml(a.beneficiaire)}` : ""}
        <div style="font-size:12px; color:#777; margin-top:3px;">${quand(a)}${a.emailBeneficiaire ? ` à ${echapperHtml(a.emailBeneficiaire)}` : ""}</div>
      </td>
      <td style="padding:12px 0; border-bottom:1px solid #eee; font-family:Arial, sans-serif; font-size:14px; color:#12172B; text-align:right; white-space:nowrap; vertical-align:top;">${euros(a.montant)}</td>
    </tr>`).join("");
  const cashback = Number(panier.cashback_utilise) || 0;
  const ligneTotal = (libelle, montant, fort) => `
    <tr>
      <td style="padding:6px 0 0; font-family:Arial, sans-serif; font-size:${fort ? 15 : 13}px; color:${fort ? "#12172B" : "#777"}; ${fort ? "font-weight:bold;" : ""}">${libelle}</td>
      <td style="padding:6px 0 0; font-family:Arial, sans-serif; font-size:${fort ? 15 : 13}px; color:#12172B; text-align:right; ${fort ? "font-weight:bold;" : ""}">${montant}</td>
    </tr>`;

  let contenu =
    titreEmail("Merci pour votre commande") +
    texteEmail(`Votre paiement est confirmé. Voici le récapitulatif${facture ? ` de la commande <strong>${facture.numero}</strong>` : ""} :`) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${lignes}
      ${cashback > 0 ? ligneTotal("Réglé avec votre cashback", `- ${euros(cashback)}`) : ""}
      ${ligneTotal("Total payé", euros(Number(panier.montant_total) - cashback), true)}
    </table>`;
  contenu += texteEmail(
    facture
      ? "Votre facture est jointe à cet email (PDF)."
      : "Votre facture sera disponible sous peu ; si besoin, écrivez-nous à info@estalviar.com."
  );
  contenu += compteExiste
    ? boutonEmail({ texte: "Voir mes commandes", lien: `${SITE}/fr/profil?onglet=commandes` })
    : texteEmail(`Chaque carte est envoyée par email à la date choisie. Avec un <a href="${SITE}/fr/inscription?email=${encodeURIComponent(panier.email_acheteur)}" style="color:#C9A227;">compte Estalviar</a>, vous suivez vos envois et gagnez du cashback.`);
  return enveloppeEmail({ titre: "Merci pour votre commande", contenuHtml: contenu, siteUrl: SITE });
}

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
    ({ data: profil } = await supabase.from("profils").select("id, points").ilike("email", emailExact(emailAcheteur)).maybeSingle());
  }
  const pointsAvant = profil?.points || 0;

  // 3) Toutes les cartes sont enregistrées en une seule fois (rapide, même pour une commande groupée de 100 cartes)
  const cartes = panier.articles.map((article) => {
    const code = genererCode();
    const emailDestinataire = article.emailBeneficiaire || emailAcheteur;
    // Date et heure choisies par le client = heure de Paris
    const dateHeureEnvoi = dateHeureParis(article.dateEnvoi, article.heureEnvoi);
    const joursAvant = dateHeureEnvoi
      ? (dateHeureEnvoi.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
      : 0;
    // Trop loin pour Resend : la tâche quotidienne « envoyer-cartes-programmees » l'enverra plus tard
    const statut = dateHeureEnvoi && joursAvant > JOURS_MAX_PROGRAMMATION ? "a_programmer" : "payee";
    return {
      article, code, emailDestinataire, statut,
      programmeeLe: dateHeureEnvoi && joursAvant > 0 ? dateHeureEnvoi.toISOString() : null,
      jeton: crypto.randomUUID(),
    };
  });

  const { data: cartesEnregistrees, error: erreurCartes } = await supabase.from("commandes").insert(
    cartes.map(({ article, code, emailDestinataire, statut, jeton }) => ({
      panier_id: panier.id, // lien vers le panier : sert à annuler le cashback si la carte est remboursée
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
      jeton_carte: jeton,
    }))
  ).select("id, jeton_carte");
  if (erreurCartes) {
    // Rien n'est livré : le panier passe en anomalie pour être traité à la main (le paiement est bien reçu)
    await supabase.from("paniers").update({ statut: "anomalie" }).eq("id", panier.id);
    console.error("Cartes NON enregistrées", panier.id, erreurCartes);
    return { ok: false, code: 500, erreur: "Enregistrement des cartes impossible, commande bloquée pour vérification" };
  }

  // Les cartes sont payées : les points comptent tout de suite, même si l'envoi est programmé plus tard
  await ajouterPoints(emailAcheteur, panier.articles.reduce((s, a) => s + Math.floor(Number(a.montant) || 0), 0));

  // 4) Emails des cartes, par paquets de 100 (envoi groupé Resend, programmation comprise)
  const idParJeton = Object.fromEntries((cartesEnregistrees || []).map((c) => [c.jeton_carte, c.id]));
  const cartesAEnvoyer = cartes.filter((c) => c.statut !== "a_programmer");
  const aEnvoyer = cartesAEnvoyer
    .map((c) => ({
      from: EXPEDITEUR,
      to: c.emailDestinataire,
      subject: `Votre carte cadeau ${c.article.marque}`,
      html: construireEmailCarte({ article: c.article, code: c.code, jeton: c.jeton }),
      ...(c.programmeeLe ? { scheduledAt: c.programmeeLe } : {}),
    }));
  for (let i = 0; i < aEnvoyer.length; i += 100) {
    const paquet = aEnvoyer.slice(i, i + 100);
    try {
      // Resend ne lève pas d'erreur : il la renvoie dans { error }
      const reponse = paquet.length === 1
        ? await resend.emails.send(paquet[0])
        : await resend.batch.send(paquet);
      if (reponse.error) throw new Error(reponse.error.message || JSON.stringify(reponse.error));
      // Suivi : chaque carte garde l'identifiant de son email (même ordre que l'envoi)
      const ids = paquet.length === 1 ? [reponse.data?.id] : (reponse.data?.data || []).map((e) => e.id);
      await Promise.all(paquet.map((p, k) => {
        const carte = cartesAEnvoyer[i + k];
        return noterEnvoi(supabase, idParJeton[carte.jeton], ids[k], { programme: !!carte.programmeeLe });
      }));
    } catch (e) {
      console.error("Emails de cartes NON envoyés (renvoyables depuis l'admin)", panier.id, paquet.map((p) => p.to), e);
    }
  }

  // CONFIRMATION + FACTURE à l'acheteur
  const { facture, pieceJointe } = await factureEnPieceJointe(donneesFacturePanier(panier, session.id));
  try {
    const { error: erreurConfirmation } = await resend.emails.send({
      from: EXPEDITEUR,
      to: emailAcheteur,
      subject: facture ? `Commande confirmée (${facture.numero})` : "Commande confirmée",
      html: construireEmailConfirmation({ panier, facture, compteExiste: !!profil }),
      ...(pieceJointe ? { attachments: [pieceJointe] } : {}),
    });
    if (erreurConfirmation) throw new Error(erreurConfirmation.message || JSON.stringify(erreurConfirmation));
  } catch (e) {
    console.error("Email de confirmation non envoyé", panier.id, e);
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
      const dateCommande = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

      // Le cashback (et la commission) se débloque 14 jours après la LIVRAISON de la dernière carte
      // de la commande : une carte programmée dans 2 mois → 2 mois + 14 jours.
      const livraison = panier.articles.reduce((plusTard, a) => {
        const quand = dateHeureParis(a.dateEnvoi, a.heureEnvoi);
        return quand && quand > plusTard ? quand : plusTard;
      }, new Date());
      const disponibleLe = new Date(livraison.getTime() + REGLES_CASHBACK.joursAttente * 86400000).toISOString();

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
            await supabase
              .from("utilisations_code")
              .update({ payable_le: disponibleLe })
              .eq("panier_id", panier.id);
            await supabase.rpc("cashback_crediter_le", {
              p_profil: profil.id,
              p_montant: calcul.cashbackAbonne,
              p_panier: panier.id,
              p_disponible_le: disponibleLe,
              p_description: `Commande du ${dateCommande} (code ${fiche.code})`,
            });
            codeApplique = true;
          }
        }
      }

      if (!codeApplique) {
        const gain = calculerCashbackGagne(panier.articles, infos, pointsAvant);
        if (gain.montant > 0) {
          await supabase.rpc("cashback_crediter_le", {
            p_profil: profil.id,
            p_montant: gain.montant,
            p_panier: panier.id,
            p_disponible_le: disponibleLe,
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
    // Les cagnottes comptent pour le palier (points) mais ne rapportent pas de cashback
    const compteExiste = await ajouterPoints(contribution.email_contributeur, contribution.montant);

    const { pieceJointe } = await factureEnPieceJointe(donneesFactureContribution(contribution, cagnotte, session.id));
    try {
      await resend.emails.send({
        from: EXPEDITEUR,
        to: contribution.email_contributeur,
        subject: `Merci pour votre participation à la cagnotte pour ${cagnotte.beneficiaire}`,
        html: construireEmailMerciContribution({ contribution, cagnotte, compteExiste, avecFacture: !!pieceJointe }),
        ...(pieceJointe ? { attachments: [pieceJointe] } : {}),
      });
    } catch (e) {
      console.error("Email de remerciement non envoyé", contribution.id, e);
    }
  }

  return { ok: true };
}
