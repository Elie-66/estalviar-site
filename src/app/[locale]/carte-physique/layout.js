import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "cartePhysique", "carte-physique", { prive: true });
}

export default function Disposition({ children }) {
  return children;
}
