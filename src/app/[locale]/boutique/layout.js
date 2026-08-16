export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = (await import(`../../../../messages/${locale}.json`)).default;

  return {
    title: messages.seo?.boutiqueTitre || "Boutique | Estalviar",
    description: messages.seo?.boutiqueDescription || "Toutes les cartes cadeaux personnalisables",
  };
}

export default function BoutiqueLayout({ children }) {
  return children;
}