// Factures et avoirs : création (numéro continu, côté base) et fichier PDF.
// UNIQUEMENT côté serveur.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { INFOS_LEGALES } from "./infosLegales";

const ENCRE = rgb(0.07, 0.09, 0.17);       // #12172B
const GRIS = rgb(0.42, 0.44, 0.5);
const FILET = rgb(0.85, 0.83, 0.78);
const OR = rgb(0.79, 0.64, 0.15);          // #C9A227

/** 1234.5 → « 1 234,50 € » (espaces simples : le PDF n'accepte pas les espaces fines) */
export function euros(n) {
  const negatif = Number(n) < 0;
  const [ent, dec] = (Math.round(Math.abs(Number(n || 0)) * 100) / 100).toFixed(2).split(".");
  return `${negatif ? "- " : ""}${ent.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${dec} €`;
}

/** Date au format 15/10/2026, à l'heure de Paris */
export const dateFr = (d) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

const texteCourt = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "") || null;
const arrondi = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Coordonnées de société saisies au paiement, nettoyées.
 * Renvoie null si rien d'utile n'a été saisi.
 */
export function nettoyerFacturation(f) {
  if (!f || typeof f !== "object") return null;
  const societe = texteCourt(f.societe, 120);
  const adresse = texteCourt(f.adresse, 300);
  if (!societe) return null;
  return {
    societe,
    adresse,
    siren: texteCourt(String(f.siren || "").replace(/[^0-9 ]/g, ""), 20),
    tva: texteCourt(String(f.tva || "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase(), 20),
  };
}

/**
 * Crée la facture (ou renvoie celle qui existe déjà pour cette commande).
 * @returns la ligne de la table « factures »
 */
export async function creerFacture(supabase, donnees) {
  const { data, error } = await supabase.rpc("facture_creer", { p: donnees });
  if (error) throw new Error(error.message);
  return data;
}

/** Crée l'avoir d'une carte remboursée (ou renvoie celui qui existe déjà) */
export async function creerAvoir(supabase, donnees) {
  const { data, error } = await supabase.rpc("avoir_creer", { p: donnees });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Lignes de facture d'un panier.
 * Les cartes identiques (même enseigne, même montant) sont regroupées quand la commande est grande
 * (commande en lot) : « Carte cadeau Nike de 50 € » × 30.
 */
function lignesPanier(articles, regrouper) {
  if (!regrouper) {
    return articles.map((a) => ({
      libelle: `Carte cadeau ${a.marque}${a.beneficiaire ? ` (pour ${a.beneficiaire})` : ""}`,
      quantite: 1,
      prix_unitaire: Number(a.montant),
      total: Number(a.montant),
    }));
  }
  const groupes = new Map();
  for (const a of articles) {
    const cle = `${a.marque}|${Number(a.montant)}`;
    const g = groupes.get(cle) || { libelle: `Carte cadeau ${a.marque} de ${euros(a.montant).replace(",00", "")}`, quantite: 0, prix_unitaire: Number(a.montant), total: 0 };
    g.quantite += 1;
    g.total = arrondi(g.total + Number(a.montant));
    groupes.set(cle, g);
  }
  return [...groupes.values()];
}

/** Lignes et montants de la facture d'un panier payé */
export function donneesFacturePanier(panier, sessionId) {
  const articles = panier.articles || [];
  const total = Number(panier.montant_total);
  const cashback = Number(panier.cashback_utilise) || 0;
  return {
    type: "panier",
    panier_id: String(panier.id),
    email_client: panier.email_acheteur,
    client: panier.facturation || null,
    lignes: lignesPanier(articles, !!panier.lot || articles.length > 12),
    total,
    paye_cashback: cashback,
    paye_carte: arrondi(total - cashback),
    stripe_session_id: sessionId || null,
  };
}

/** Lignes et montants de la facture d'une participation à une cagnotte */
export function donneesFactureContribution(contribution, cagnotte, sessionId) {
  const montant = Number(contribution.montant);
  return {
    type: "contribution",
    contribution_id: String(contribution.id),
    email_client: contribution.email_contributeur,
    client: null,
    lignes: [{
      libelle: `Participation à la cagnotte pour ${cagnotte.beneficiaire || "un proche"}${cagnotte.marque ? ` (carte cadeau ${cagnotte.marque})` : ""}`,
      quantite: 1,
      prix_unitaire: montant,
      total: montant,
    }],
    total: montant,
    paye_cashback: 0,
    paye_carte: montant,
    stripe_session_id: sessionId || null,
  };
}

/**
 * Avoir d'une carte remboursée.
 * rembourseCarte : montant rendu sur la carte bancaire ; rembourseCashback : montant rendu en cashback.
 */
export function donneesAvoir({ commande, facture, rembourseCarte, rembourseCashback }) {
  const montant = Number(commande.montant);
  return {
    commande_id: String(commande.id),
    facture_origine: facture?.numero || null,
    email_client: facture?.email_client || commande.email_acheteur,
    client: facture?.client || null,
    lignes: [{
      libelle: `Remboursement : carte cadeau ${String(commande.marque || "").replace(/^Cagnotte\s*/i, "")}${commande.beneficiaire ? ` (pour ${commande.beneficiaire})` : ""}`,
      quantite: 1,
      prix_unitaire: montant,
      total: montant,
    }],
    total: montant,
    paye_cashback: arrondi(rembourseCashback || 0),
    paye_carte: arrondi(rembourseCarte ?? montant),
  };
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

/** Remplace les caractères que les polices standard du PDF ne savent pas écrire */
function rendreEcrivable(police, texte) {
  return Array.from(String(texte ?? "").normalize("NFC").replace(/[  ]/g, " "))
    .map((c) => {
      try {
        police.encodeText(c);
        return c;
      } catch {
        // Lettre accentuée inconnue (ś, ł…) : sans son accent ; émoji ou autre : retiré
        const simple = c.normalize("NFD").replace(/[̀-ͯ]/g, "");
        try {
          police.encodeText(simple);
          return simple;
        } catch {
          return "";
        }
      }
    })
    .join("")
    .replace(/ {2,}/g, " ");
}

/** Coupe un texte en lignes qui tiennent dans la largeur donnée */
function couper(police, texte, taille, largeur) {
  const lignes = [];
  for (const paragraphe of String(texte).split("\n")) {
    let ligne = "";
    for (const mot of paragraphe.split(/\s+/)) {
      const essai = ligne ? `${ligne} ${mot}` : mot;
      if (police.widthOfTextAtSize(essai, taille) > largeur && ligne) {
        lignes.push(ligne);
        ligne = mot;
      } else {
        ligne = essai;
      }
    }
    lignes.push(ligne);
  }
  return lignes;
}

const LARGEUR = 595.28;
const HAUTEUR = 841.89;   // A4
const G = 56;             // marge gauche
const D = LARGEUR - 56;   // bord droit
const BAS = 130;          // en dessous : mentions de bas de page

/** Fichier PDF d'une facture ou d'un avoir (Uint8Array) */
export async function pdfFacture(facture) {
  const avoir = facture.type === "avoir";
  const doc = await PDFDocument.create();
  doc.setTitle(`${avoir ? "Avoir" : "Facture"} ${facture.numero}`);
  doc.setAuthor("Estalviar");
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const titre = await doc.embedFont(StandardFonts.TimesRoman);
  const titreGras = await doc.embedFont(StandardFonts.TimesRomanBold);
  const I = INFOS_LEGALES;
  const signe = (n) => (avoir ? -Number(n) : Number(n));

  let page;
  let y;
  const ecrire = (texte, x, yy, { police = normal, taille = 9.5, couleur = ENCRE, aDroite = false } = {}) => {
    const t = rendreEcrivable(police, texte);
    const xx = aDroite ? x - police.widthOfTextAtSize(t, taille) : x;
    page.drawText(t, { x: xx, y: yy, size: taille, font: police, color: couleur });
  };
  const filet = (yy, epaisseur = 0.6, couleur = FILET) =>
    page.drawLine({ start: { x: G, y: yy }, end: { x: D, y: yy }, thickness: epaisseur, color: couleur });

  // Bas de chaque page : mentions légales et numéro de page
  const piedDePage = (numeroPage) => {
    const mentions = avoir
      ? ["Cet avoir annule et remplace, à hauteur du montant indiqué, la facture d'origine. Le remboursement est effectué sur le moyen de paiement utilisé lors de la commande."]
      : [
          "Les cartes cadeaux sont utilisables selon les conditions de chaque enseigne. Une carte dont le code a été envoyé ne peut être ni reprise ni remboursée (voir nos CGV).",
          "Clients professionnels : en cas de retard de paiement, pénalités au taux de 3 fois l'intérêt légal et indemnité forfaitaire pour frais de recouvrement de 40 €. Pas d'escompte pour paiement anticipé.",
        ];
    let yb = 92;
    filet(yb + 18);
    for (const m of mentions) {
      for (const l of couper(normal, m, 7.5, D - G)) {
        ecrire(l, G, yb, { taille: 7.5, couleur: GRIS });
        yb -= 10;
      }
      yb -= 4;
    }
    const pied = ["Estalviar", I.nom ? `${I.nom} EI` : null, I.siret ? `SIRET ${I.siret}` : null, "estalviar.com", I.email]
      .filter(Boolean).join("  |  ");
    ecrire(pied, G, 40, { taille: 7.5, couleur: GRIS });
    ecrire(`${facture.numero}  page ${numeroPage}`, D, 40, { taille: 7.5, couleur: GRIS, aDroite: true });
  };

  const colQte = 380, colPu = 460, colTotal = D;
  const enteteTableau = () => {
    filet(y + 14, 0.8, ENCRE);
    ecrire("Désignation", G, y, { police: gras, taille: 9 });
    ecrire("Qté", colQte, y, { police: gras, taille: 9, aDroite: true });
    ecrire("Prix unitaire", colPu, y, { police: gras, taille: 9, aDroite: true });
    ecrire("Montant", colTotal, y, { police: gras, taille: 9, aDroite: true });
    y -= 10;
    filet(y);
    y -= 16;
  };

  let numeroPage = 1;
  const nouvellePage = () => {
    page = doc.addPage([LARGEUR, HAUTEUR]);
    y = HAUTEUR - 64;
  };
  const pageSuivante = () => {
    piedDePage(numeroPage);
    numeroPage += 1;
    nouvellePage();
    ecrire(`${avoir ? "Avoir" : "Facture"} n° ${facture.numero} (suite)`, G, y, { police: gras, taille: 10 });
    y -= 34;
    enteteTableau();
  };

  // --- En-tête : la marque à gauche, le document à droite
  nouvellePage();
  ecrire("ESTALVIAR", G, y, { police: titreGras, taille: 22 });
  page.drawRectangle({ x: G + titreGras.widthOfTextAtSize("ESTALVIAR", 22) + 3, y, width: 4, height: 4, color: OR });
  ecrire(avoir ? "Avoir" : "Facture", D, y + 2, { police: titre, taille: 22, aDroite: true });
  y -= 22;
  ecrire(`N° ${facture.numero}`, D, y, { police: gras, taille: 10, aDroite: true });
  ecrire(`Émis${avoir ? "" : "e"} le ${dateFr(facture.emise_le)}`, D, y - 14, { aDroite: true, couleur: GRIS });
  ecrire(
    avoir
      ? (facture.facture_origine ? `Se rapporte à la facture ${facture.facture_origine}` : "Remboursement")
      : `Date de la vente : ${dateFr(facture.emise_le)}`,
    D, y - 28, { aDroite: true, couleur: GRIS }
  );

  // Vendeur
  const vendeur = [
    I.nom ? `${I.nom} EI` : null,
    "Estalviar",
    ...(I.adresse ? couper(normal, I.adresse, 9.5, 230) : []),
    I.siret ? `SIRET ${I.siret}` : null,
    I.rcs || null,
    I.email,
  ].filter(Boolean);
  vendeur.forEach((l, i) => ecrire(l, G, y - i * 14, { couleur: i === 0 ? ENCRE : GRIS, police: i === 0 ? gras : normal }));
  y -= Math.max(vendeur.length, 3) * 14 + 26;

  // --- Client
  ecrire(avoir ? "Client" : "Facturé à", G, y, { police: gras, taille: 9, couleur: GRIS });
  y -= 15;
  const c = facture.client || {};
  const client = [
    c.societe || null,
    ...(c.adresse ? couper(normal, c.adresse, 10, 260) : []),
    c.siren ? `SIREN ${c.siren}` : null,
    c.tva ? `N° TVA ${c.tva}` : null,
    facture.email_client,
  ].filter(Boolean);
  client.forEach((l, i) => ecrire(l, G, y - i * 14, { taille: 10, police: i === 0 && c.societe ? gras : normal }));
  y -= client.length * 14 + 26;

  // --- Tableau (sur plusieurs pages si besoin)
  enteteTableau();
  for (const l of facture.lignes || []) {
    const morceaux = couper(normal, rendreEcrivable(normal, l.libelle), 10, colQte - G - 50);
    if (y - morceaux.length * 13 - 22 < BAS) pageSuivante();
    morceaux.forEach((m, i) => ecrire(m, G, y - i * 13, { taille: 10 }));
    ecrire(String(l.quantite), colQte, y, { taille: 10, aDroite: true });
    ecrire(euros(l.prix_unitaire), colPu, y, { taille: 10, aDroite: true });
    ecrire(euros(signe(l.total)), colTotal, y, { taille: 10, aDroite: true });
    y -= morceaux.length * 13 + 8;
    filet(y + 2);
    y -= 14;
  }

  // --- Totaux (sur la page suivante s'il n'y a plus la place)
  if (y - 120 < BAS) pageSuivante();
  y -= 4;
  const ligneTotal = (libelle, montant, { fort = false } = {}) => {
    ecrire(libelle, colPu - 20, y, { aDroite: true, taille: fort ? 11 : 10, police: fort ? gras : normal, couleur: fort ? ENCRE : GRIS });
    ecrire(montant, colTotal, y, { aDroite: true, taille: fort ? 11 : 10, police: fort ? gras : normal });
    y -= fort ? 20 : 16;
  };
  if (avoir) {
    ligneTotal("Total de l'avoir", euros(-facture.total), { fort: true });
    if (Number(facture.paye_carte) > 0) ligneTotal("Remboursé sur la carte bancaire", euros(facture.paye_carte));
    if (Number(facture.paye_cashback) > 0) ligneTotal("Rendu en cashback Estalviar", euros(facture.paye_cashback));
    y -= 8;
    ecrire(`Remboursement enregistré le ${dateFr(facture.emise_le)}.`, G, y, { taille: 9.5 });
    y -= 15;
  } else {
    ligneTotal("Total", euros(facture.total), { fort: true });
    if (Number(facture.paye_cashback) > 0) ligneTotal("Réglé avec le cashback Estalviar", euros(-facture.paye_cashback));
    ligneTotal("Réglé par carte bancaire", euros(facture.paye_carte));
    ligneTotal("Reste à payer", euros(0));
    y -= 8;
    ecrire(`Facture acquittée le ${dateFr(facture.emise_le)} par carte bancaire (paiement en ligne Stripe).`, G, y, { taille: 9.5 });
    y -= 15;
  }
  if (I.tva) ecrire(I.tva, G, y, { taille: 9.5 });

  piedDePage(numeroPage);
  return doc.save();
}

/** Nom du fichier PDF : Facture-Estalviar-F2026-00001.pdf ou Avoir-Estalviar-A2026-00001.pdf */
export const nomFichierFacture = (facture) =>
  `${facture.type === "avoir" ? "Avoir" : "Facture"}-Estalviar-${facture.numero}.pdf`;
