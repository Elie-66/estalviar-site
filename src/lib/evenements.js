// Événements annuels (Fête des mères, Noël, 14 juillet…) : calcul des dates et sélection des marques.
// Fichier sans accès à la base : utilisable côté serveur ET dans l'admin.

// Règles de date proposées dans l'admin
export const REGLES_DATE = [
  { valeur: "fixe", label: "Date fixe (jour / mois)" },
  { valeur: "fete-des-grands-meres", label: "Fête des grands-mères (1er dimanche de mars)" },
  { valeur: "fete-des-meres", label: "Fête des mères (dernier dimanche de mai, ou 1er de juin si Pentecôte)" },
  { valeur: "fete-des-peres", label: "Fête des pères (3e dimanche de juin)" },
  { valeur: "black-friday", label: "Black Friday (vendredi après le 4e jeudi de novembre)" },
];

const JOUR = 86400000;

// Les dates sont manipulées « à midi UTC » pour éviter tout décalage d'un jour
const dateUtc = (annee, mois, jour) => new Date(Date.UTC(annee, mois - 1, jour, 12));
export const versTexte = (d) => d.toISOString().slice(0, 10);

/** Aujourd'hui à Paris, au format AAAA-MM-JJ */
export function aujourdhuiParis(maintenant = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(maintenant);
}

// Dimanche de Pâques (algorithme grégorien anonyme)
export function paques(annee) {
  const a = annee % 19, b = Math.floor(annee / 100), c = annee % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mois = Math.floor((h + l - 7 * m + 114) / 31);
  const jour = ((h + l - 7 * m + 114) % 31) + 1;
  return dateUtc(annee, mois, jour);
}

// n-ième jour de la semaine d'un mois (jourSemaine : 0 = dimanche … 6 = samedi)
function nieme(annee, mois, jourSemaine, n) {
  const premier = dateUtc(annee, mois, 1);
  const decalage = (jourSemaine - premier.getUTCDay() + 7) % 7;
  return new Date(premier.getTime() + (decalage + (n - 1) * 7) * JOUR);
}

function dernier(annee, mois, jourSemaine) {
  const finDuMois = dateUtc(annee, mois + 1, 0);
  const recul = (finDuMois.getUTCDay() - jourSemaine + 7) % 7;
  return new Date(finDuMois.getTime() - recul * JOUR);
}

/** Date de l'événement pour une année donnée */
export function dateEvenement(evenement, annee) {
  switch (evenement.regle) {
    case "fete-des-grands-meres":
      return nieme(annee, 3, 0, 1);
    case "fete-des-meres": {
      const date = dernier(annee, 5, 0);
      const pentecote = new Date(paques(annee).getTime() + 49 * JOUR);
      return versTexte(date) === versTexte(pentecote) ? new Date(date.getTime() + 7 * JOUR) : date;
    }
    case "fete-des-peres":
      return nieme(annee, 6, 0, 3);
    case "black-friday":
      return new Date(nieme(annee, 11, 4, 4).getTime() + JOUR);
    default:
      return dateUtc(annee, Number(evenement.mois) || 1, Number(evenement.jour) || 1);
  }
}

/** Prochaine date de l'événement (aujourd'hui compris) et nombre de jours restants */
export function prochaineOccurrence(evenement, aujourdhui = aujourdhuiParis()) {
  const [a, m, j] = aujourdhui.split("-").map(Number);
  const ref = dateUtc(a, m, j);
  let date = dateEvenement(evenement, a);
  if (date < ref) date = dateEvenement(evenement, a + 1);
  return { date: versTexte(date), joursRestants: Math.round((date - ref) / JOUR) };
}

/** Une carte du catalogue fait-elle partie de la sélection de l'événement ? */
export function dansSelection(evenement, carte) {
  if (evenement.fabrique_en_france && carte.made_in_france) return true;
  if (evenement.etiquette && (carte.etiquettes || []).includes(evenement.etiquette)) return true;
  if ((evenement.categories || []).includes(carte.categorie)) return true;
  if ((evenement.marques || []).includes(carte.slug)) return true;
  return false;
}

/**
 * Événement à afficher aujourd'hui : le plus proche parmi ceux dont la période d'affichage
 * a commencé (« jours_avant » le jour J) et qui ont au moins une marque active.
 */
export function evenementDuMoment(evenements, cartesActives, aujourdhui = aujourdhuiParis()) {
  let meilleur = null;
  for (const e of evenements) {
    if (!e.actif) continue;
    const { date, joursRestants } = prochaineOccurrence(e, aujourdhui);
    if (joursRestants > (Number(e.jours_avant) || 0)) continue;
    if (!cartesActives.some((c) => dansSelection(e, c))) continue;
    if (!meilleur || joursRestants < meilleur.joursRestants) meilleur = { ...e, date, joursRestants };
  }
  return meilleur;
}
