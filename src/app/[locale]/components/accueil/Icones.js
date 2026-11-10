// Icônes au trait, dessinées à la main pour la page d'accueil
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function Icone({ nom, taille = 26 }) {
  const p = { ...base, width: taille, height: taille, viewBox: "0 0 24 24" };
  switch (nom) {
    case "cadenas":
      return (
        <svg {...p}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "email":
      return (
        <svg {...p}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7l9 6 9-6" />
        </svg>
      );
    case "valide":
      return (
        <svg {...p}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "groupe":
      return (
        <svg {...p}>
          <circle cx="8" cy="9" r="3" />
          <circle cx="16" cy="9" r="3" />
          <path d="M2 20c.8-3 3-5 6-5s5.2 2 6 5M14 15.2c.6-.1 1.3-.2 2-.2 3 0 5.2 2 6 5" />
        </svg>
      );
    case "loupe":
      return (
        <svg {...p} strokeWidth={2}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      );
    default:
      return null;
  }
}
