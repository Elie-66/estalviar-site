// Commande groupée (professionnels) : règles communes au navigateur et au serveur.

export const MAX_CARTES_GROUPEES = 100;

/** « Décathlon » → « decathlon » : pour reconnaître une enseigne quelle que soit l'écriture */
export const normaliser = (texte) =>
  String(texte || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

// Noms de colonnes acceptés dans le fichier (après normalisation)
const COLONNES = {
  prenom: ["prenom", "prenomnom", "nom", "beneficiaire", "destinataire", "salarie", "firstname", "name"],
  email: ["email", "mail", "adresseemail", "adressemail", "courriel", "emaildudestinataire"],
  marque: ["enseigne", "marque", "carte", "brand", "boutique"],
  montant: ["montant", "valeur", "prix", "montanteur", "montanteuros", "amount"],
  message: ["message", "mot", "petitmot", "messagepersonnalise"],
};

/**
 * Lignes lues dans le fichier (tableau d'objets { "Prénom": "Léa", … })
 * → [{ prenom, email, marque, montant, message }]
 */
export function lignesDepuisTableau(objets) {
  if (!Array.isArray(objets) || objets.length === 0) return [];
  const entetes = Object.keys(objets[0]);
  const correspondance = {};
  for (const [champ, noms] of Object.entries(COLONNES)) {
    const trouve = entetes.find((e) => noms.includes(normaliser(e)));
    if (trouve) correspondance[champ] = trouve;
  }
  return objets
    .map((o) => ({
      prenom: String(o[correspondance.prenom] ?? "").trim(),
      email: String(o[correspondance.email] ?? "").trim(),
      marque: String(o[correspondance.marque] ?? "").trim(),
      montant: String(o[correspondance.montant] ?? "").replace(/[€\s]/g, "").replace(",", "."),
      message: String(o[correspondance.message] ?? "").trim(),
    }))
    .filter((l) => l.prenom || l.email || l.marque || l.montant);
}
