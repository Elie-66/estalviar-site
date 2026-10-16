"use client";

import { useLocale, useTranslations } from "next-intl";

export default function Introuvable() {
  const t = useTranslations("introuvable");
  const locale = useLocale();

  return (
    <div className="max-w-[720px] mx-auto px-6 pt-32 md:pt-40 pb-24 text-center">
      {/* Une carte cadeau « perdue » */}
      <div aria-hidden className="relative mx-auto w-64 sm:w-72 aspect-[1.586/1] -rotate-6 rounded-2xl p-5 flex flex-col justify-between border border-white/10 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)]"
        style={{ background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)" }}>
        <span className="self-end text-white/60 text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
        <span className="text-white text-6xl font-semibold leading-none font-[family-name:var(--font-titre)] text-left">
          404<span className="text-gold">.</span>
        </span>
      </div>
      <h1 className="mt-12 text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
      <p className="mt-4 text-ivory/65 leading-relaxed">{t("texte")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={`/${locale}/boutique`} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">{t("boutique")}</a>
        <a href={`/${locale}`} className="border border-ivory/25 text-ivory rounded-lg px-6 py-3 hover:border-ivory/50 transition-colors">{t("accueil")}</a>
      </div>
      <p className="mt-8 text-sm text-ivory/50">
        {t("aide")} <a href={`/${locale}/aide`} className="text-gold underline underline-offset-2">{t("aideLien")}</a>
      </p>
    </div>
  );
}
