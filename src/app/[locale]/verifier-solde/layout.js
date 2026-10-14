import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "solde", "verifier-solde");
}

export default function Disposition({ children }) {
  return children;
}
