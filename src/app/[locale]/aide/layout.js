import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "aide", "aide");
}

export default function Disposition({ children }) {
  return children;
}
