import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "confirmation", "confirmation", { prive: true });
}

export default function Disposition({ children }) {
  return children;
}
