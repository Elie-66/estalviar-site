import { createClient } from "@supabase/supabase-js";
import { alternates } from "../../../../lib/seo";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  try {
    const { data } = await supabase.from("articles_blog").select("titre, extrait, image").eq("slug", slug).eq("publie", true).maybeSingle();
    if (data) {
      return {
        title: { absolute: `${data.titre} | Estalviar` },
        description: data.extrait || undefined,
        alternates: alternates(locale, `blog/${slug}`),
        openGraph: { title: data.titre, description: data.extrait || undefined, images: data.image ? [data.image] : undefined, type: "article" },
      };
    }
  } catch {
    // titre par défaut du site
  }
  return { title: { absolute: "Blog | Estalviar" } };
}

export default function Disposition({ children }) {
  return children;
}
