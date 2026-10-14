import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "blog", "blog");
}

export default function Disposition({ children }) {
  return children;
}
