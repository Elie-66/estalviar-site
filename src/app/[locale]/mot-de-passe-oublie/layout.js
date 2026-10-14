import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "motDePasse", "mot-de-passe-oublie", { prive: true });
}

export default function Disposition({ children }) {
  return children;
}
