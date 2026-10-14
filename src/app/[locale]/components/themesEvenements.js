// Habillage visuel de chaque événement : couleurs + motifs dessinés (SVG).
// La clé est le « slug » de l'événement. Un événement inconnu prend le thème « cadeau ».

// Motifs : chemins SVG dessinés dans une case de 24 x 24
export const MOTIFS = {
  coeur: { d: "M12 20.5s-7.5-4.6-9.6-9.3C.9 7.6 3.3 4 6.9 4c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.6 0 6 3.6 4.5 7.2-2.1 4.7-9.6 9.3-9.6 9.3z", plein: true },
  fleur: { d: "M12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM12 2.5c1.7 0 3 1.6 3 3.6 0 1-.4 1.9-1 2.6M12 2.5c-1.7 0-3 1.6-3 3.6 0 1 .4 1.9 1 2.6M21.5 12c0 1.7-1.6 3-3.6 3-1 0-1.9-.4-2.6-1M21.5 12c0-1.7-1.6-3-3.6-3-1 0-1.9.4-2.6 1M12 21.5c-1.7 0-3-1.6-3-3.6 0-1 .4-1.9 1-2.6M12 21.5c1.7 0 3-1.6 3-3.6 0-1-.4-1.9-1-2.6M2.5 12c0-1.7 1.6-3 3.6-3 1 0 1.9.4 2.6 1M2.5 12c0 1.7 1.6 3 3.6 3 1 0 1.9-.4 2.6-1" },
  etoile: { d: "M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z", plein: true },
  etincelle: { d: "M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19" },
  flocon: { d: "M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M12 2l-2.2 2.2M12 2l2.2 2.2M12 22l-2.2-2.2M12 22l2.2-2.2M3.3 7l.8 3M3.3 7l3-.8M20.7 17l-.8-3M20.7 17l-3 .8M20.7 7l-3-.8M20.7 7l-.8 3M3.3 17l3 .8M3.3 17l.8-3" },
  citrouille: { d: "M12 7.5c-1.3-.9-3-1.3-4.6-1C4.7 7 3 9.6 3 13s1.7 6 4.4 6.5c1.6.3 3.3-.1 4.6-1 1.3.9 3 1.3 4.6 1C19.3 19 21 16.4 21 13s-1.7-6-4.4-6.5c-1.6-.3-3.3.1-4.6 1zM12 7.5V4.5c0-1 .8-1.8 1.8-1.8M12 7.5v11" },
  chauveSouris: { d: "M12 9.5c-.6-1-1.3-1.5-1.3-1.5L9.5 9.2C7.8 7 4.7 6.3 2 7.2c1.8 1 2.6 2.8 2.4 4.6 1.5-.6 3.4-.3 4.5.9.6-.8 1.8-1.2 3.1-1.2s2.5.4 3.1 1.2c1.1-1.2 3-1.5 4.5-.9-.2-1.8.6-3.6 2.4-4.6-2.7-.9-5.8-.2-7.5 2l-1.2-1.2s-.7.5-1.3 1.5z", plein: true },
  cravate: { d: "M9.5 3h5l-1 3.2 2.5 10.3L12 21l-4-4.5 2.5-10.3z" },
  crayon: { d: "M4 20l1.2-4.6L15.6 5a2 2 0 0 1 2.8 0l.6.6a2 2 0 0 1 0 2.8L8.6 18.8zM13.8 6.8l3.4 3.4" },
  etiquette: { d: "M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7l8.8 8.8a1.5 1.5 0 0 1 0 2.1l-7.1 7.1a1.5 1.5 0 0 1-2.1 0zM7.5 7.5h.01" },
  cadeau: { d: "M3.5 10h17v3.5h-17zM5 13.5h14V21H5zM12 10v11M12 10c-1.5-2.8-5.5-4-6-1.6-.4 1.9 4 1.6 6 1.6zM12 10c1.5-2.8 5.5-4 6-1.6.4 1.9-4 1.6-6 1.6z" },
};

// Placement des motifs (en % du bandeau) : surtout à gauche et à droite, pour ne pas gêner le texte
export const PLACEMENTS = [
  { x: 3, y: 78, taille: 44, rotation: -12, opacite: 0.6 },
  { x: 1.5, y: 22, taille: 26, rotation: 10, opacite: 0.45 },
  { x: 36, y: 88, taille: 22, rotation: 20, opacite: 0.35 },
  { x: 50, y: 14, taille: 24, rotation: -18, opacite: 0.35 },
  { x: 57, y: 80, taille: 32, rotation: 8, opacite: 0.45 },
  { x: 63, y: 30, taille: 20, rotation: -6, opacite: 0.35 },
  { x: 72, y: 90, taille: 18, rotation: 14, opacite: 0.35 },
  { x: 97, y: 16, taille: 40, rotation: -10, opacite: 0.6 },
  { x: 98.5, y: 62, taille: 24, rotation: 16, opacite: 0.45 },
  { x: 88, y: 92, taille: 20, rotation: -20, opacite: 0.4 },
];

const ENCRE = "#12172B";

export const THEMES = {
  "saint-valentin": {
    fond: `radial-gradient(ellipse at 10% 20%, #7a1734 0%, transparent 55%), radial-gradient(ellipse at 95% 90%, #5c1230 0%, transparent 50%), ${ENCRE}`,
    accent: "#ff8fab", couleurs: ["#ff8fab", "#ff4d6d", "#ffc2d1"], motifs: ["coeur", "coeur", "etincelle"], bordure: "#ff8fab55",
  },
  "fete-des-grands-meres": {
    fond: `radial-gradient(ellipse at 8% 30%, #4b2e63 0%, transparent 55%), radial-gradient(ellipse at 95% 80%, #3d2a55 0%, transparent 50%), ${ENCRE}`,
    accent: "#d7b8f3", couleurs: ["#d7b8f3", "#f6c8e0", "#fff1a8"], motifs: ["fleur", "fleur", "coeur"], bordure: "#d7b8f355",
  },
  "fete-des-meres": {
    fond: `radial-gradient(ellipse at 8% 25%, #6b2350 0%, transparent 55%), radial-gradient(ellipse at 95% 85%, #5a2a5e 0%, transparent 50%), ${ENCRE}`,
    accent: "#f7a8c8", couleurs: ["#f7a8c8", "#ffd6e5", "#f4c06a"], motifs: ["fleur", "fleur", "coeur"], bordure: "#f7a8c855",
  },
  "fete-des-peres": {
    fond: `radial-gradient(ellipse at 8% 25%, #134064 0%, transparent 55%), radial-gradient(ellipse at 95% 85%, #0f3150 0%, transparent 50%), ${ENCRE}`,
    accent: "#8cc8f0", couleurs: ["#8cc8f0", "#c9a227", "#e2eef7"], motifs: ["cravate", "etoile", "etincelle"], bordure: "#8cc8f055",
  },
  "fete-nationale": {
    fond: `linear-gradient(100deg, #0a2a7a 0%, ${ENCRE} 38%, ${ENCRE} 62%, #7a0f22 100%)`,
    accent: "#ffffff", couleurs: ["#4f7cff", "#ffffff", "#ff4d5e"], motifs: ["etincelle", "etincelle", "etoile"], bordure: "#ffffff40",
  },
  rentree: {
    fond: `radial-gradient(ellipse at 8% 25%, #1f4a3a 0%, transparent 55%), radial-gradient(ellipse at 95% 85%, #2c3f1d 0%, transparent 50%), ${ENCRE}`,
    accent: "#f2d14e", couleurs: ["#f2d14e", "#8fd3b6", "#ffffff"], motifs: ["crayon", "etoile", "crayon"], bordure: "#f2d14e55",
  },
  halloween: {
    fond: `radial-gradient(ellipse at 8% 25%, #5a2a04 0%, transparent 55%), radial-gradient(ellipse at 95% 85%, #3a1650 0%, transparent 50%), #0b0d18`,
    accent: "#ff9a3c", couleurs: ["#ff9a3c", "#b07cff", "#ffd29a"], motifs: ["citrouille", "chauveSouris", "chauveSouris"], bordure: "#ff9a3c55",
  },
  "black-friday": {
    fond: `linear-gradient(110deg, #000000 0%, #15151a 55%, #000000 100%)`,
    accent: "#f5f5f5", couleurs: ["#c9a227", "#f5f5f5", "#7a7a85"], motifs: ["etiquette", "etincelle", "etiquette"], bordure: "#c9a22766",
  },
  noel: {
    fond: `radial-gradient(ellipse at 8% 25%, #0f4a32 0%, transparent 55%), radial-gradient(ellipse at 95% 85%, #6a1022 0%, transparent 50%), ${ENCRE}`,
    accent: "#f0d27a", couleurs: ["#ffffff", "#f0d27a", "#ff6b6b"], motifs: ["flocon", "etoile", "flocon"], bordure: "#f0d27a55",
  },
  cadeau: {
    fond: `radial-gradient(ellipse at 8% 25%, #4a3a10 0%, transparent 55%), ${ENCRE}`,
    accent: "#C9A227", couleurs: ["#C9A227", "#F6F2E9"], motifs: ["cadeau", "etoile", "etincelle"], bordure: "#C9A22755",
  },
};

export const themeDe = (slug) => THEMES[slug] || THEMES.cadeau;
