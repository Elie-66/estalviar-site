// Règles du cashback Estalviar — côté serveur uniquement (manipule les marges).

export const REGLES_CASHBACK = {
  joursAttente: 14,          // le cashback gagné devient utilisable 14 jours après la LIVRAISON de la carte
  commandeMinimum: 20,       // utilisable à partir de 20 € de commande
  plafondCommande: 0.5,      // au maximum 50 % de la commande
  margeMinimum: 5,           // pas de cashback sur les marques à moins de 5 % de marge
  fraisPaiementEstimes: 2,   // en %, déduits de la marge avant calcul (frais Stripe ≈ 1,5 % + 0,25 €)
};

// Paliers (mêmes seuils que la page Fidélité)
export const PALIERS = [
  { nom: "Bronze", seuil: 0, taux: 0, notorietes: [] },
  { nom: "Argent", seuil: 100, taux: 0.2, notorietes: ["peu"] },
  { nom: "Or", seuil: 300, taux: 0.25, notorietes: ["peu", "moyen"] },
  { nom: "Platine", seuil: 700, taux: 0.3, notorietes: ["peu", "moyen", "tres"] },
];

export function palierPourPoints(points) {
  return [...PALIERS].reverse().find((p) => (points || 0) >= p.seuil) || PALIERS[0];
}

const arrondiInferieur = (euros) => Math.floor(euros * 100 + 1e-6) / 100;

/**
 * Cashback gagné sur une commande.
 * @param articles  [{ slug, montant }]
 * @param infos     { slug: { marge, notoriete } }
 * @param points    points de fidélité du client AVANT la commande
 * @param partPayee part réellement payée (1 si pas de cashback utilisé, 0,8 si 20 % payés en cashback…)
 */
export function calculerCashbackGagne(articles, infos, points, partPayee = 1) {
  const palier = palierPourPoints(points);
  if (palier.taux === 0) return { montant: 0, palier: palier.nom };

  let total = 0;
  for (const a of articles) {
    const info = infos[a.slug];
    if (!info) continue;
    const marge = Number(info.marge) || 0;
    if (marge < REGLES_CASHBACK.margeMinimum) continue;
    if (!palier.notorietes.includes(info.notoriete || "peu")) continue;
    const margeNette = (marge - REGLES_CASHBACK.fraisPaiementEstimes) / 100;
    total += Number(a.montant) * partPayee * margeNette * palier.taux;
  }
  return { montant: arrondiInferieur(total), palier: palier.nom };
}

/** Cashback utilisable sur une commande, selon le solde disponible. */
export function calculerCashbackUtilisable(totalCommande, soldeDisponible) {
  if (totalCommande < REGLES_CASHBACK.commandeMinimum) return 0;
  const plafond = arrondiInferieur(totalCommande * REGLES_CASHBACK.plafondCommande);
  return arrondiInferieur(Math.min(Number(soldeDisponible) || 0, plafond));
}
