// Couleurs des cartes dans la vitrine (accueil + boutique).
// Une marque avec sa propre couleur dans le catalogue la garde ; sinon elle prend la couleur de sa catégorie.

export const COULEUR_PAR_DEFAUT = "#3A5A8C";

export const COULEURS_CATEGORIES = {
  "Mode & chaussures": "#E5604D",
  Mode: "#E5604D",
  Sport: "#2E7D6B",
  "High-tech & multimédia": "#3A5A8C",
  "Culture & High-tech": "#3A5A8C",
  "Jeux vidéo": "#6B3FA0",
  "Gastronomie & restaurants": "#B5563F",
  "Beauté & bien-être": "#B4547A",
  "Voyages & expériences": "#2B7A99",
  "Maison & jardin": "#5F7A34",
  "Livres, loisirs & enfants": "#C27C1E",
  "Streaming & abonnements": "#4A3C8C",
  "Engagés & solidaires": "#2E7D6B",
  Généraliste: "#9C7A14",
  Shopping: "#9C7A14",
  Autres: "#5B3A5C",
};

// Couleur « générique » donnée par l'import Tillo à toutes les marques : on l'ignore
const COULEURS_GENERIQUES = ["#1b3a5c", "#1B3A5C", ""];

export function couleurCarte(carte) {
  if (carte?.couleur && !COULEURS_GENERIQUES.includes(carte.couleur)) return carte.couleur;
  return COULEURS_CATEGORIES[carte?.categorie] || COULEUR_PAR_DEFAUT;
}

export const couleurCategorie = (categorie) => COULEURS_CATEGORIES[categorie] || COULEUR_PAR_DEFAUT;

// Fond « carte cadeau » : couleur vive en haut à gauche, qui fonce vers le bas à droite
export const fondCarte = (couleur) =>
  `linear-gradient(140deg, ${couleur} 0%, color-mix(in srgb, ${couleur} 55%, #0d1022) 100%)`;

// Logo posé directement sur une carte de couleur (sans cadre blanc) :
// les logos dessinés (SVG) passent en blanc, comme un marquage sur une vraie carte cadeau.
// Exceptions : les logos qui ont déjà leur propre pavé de couleur, qui deviendraient méconnaissables.
const LOGOS_AVEC_PAVE = ["fnac", "darty", "steam"];
export const logoEnBlanc = (carte) =>
  !!carte?.image && carte.image.toLowerCase().endsWith(".svg") && !LOGOS_AVEC_PAVE.includes(carte.slug);
