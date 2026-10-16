"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePanier } from "../context/PanierContext";

export default function Panier() {
  const t = useTranslations("panier");
  const tDesign = useTranslations("designs");
  const locale = useLocale();
  const { articles, retirerArticle, total } = usePanier();
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n);
  const nomDesign = (nom) => (nom && tDesign.has(nom) ? tDesign(nom) : nom);

  if (articles.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-32 pb-20 text-center">
        <div aria-hidden className="mx-auto w-40 aspect-[1.586/1] rounded-xl border border-dashed border-ivory/25 flex items-center justify-center text-ivory/30 text-3xl">
          +
        </div>
        <h1 className="mt-8 text-3xl font-semibold text-ivory">{t("titre")}</h1>
        <p className="mt-3 text-ivory/60">{t("vide")}</p>
        <a href={`/${locale}/boutique`}
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
          {t("decouvrir")}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-8">{t("titre")}</h1>

      <ul className="space-y-3">
        {articles.map((article) => (
          <li key={article.id}
            className="flex items-start sm:items-center gap-4 sm:gap-5 border border-ivory/10 rounded-xl p-3 sm:p-4">
            <div
              className="relative overflow-hidden w-24 sm:w-32 aspect-[1.586/1] rounded-lg flex flex-col justify-between p-2 sm:p-3 shrink-0 border border-white/10"
              style={{ background: article.background, boxShadow: "0 10px 25px -10px #00000066" }}
            >
              <div aria-hidden className="absolute inset-0 opacity-[0.1]"
                style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }} />
              {article.image
                ? <img src={article.image} alt="" className="relative h-3.5 sm:h-4 w-fit max-w-[70%] object-contain object-left drop-shadow-md" />
                : <span className="relative text-[10px] text-white font-semibold">{article.marque}</span>}
              <p className={`relative text-sm font-semibold font-[family-name:var(--font-titre)] ${article.texteFonce ? "text-ink" : "text-white"}`}>
                {article.montant}<span className="text-xs text-gold ml-0.5">€</span>
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <p className="text-ivory font-medium truncate">{article.marque}</p>
                <p className="text-ivory font-semibold whitespace-nowrap">{euros(article.montant)}</p>
              </div>
              {article.beneficiaire && <p className="text-sm text-ivory/60 truncate">{t("pour", { prenom: article.beneficiaire })}</p>}
              {article.message && <p className="text-sm text-ivory/45 italic truncate">« {article.message} »</p>}
              <p className="text-xs text-ivory/40 mt-0.5">{t("design", { nom: nomDesign(article.design) })}</p>
              {article.dateEnvoi && (
                <p className="text-xs text-gold/80 mt-1">
                  {t("envoiLe", {
                    date: new Date(`${article.dateEnvoi}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
                    heure: article.heureEnvoi || "",
                  })}
                </p>
              )}
              <button onClick={() => retirerArticle(article.id)}
                className="mt-2 text-xs text-ivory/45 hover:text-corail underline underline-offset-2 transition-colors">
                {t("retirer")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 border-t border-ivory/10 pt-6 flex items-center justify-between">
        <p className="text-ivory/70">{t("total")}</p>
        <p className="text-2xl font-semibold text-ivory">{euros(total)}</p>
      </div>
      <p className="mt-2 text-xs text-ivory/45 text-right">{t("sansFrais")}</p>

      <a href={`/${locale}/paiement`}
        className="mt-6 block text-center w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors">
        {t("payer")}
      </a>
      <a href={`/${locale}/boutique`} className="mt-4 block text-center text-sm text-ivory/60 hover:text-gold">
        {t("continuer")}
      </a>
    </div>
  );
}
