// Le lien contient un jeton secret : il ne doit jamais partir vers un autre site
export const metadata = { title: "Valider un remboursement", referrer: "no-referrer", robots: { index: false, follow: false } };

export default function Disposition({ children }) {
  return children;
}
