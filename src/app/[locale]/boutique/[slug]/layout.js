import { createClient } from "@supabase/supabase-js";
import { metadonnees } from "../../../../lib/seo";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Titre de l'onglet avec le nom de l'enseigne : « Carte cadeau Fnac | Estalviar »
export async function generateMetadata({ params }) {
  const { slug } = await params;
  let nom = slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, " ");
  try {
    const { data } = await supabase.from("catalogue").select("nom").eq("slug", slug).eq("actif", true).maybeSingle();
    if (data?.nom) nom = data.nom;
  } catch {
    // sans base, on garde le slug
  }
  return metadonnees(params, "fiche", `boutique/${slug}`, { valeurs: { nom } });
}

export default function Disposition({ children }) {
  return children;
}
