"use client";

import { useTranslations } from "next-intl";

export default function Cookies() {
  const t = useTranslations("legal.cookies");

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory/80 leading-relaxed">
      <h1 className="text-3xl font-semibold text-ivory mb-8">{t("titre")}</h1>

      <p>{t("intro")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("quoiTitre")}</h2>
      <p>{t("quoiTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("utilisesTitre")}</h2>
      <p>{t("necessairesTexte")}</p>
      <p className="mt-2">{t("preferenceTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("gestionTitre")}</h2>
      <p>{t("gestionTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("contactTitre")}</h2>
      <p>{t("contactTexte")}</p>
    </div>
  );
}