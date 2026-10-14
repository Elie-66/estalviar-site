import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "inscription", "inscription");
}

export default function Disposition({ children }) {
  return children;
}
