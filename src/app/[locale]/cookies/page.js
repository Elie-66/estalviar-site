import PageLegale from "../components/PageLegale";
import { textesLegaux } from "../../../lib/legal";
import { alternates } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: textesLegaux(locale).textes.cookies.titre, alternates: alternates(locale, "cookies") };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const { textes, note } = textesLegaux(locale);
  return <PageLegale contenu={textes.cookies} locale={locale} note={note} />;
}
