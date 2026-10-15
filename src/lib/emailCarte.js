// Email d'une carte cadeau + outils communs à l'envoi des cartes (côté serveur).
// Utilisé par : le paiement (traiterPaiements), le renvoi d'une carte, l'envoi des cartes programmées.

import crypto from "node:crypto";
import { echapperHtml, trouverDesign } from "./designs";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://estalviar.com";
// Adresse d'expédition de tous les emails du site (domaine vérifié chez Resend)
export const EXPEDITEUR = "Estalviar <commandes@estalviar.com>";
// Quand un client clique sur « Répondre », sa réponse arrive ici
export const REPONDRE_A = "info@estalviar.com";

// Resend accepte les envois programmés jusqu'à 30 jours à l'avance.
// Au-delà, la carte est mise « à programmer » et la tâche quotidienne l'envoie le moment venu.
export const JOURS_MAX_PROGRAMMATION = 29;

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Code provisoire (en attendant les vrais codes Tillo), généré de façon imprévisible
export function genererCode() {
  const bloc = () =>
    Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join("");
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

/**
 * Date + heure choisies par le client, comprises à l'heure de PARIS
 * (le serveur, lui, tourne à l'heure UTC : sans ça, 9h00 devenait 11h00 en été).
 * @returns Date ou null
 */
export function dateHeureParis(date, heure) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "") || !/^\d{2}:\d{2}$/.test(heure || "")) return null;
  const commeSiUtc = new Date(`${date}T${heure}:00Z`);
  if (isNaN(commeSiUtc)) return null;
  const decalage = (instant) => {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/Paris",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
      })
        .formatToParts(instant)
        .map((x) => [x.type, x.value])
    );
    const heureParisCommeUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return heureParisCommeUtc - instant.getTime();
  };
  // Deux passes pour tomber juste aux changements d'heure
  let resultat = new Date(commeSiUtc.getTime() - decalage(commeSiUtc));
  resultat = new Date(commeSiUtc.getTime() - decalage(resultat));
  return resultat;
}

/**
 * Retrouve le logo et le fond d'une carte à partir de la commande enregistrée
 * (marque + nom du design), grâce au catalogue.
 */
export async function articleDepuisCommande(supabase, commande) {
  const nomMarque = String(commande.marque || "").replace(/^Cagnotte\s*/i, "").trim();
  const { data: fiche } = await supabase
    .from("catalogue")
    .select("nom, image, couleur")
    .ilike("nom", nomMarque.replace(/[\\%_]/g, (c) => `\\${c}`))
    .maybeSingle();
  const design = trouverDesign(commande.design, fiche?.couleur);
  return {
    marque: fiche?.nom || nomMarque,
    image: fiche?.image || "",
    montant: commande.montant,
    beneficiaire: commande.beneficiaire,
    message: commande.message,
    background: design.background,
    texteFonce: design.texteFonce,
  };
}

/** Lien vers la page en ligne d'une carte (à partir de son jeton secret) */
export const lienCarte = (jeton) => (jeton ? `${SITE}/fr/carte/${jeton}` : null);

/** Bouton « Voir ma carte en ligne » à placer sous une carte dans un email */
export function boutonVoirCarte(jeton) {
  const lien = lienCarte(jeton);
  if (!lien) return "";
  return `
    <div style="text-align:center; margin: 18px 0 4px;">
      <a href="${lien}" style="display:inline-block; background:#C9A227; color:#12172B; font-family: Arial, sans-serif; font-size:14px; font-weight:bold; text-decoration:none; padding:12px 24px; border-radius:8px;">
        Voir ma carte en ligne
      </a>
      <p style="margin:8px 0 0; font-family: Arial, sans-serif; font-size:11px; color:rgba(246,242,233,0.5);">Pour copier le code facilement, ou l'imprimer.</p>
    </div>
  `;
}

export function construireEmailCarte({ article, code, mention, jeton }) {
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
          ${echapperHtml(article.montant)} <span style="color:#C9A227; font-size:18px;">€</span>
        </p>
        <p style="color:${couleurTexteAtt}; font-size:11px; letter-spacing:2px; margin-top:16px;">
          ${echapperHtml(code)}
        </p>
      </div>
      ${boutonVoirCarte(jeton)}
      ${mention ? `<p style="color:rgba(246,242,233,0.4); font-size:11px; text-align:center; margin-top:16px;">${echapperHtml(mention)}</p>` : ""}
    </div>
  `;
}
