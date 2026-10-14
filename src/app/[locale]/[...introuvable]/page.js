import { notFound } from "next/navigation";
import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const meta = await metadonnees(params, "introuvable", "", { prive: true });
  return meta;
}

// Toute adresse inconnue (ex. /fr/page-qui-nexiste-pas) affiche la page « introuvable » du site
export default function PageInconnue() {
  notFound();
}
