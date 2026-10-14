import PageLegale from "../components/PageLegale";
import { textesLegaux } from "../../../lib/legal";
import { alternates } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: textesLegaux(locale).textes.mentions.titre, alternates: alternates(locale, "mentions-legales") };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const { textes, note } = textesLegaux(locale);
  return <PageLegale contenu={textes.mentions} locale={locale} note={note} />;
}
