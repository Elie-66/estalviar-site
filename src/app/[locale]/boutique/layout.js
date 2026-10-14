import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "boutique", "boutique");
}

export default function BoutiqueLayout({ children }) {
  return children;
}
