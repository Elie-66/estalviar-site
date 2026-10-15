import { getTranslations } from "next-intl/server";
import { metadonnees } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  return metadonnees(params, "apropos", "qui-sommes-nous");
}

// Mise en forme dans les textes : <b>, <i>, <mail>
const balises = {
  b: (morceau) => <strong className="font-semibold text-ivory">{morceau}</strong>,
  i: (morceau) => <em>{morceau}</em>,
  mail: (morceau) => (
    <a href="mailto:info@estalviar.com" className="text-gold underline decoration-gold/40 underline-offset-[3px] hover:decoration-gold">{morceau}</a>
  ),
};

/**
 * « Qui sommes-nous » présenté comme une lettre du fondateur.
 * Sur ordinateur, la définition du mot catalan est une note dans la marge.
 */
export default async function QuiSommesNous({ params }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "apropos" });
  const p = (cle) => t.rich(cle, balises);
  const paragraphe = "text-[18px] sm:text-[19px] leading-[1.75] text-ivory/80";

  // Chaque ligne : un paragraphe, et parfois une note dans la marge
  const lignes = [
    { cle: "p1" }, { cle: "p2" }, { cle: "p3", note: true }, { cle: "p4" },
    { cle: "p5" }, { cle: "p6" }, { cle: "p7" }, { cle: "p8" }, { cle: "p9" }, { cle: "p10" },
  ];

  return (
    <div className="px-6 pt-28 md:pt-36 pb-24">
      <article className="max-w-[860px] mx-auto text-ivory font-[family-name:var(--font-fraunces)]">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">{t("titre")}</h1>
        <p className={`mt-10 ${paragraphe}`}>{t("bonjour")}</p>

        <div className="mt-5 space-y-5">
          {lignes.map(({ cle, note }) => (
            <div key={cle} className="lg:grid lg:grid-cols-[minmax(0,1fr)_190px] lg:gap-10">
              <p className={paragraphe}>{p(cle)}</p>
              {note && (
                <aside className="mt-5 lg:mt-1 border-l-2 lg:border-l-0 lg:border-t-2 border-[#C9A227] pl-4 lg:pl-0 lg:pt-3 text-[15px] leading-snug text-ivory/60 italic">
                  {p("note")}
                </aside>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12">
          <p className="text-4xl italic leading-none">{t("signature")}</p>
          <p className="mt-2 text-sm text-ivory/50 font-sans">{t("fonction")}</p>
        </div>

        <p className="mt-10 text-[16px] italic text-ivory/55">{t("ps")}</p>
      </article>

      <div className="max-w-[860px] mx-auto mt-14 pt-10 border-t border-ivory/10 flex flex-wrap items-center gap-6">
        <a href={`/${locale}/boutique`}
          className="bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors">
          {t("boutique")}
        </a>
        <a href={`/${locale}/cagnotte/creer`} className="text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
          {t("cagnotte")}
        </a>
      </div>
    </div>
  );
}
