"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const t = useTranslations("footer");

  return (
    <footer className="bg-ink-secondary border-t border-ivory/10 mt-auto">
      <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        <div>
          <p className="text-lg uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
            Estalviar<span className="text-gold">.</span>
          </p>
          <p className="mt-3 text-sm text-ivory/60">
            {t("accroche")}
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">{t("boutique")}</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/boutique`} className="hover:text-ivory">{t("toutesEnseignes")}</a></li>
            <li><a href={`/${locale}/professionnels`} className="hover:text-ivory">{t("offrePro")}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">{t("monCompte")}</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/connexion`} className="hover:text-ivory">{t("centreAide")}</a></li>
            <li><a href={`/${locale}/fidelite`} className="hover:text-ivory">{t("programmeFidelite")}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">{t("aide")}</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/aide`} className="hover:text-ivory">{t("centreAide")}</a></li>
            <li><a href={`/${locale}/contact`} className="hover:text-ivory">{t("contact")}</a></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ivory/50">
          <p>&copy; 2026 {t("copyright")}</p>
          <div className="flex gap-4">
            <a href={`/${locale}/mentions-legales`} className="hover:text-ivory/80">{t("mentionsLegales")}</a>
            <a href={`/${locale}/cgv`} className="hover:text-ivory/80">{t("cgv")}</a>
            <a href={`/${locale}/confidentialite`} className="hover:text-ivory/80">{t("confidentialite")}</a>
            <a href={`/${locale}/cookies`} className="hover:text-ivory/80">{t("cookies")}</a>
          </div>
          <p>{t("paiementSecurise")}</p>
        </div>
      </div>
    </footer>
  );
}