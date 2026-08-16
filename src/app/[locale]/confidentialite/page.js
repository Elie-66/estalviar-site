"use client";

import { useTranslations } from "next-intl";

export default function Confidentialite() {
  const t = useTranslations("legal.confidentialite");

  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory/80 leading-relaxed">
      <h1 className="text-3xl font-semibold text-ivory mb-8">{t("titre")}</h1>

      <p>{t("intro")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("donneesTitre")}</h2>
      <p>{t("donneesTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("finalitesTitre")}</h2>
      <p>{t("finalitesTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("conservationTitre")}</h2>
      <p>{t("conservationTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("droitsTitre")}</h2>
      <p>{t("droitsTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("partageTitre")}</h2>
      <p>{t("partageTexte")}</p>

      <h2 className="text-xl font-semibold text-ivory mt-8 mb-3">{t("contactTitre")}</h2>
      <p>{t("contactTexte")}</p>
    </div>
  );
}