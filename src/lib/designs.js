// Designs de cartes, côté serveur.
// Le serveur recalcule lui-même le fond de la carte à partir du NOM du design :
// on ne fait jamais confiance au CSS envoyé par le navigateur (il finit dans les emails).
export const DESIGNS = [
  { id: "marque", nom: "Marque", fond: (couleur) => `linear-gradient(150deg, ${couleur} 0%, #0d1022 100%)` },
  { id: "or", nom: "Or", fond: () => "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)" },
  { id: "ivoire", nom: "Ivoire", fond: () => "linear-gradient(150deg, #F6F2E9 0%, #d9cdae 100%)", texteFonce: true },
  { id: "corail", nom: "Corail", fond: () => "linear-gradient(150deg, #E5604D 0%, #5B3A5C 100%)" },
  { id: "ambre", nom: "Ambre", fond: () => "linear-gradient(150deg, #C9A227 0%, #E5604D 100%)" },
  { id: "vert", nom: "Vert", fond: () => "linear-gradient(150deg, #1f5c45 0%, #0d1022 100%)" },
  { id: "rouge", nom: "Rouge", fond: () => "linear-gradient(150deg, #9c2b2b 0%, #0d1022 100%)" },
  { id: "rose", nom: "Rose", fond: () => "linear-gradient(150deg, #e8a4c4 0%, #6b2f4d 100%)" },
];

const COULEUR_VALIDE = /^#[0-9a-fA-F]{3,8}$/;

export function trouverDesign(nomOuId, couleurMarque) {
  const d =
    DESIGNS.find((x) => x.nom === nomOuId || x.id === nomOuId) || DESIGNS[0];
  const couleur = COULEUR_VALIDE.test(couleurMarque || "") ? couleurMarque : "#1b3a5c";
  return { nom: d.nom, background: d.fond(couleur), texteFonce: !!d.texteFonce };
}

// Échappe le texte saisi par un client avant de l'insérer dans un email HTML
export function echapperHtml(texte) {
  return String(texte ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
