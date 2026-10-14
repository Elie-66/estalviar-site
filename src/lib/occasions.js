// Idées de cadeaux par occasion (accueil + boutique ?occasion=…).
// Une enseigne fait partie d'une occasion si elle porte l'étiquette de l'occasion dans le catalogue
// (ex. « naissance »), ou si elle est dans une des catégories proposées pour cette occasion.

export const OCCASIONS = [
  {
    slug: "anniversaire",
    categories: ["Mode & chaussures", "Sport", "High-tech & multimédia", "Jeux vidéo", "Beauté & bien-être", "Voyages & expériences"],
    // icône : un gâteau
    icone: "M4 21h16M5 21v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6M5 16.5c1.2 0 1.8-1 3.5-1s2.3 1 3.5 1 1.8-1 3.5-1 2.3 1 3.5 1M12 13V9M12 6.5c.8 0 1.3-.6 1.3-1.3C13.3 4.3 12 3 12 3s-1.3 1.3-1.3 2.2c0 .7.5 1.3 1.3 1.3z",
  },
  {
    slug: "merci",
    categories: ["Gastronomie & restaurants", "Beauté & bien-être", "Livres, loisirs & enfants"],
    // icône : un bouquet
    icone: "M12 21v-8M12 13l-3.5 8M12 13l3.5 8M12 9.5a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4zM8 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM16 11.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM7 21h10",
  },
  {
    slug: "naissance",
    categories: ["Livres, loisirs & enfants", "Maison & jardin"],
    // icône : un hochet
    icone: "M9.5 9.5a4 4 0 1 0 5.7-5.7 4 4 0 0 0-5.7 5.7zM9.5 9.5L4 15a2.1 2.1 0 0 0 3 3l5.5-5.5M10.5 4.5l5 5",
  },
  {
    slug: "mariage",
    categories: ["Maison & jardin", "Voyages & expériences", "Gastronomie & restaurants"],
    // icône : deux alliances
    icone: "M9 20a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM15 20a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 10l1.5-3h-3zM9 7V5",
  },
  {
    slug: "depart",
    categories: ["Voyages & expériences", "Gastronomie & restaurants", "Livres, loisirs & enfants"],
    // icône : une valise
    icone: "M4 8h16v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M4 13h16M10 13v2h4v-2",
  },
  {
    slug: "cremaillere",
    categories: ["Maison & jardin", "Gastronomie & restaurants"],
    // icône : une maison et sa clé
    icone: "M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5",
  },
];

export const trouverOccasion = (slug) => OCCASIONS.find((o) => o.slug === slug) || null;

/** Une carte du catalogue convient-elle à cette occasion ? */
export function pourOccasion(occasion, carte) {
  if (!occasion) return true;
  if ((carte.etiquettes || []).includes(occasion.slug)) return true;
  return occasion.categories.includes(carte.categorie);
}
