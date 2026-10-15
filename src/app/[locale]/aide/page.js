"use client";

import { useLocale, useTranslations } from "next-intl";

// Questions par thème (les textes sont dans messages/*.json, rubrique « aide »)
const THEMES = [
  { cle: "envoi", questions: ["q1", "q2", "q3", "q4"] },
  { cle: "cartes", questions: ["q5", "q6", "q7"] },
  { cle: "paiement", questions: ["q8", "q9", "q10", "q16"] },
  { cle: "compte", questions: ["q11", "q12", "q13"] },
  { cle: "cagnottes", questions: ["q14", "q15"] },
];

export default function Aide() {
  const t = useTranslations("aide");
  const locale = useLocale();

  return (
    <div className="max-w-[860px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
      <p className="mt-3 text-ivory/65">{t("intro")}</p>

      <nav aria-label={t("themes")} className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-b border-ivory/10 pb-3">
        {THEMES.map((th) => (
          <a key={th.cle} href={`#${th.cle}`}
            className="text-[15px] text-ivory/60 hover:text-gold transition-colors">
            {t(`theme_${th.cle}`)}
          </a>
        ))}
      </nav>

      {THEMES.map((th) => (
        <section key={th.cle} id={th.cle} className="scroll-mt-28 mt-12">
          <h2 className="text-xl font-semibold text-ivory mb-3">{t(`theme_${th.cle}`)}</h2>
          <div className="divide-y divide-ivory/10 border-y border-ivory/10">
            {th.questions.map((q) => (
              <details key={q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-ivory font-medium [&::-webkit-details-marker]:hidden">
                  {t(`${q}`)}
                  <span aria-hidden className="text-gold text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-ivory/70 leading-relaxed max-w-[44rem]">
                  {t.rich(`${q}r`, {
                    lien: (c) => <a href={`/${locale}${t(`${q}lien`)}`} className="text-gold underline underline-offset-2">{c}</a>,
                  })}
                </p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="mt-14 rounded-2xl border border-gold/25 bg-gold/[0.06] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-ivory font-semibold">{t("pasTrouve")}</p>
          <p className="mt-1 text-sm text-ivory/65">{t("pasTrouveTexte")}</p>
        </div>
        <a href={`/${locale}/contact`}
          className="shrink-0 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors text-center">
          {t("contact")}
        </a>
      </div>
    </div>
  );
}
