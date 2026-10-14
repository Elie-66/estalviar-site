import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "paiement", "paiement", { prive: true });
}

export default function Disposition({ children }) {
  return children;
}
