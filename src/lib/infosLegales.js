// =====================================================================
// INFOS LÉGALES D'ESTALVIAR — à compléter UNE fois, elles sont reprises
// automatiquement dans les CGV, les mentions légales et la confidentialité.
//
// Tant qu'un champ vaut null, il apparaît en rouge « à compléter » sur le site.
// =====================================================================

export const INFOS_LEGALES = {
  // --- L'entreprise (micro-entreprise au départ) ---
  nom: null,                 // Prénom NOM de l'entrepreneur, ex. "Jean DUPONT"
  statut: "entrepreneur individuel (EI), sous le régime de la micro-entreprise",
  siret: null,               // ex. "123 456 789 00012"
  rcs: null,                 // ex. "RCS Thionville 123 456 789" (activité d'achat-revente = immatriculation au RCS)
  adresse: null,             // adresse du siège (ou de la domiciliation), ex. "12 rue Exemple, 57000 Metz"
  telephone: null,           // numéro joignable pour le service client, ex. "03 00 00 00 00"
  email: "info@estalviar.com",
  tva: "TVA non applicable, article 293 B du Code général des impôts",
  directeurPublication: null, // en général la même personne que « nom »

  // --- Médiateur de la consommation (adhésion obligatoire avant de vendre) ---
  mediateurNom: null,        // ex. "CM2C" ou "Médiateur de la consommation AME CONSO"
  mediateurSite: null,       // ex. "https://www.cm2c.net"
  mediateurAdresse: null,    // adresse postale du médiateur

  // --- Technique ---
  // Supabase › Project Settings › General › Region (ex. "Francfort, Allemagne (eu-central-1)")
  regionDonnees: null,
};

// Version des CGV : à changer à chaque modification des CGV
// (elle est enregistrée avec chaque commande acceptée)
export const VERSION_CGV = "2026-10-14";
export const DATE_MISE_A_JOUR = "14 octobre 2026";
export const DATE_MISE_A_JOUR_EN = "14 October 2026";

// Prestataires (infos publiques)
export const PRESTATAIRES = {
  hebergeur: "Netlify, Inc., 101 2nd Street, Suite 575, San Francisco, CA 94105, États-Unis — www.netlify.com",
  hebergeurEn: "Netlify, Inc., 101 2nd Street, Suite 575, San Francisco, CA 94105, United States — www.netlify.com",
};
