"use client";

import { useTranslations } from "next-intl";

export default function Cgv() {
  const t = useTranslations("legal.cgv");

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory/80 leading-relaxed">
      <h1 className="text-3xl font-semibold text-ivory mb-8">{t("titre")}</h1>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art1Titre")}</h2>
      <p>{t("art1Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art2Titre")}</h2>
      <p>{t("art2Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art3Titre")}</h2>
      <p>{t("art3Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art4Titre")}</h2>
      <p>{t("art4Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art5Titre")}</h2>
      <p>{t("art5Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art6Titre")}</h2>
      <p>{t("art6Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art7Titre")}</h2>
      <p>{t("art7Texte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("art8Titre")}</h2>
      <p>{t("art8Texte")}</p>
    </div>
  );
}