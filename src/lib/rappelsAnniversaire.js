// Rappels d'anniversaire : on prévient le client quelques jours avant l'anniversaire d'un proche
export const JOURS_AVANT_RAPPEL = 7;

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
export const formaterJourMois = (jour, mois) => `${jour === 1 ? "1er" : jour} ${MOIS[mois - 1]}`;

const bissextile = (annee) => (annee % 4 === 0 && annee % 100 !== 0) || annee % 400 === 0;

/**
 * Pour une date du jour (AAAA-MM-JJ, heure de Paris), renvoie l'anniversaire à rappeler :
 * { jour, mois, annee, aussi29Fevrier } — dans JOURS_AVANT_RAPPEL jours.
 * Les personnes nées un 29 février sont rappelées pour le 28 les années non bissextiles.
 */
export function anniversaireARappeler(aujourdhui, joursAvant = JOURS_AVANT_RAPPEL) {
  const [a, m, j] = aujourdhui.split("-").map(Number);
  const cible = new Date(Date.UTC(a, m - 1, j + joursAvant, 12));
  const jour = cible.getUTCDate();
  const mois = cible.getUTCMonth() + 1;
  const annee = cible.getUTCFullYear();
  return { jour, mois, annee, aussi29Fevrier: mois === 2 && jour === 28 && !bissextile(annee) };
}

/** Jour/mois valides (31 avril refusé, 29 février accepté) */
export function anniversaireValide(jour, mois) {
  if (!Number.isInteger(jour) || !Number.isInteger(mois) || mois < 1 || mois > 12 || jour < 1) return false;
  const joursDansMois = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mois - 1];
  return jour <= joursDansMois;
}
