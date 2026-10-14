import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "nouveauMdp", "nouveau-mot-de-passe", { prive: true });
}

export default function Disposition({ children }) {
  return children;
}
