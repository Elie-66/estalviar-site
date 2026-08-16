import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const langues = ["fr", "en", "de", "es", "it"];
const baseUrl = "https://estalviar.com";

export default async function sitemap() {
  const { data: cartes } = await supabase
    .from("catalogue")
    .select("slug")
    .eq("actif", true);

  const pagesFixes = [
    "", "boutique", "cagnotte/creer", "professionnels", "fidelite",
    "mentions-legales", "cgv", "confidentialite", "cookies",
  ];

  const urls = [];

  langues.forEach((locale) => {
    pagesFixes.forEach((page) => {
      urls.push({
        url: `${baseUrl}/${locale}${page ? `/${page}` : ""}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "daily" : "weekly",
        priority: page === "" ? 1 : 0.7,
      });
    });

    (cartes || []).forEach((carte) => {
      urls.push({
        url: `${baseUrl}/${locale}/boutique/${carte.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    });
  });

  return urls;
}