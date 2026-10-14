import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "retractation", "retractation");
}

export default function Disposition({ children }) {
  return children;
}
