import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "connexion", "connexion");
}

export default function Disposition({ children }) {
  return children;
}
