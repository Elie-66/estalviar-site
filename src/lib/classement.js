// Classement des enseignes de la boutique.
// Score = 50 % marge + 30 % notoriété + 20 % ventes des 30 derniers jours,
// avec une légère rotation quotidienne et des quotas sur la première page.
// Ce fichier ne doit être utilisé que côté serveur (il manipule les marges).

export const REGLAGES = {
  poidsMarge: 0.5,
  poidsNotoriete: 0.3,
  poidsVentes: 0.2,
  margePlafond: 15,          // au-delà de 15 % de marge, pas de bonus supplémentaire
  rotation: 0.05,            // variation quotidienne max (+/- 0,05 sur un score de 0 à 1)
  taillePremierePage: 12,
  minTresConnues: 6,         // au moins 6 marques très connues en première page
  maxPeuConnues: 3,          // au plus 3 marques peu connues en première page
};

const VALEUR_NOTORIETE = { tres: 1, moyen: 0.66, peu: 0.33 };

// Petit générateur pseudo-aléatoire stable : même résultat toute la journée pour une marque donnée
function aleaDuJour(texte, date) {
  const graine = `${date}-${texte}`;
  let h = 2166136261;
  for (let i = 0; i < graine.length; i++) {
    h ^= graine.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000; // entre 0 et 1
}

/**
 * @param {Array} cartes   enseignes actives du catalogue
 * @param {Object} marges  { slug: marge en % }
 * @param {Object} ventes  { slug: montant vendu sur 30 jours }
 * @param {String} date    "AAAA-MM-JJ" (sert à la rotation quotidienne)
 * @returns {Array} les mêmes enseignes, dans l'ordre d'affichage
 */
export function classerEnseignes(cartes, marges, ventes, date, reglages = REGLAGES) {
  const r = reglages;
  const venteMax = Math.max(0, ...Object.values(ventes));

  const avecScore = cartes.map((c) => {
    const marge = Math.min(Number(marges[c.slug]) || 0, r.margePlafond) / r.margePlafond;
    const notoriete = VALEUR_NOTORIETE[c.notoriete] ?? VALEUR_NOTORIETE.peu;
    const vente = venteMax > 0 ? (ventes[c.slug] || 0) / venteMax : 0;
    const variation = (aleaDuJour(c.slug, date) * 2 - 1) * r.rotation;
    const score = r.poidsMarge * marge + r.poidsNotoriete * notoriete + r.poidsVentes * vente + variation;
    return { carte: c, score };
  });

  const parScore = (a, b) => b.score - a.score;
  const misesEnAvant = avecScore.filter((x) => x.carte.mise_en_avant).sort(parScore);
  const autres = avecScore.filter((x) => !x.carte.mise_en_avant).sort(parScore);

  // Première page : mises en avant d'abord, puis remplissage en respectant les quotas
  const page = [...misesEnAvant.slice(0, r.taillePremierePage)];
  const compter = (niveau) => page.filter((x) => (x.carte.notoriete || "peu") === niveau).length;
  const restants = [...misesEnAvant.slice(r.taillePremierePage), ...autres];
  const totalTres = restants.filter((x) => x.carte.notoriete === "tres").length + compter("tres");
  const objectifTres = Math.min(r.minTresConnues, totalTres);

  while (page.length < r.taillePremierePage && restants.length > 0) {
    const placesLibres = r.taillePremierePage - page.length;
    const tresManquantes = Math.max(0, objectifTres - compter("tres"));

    const index = restants.findIndex((x) => {
      const niveau = x.carte.notoriete || "peu";
      if (tresManquantes >= placesLibres && niveau !== "tres") return false; // il faut garder la place pour une très connue
      if (niveau === "peu" && compter("peu") >= r.maxPeuConnues) return false;
      return true;
    });

    if (index === -1) break; // plus aucune marque ne respecte les quotas : on complète avec le reste
    page.push(restants.splice(index, 1)[0]);
  }

  return [...page, ...restants].map((x) => x.carte);
}
