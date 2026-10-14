import PageLegale from "../components/PageLegale";
import { textesLegaux } from "../../../lib/legal";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return { title: `${textesLegaux(locale).textes.confidentialite.titre} — Estalviar` };
}

export default async function Page({ params }) {
  const { locale } = await params;
  const { textes, note } = textesLegaux(locale);
  return <PageLegale contenu={textes.confidentialite} locale={locale} note={note} />;
}
