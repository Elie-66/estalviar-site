"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const t = useTranslations("footer");

  return (
    <footer className="bg-ink-secondary border-t border-ivory/10 mt-auto">
      <div className="border-b border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-4 text-center text-xs text-ivory/50">
          {t("cartesNumeriques")}
        </div>
      </div>

      <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-5 gap-10">

        <div className="md:col-span-1">
          <p className="text-lg uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
            Estalviar<span className="text-gold">.</span>
          </p>
          <p className="mt-3 text-sm text-ivory/60">
            {t("accroche")}
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">{t("idees")}</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/boutique`} className="hover:text-ivory">{t("toutesEnseignes")}</a></li>
            <li><a href={`/${locale}/cagnotte/creer`} className="hover:text-ivory">{t("cagnotteLien")}</a></li>
            <li><a href={`/${locale}/professionnels`} className="hover:text-ivory">{t("offrePro")}</a></li>
            <li><a href={`/${locale}/verifier-solde`} className="hover:text-ivory">{t("verifierSolde")}</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">{t("monCompte")}</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/connexion`} className="hover:text-ivory">{t("connexion")}</a></li>
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

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">Légal</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href={`/${locale}/mentions-legales`} className="hover:text-ivory">{t("mentionsLegales")}</a></li>
            <li><a href={`/${locale}/cgv`} className="hover:text-ivory">{t("cgv")}</a></li>
            <li><a href={`/${locale}/confidentialite`} className="hover:text-ivory">{t("confidentialite")}</a></li>
            <li><a href={`/${locale}/cookies`} className="hover:text-ivory">{t("cookies")}</a></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-ivory/50">
          <p>&copy; 2026 {t("copyright")}</p>

          <div className="flex items-center gap-3 opacity-60">
            <div className="border border-ivory/20 rounded px-2 py-1 text-[10px]">CB</div>
            <div className="border border-ivory/20 rounded px-2 py-1 text-[10px]">PayPal</div>
            <div className="border border-ivory/20 rounded px-2 py-1 text-[10px]">Apple Pay</div>
          </div>

          <p>{t("paiementSecurise")}</p>
        </div>
      </div>
    </footer>
  );
}