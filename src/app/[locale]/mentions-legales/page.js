"use client";

import { useTranslations } from "next-intl";

export default function MentionsLegales() {
  const t = useTranslations("legal.mentions");

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory/80 leading-relaxed">
      <h1 className="text-3xl font-semibold text-ivory mb-8">{t("titre")}</h1>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("editeurTitre")}</h2>
      <p>{t("editeurTexte")}</p>
      <p className="mt-2">{t("editeurContact")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("hebergementTitre")}</h2>
      <p>{t("hebergementTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("proprieteTitre")}</h2>
      <p>{t("proprieteTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("mediationTitre")}</h2>
      <p>{t("mediationTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("contactTitre")}</h2>
      <p>{t("contactTexte")}</p>
    </div>
  );
}