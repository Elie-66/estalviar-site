import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "fidelite", "fidelite");
}

export default function Disposition({ children }) {
  return children;
}
