import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "contact", "contact");
}

export default function Disposition({ children }) {
  return children;
}
