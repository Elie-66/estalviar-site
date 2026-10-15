// Accès à l'administration.
// • Le PROPRIÉTAIRE a accès à tout, y compris à la page « Équipe » qui gère les accès des autres.
// • Les autres membres n'ont accès qu'aux sections cochées pour eux (table « equipe_admin »).
// Ce fichier ne contient aucun secret : il est utilisé par le serveur ET par les pages.

export const PROPRIETAIRES = ["elie.pujol@estalviar.com"];

export const estProprietaire = (email) => PROPRIETAIRES.includes(String(email || "").toLowerCase());

/**
 * Sections de l'admin.
 * tables.voir / tables.modifier : tables accessibles via /api/admin-donnees pour ce niveau.
 */
export const SECTIONS = [
  { cle: "commandes", nom: "Commandes", description: "Voir et gérer toutes les commandes",
    tables: { voir: ["commandes"], modifier: ["commandes"] } },
  { cle: "codes", nom: "Codes des cartes", description: "Afficher les codes en clair dans Commandes", sansPage: true,
    tables: { voir: [], modifier: [] } },
  { cle: "clients", nom: "Clients", description: "Comptes, fidélité et historique",
    tables: { voir: ["profils", "commandes"], modifier: [] } },
  { cle: "demandes-pro", nom: "Demandes pro", description: "Suivre les demandes de devis",
    tables: { voir: ["demandes_pro", "demandes_contact"], modifier: [] } },
  { cle: "factures", nom: "Factures", description: "Toutes les factures et le livre des recettes",
    tables: { voir: [], modifier: [] } },
  { cle: "retractations", nom: "Rétractations", description: "Demandes à rembourser sous 14 jours",
    tables: { voir: ["demandes_retractation"], modifier: ["demandes_retractation"] } },
  { cle: "cagnottes", nom: "Cagnottes", description: "Suivre les cagnottes en cours",
    tables: { voir: ["cagnottes", "contributions_cagnotte"], modifier: [] } },
  { cle: "influenceuses", nom: "Influenceuses", description: "Codes partenaires, ventes et commissions",
    tables: { voir: ["codes_influence", "utilisations_code", "profils", "catalogue"], modifier: ["codes_influence", "utilisations_code"] } },
  { cle: "catalogue", nom: "Catalogue", description: "Ajouter, modifier, désactiver des enseignes",
    tables: { voir: ["catalogue"], modifier: ["catalogue"] } },
  { cle: "audience", nom: "Audience", description: "Visiteurs, provenance, pages vues et conversion",
    tables: { voir: [], modifier: [] } },
  { cle: "statistiques", nom: "Statistiques", description: "Ventes, top enseignes, top bénéficiaires",
    tables: { voir: ["commandes"], modifier: [] } },
  { cle: "evenements", nom: "Événements", description: "Fête des mères, Noël, 14 juillet : bandeau et sélection",
    tables: { voir: ["evenements", "catalogue"], modifier: ["evenements"] } },
  { cle: "occasions", nom: "Occasions", description: "Emails automatiques pour les fêtes",
    tables: { voir: ["occasions"], modifier: ["occasions"] } },
  { cle: "blog", nom: "Blog", description: "Rédiger et publier des articles",
    tables: { voir: ["articles_blog"], modifier: ["articles_blog"] } },
  { cle: "cartes-physiques", nom: "Cartes physiques", description: "Générer et suivre les cartes rechargeables",
    tables: { voir: [], modifier: [] } },
];

export const CLES_SECTIONS = SECTIONS.map((s) => s.cle);

/**
 * Droit d'un accès sur une section.
 * acces = { proprietaire, sections: { commandes: "modifier", clients: "voir", ... } }
 * niveau = "voir" ou "modifier"
 */
export function aLeDroit(acces, section, niveau = "voir") {
  if (!acces) return false;
  if (acces.proprietaire) return true;
  const sections = Array.isArray(section) ? section : [section];
  return sections.some((s) => {
    const n = acces.sections?.[s];
    return n === "modifier" || (n === "voir" && niveau === "voir");
  });
}
