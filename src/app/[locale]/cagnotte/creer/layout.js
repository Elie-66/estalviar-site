import { metadonnees } from "../../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "cagnotte", "cagnotte/creer");
}

export default function Disposition({ children }) {
  return children;
}
