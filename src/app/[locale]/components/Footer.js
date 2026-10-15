"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const t = useTranslations("footer");
  const tRetractation = useTranslations("retractation");
  const [ouvert, setOuvert] = useState(null);

  const sections = [
    {
      id: "idees",
      titre: t("idees"),
      liens: [
        { href: `/${locale}/boutique`, label: t("toutesEnseignes") },
        { href: `/${locale}/cagnotte/creer`, label: t("cagnotteLien") },
        { href: `/${locale}/professionnels`, label: t("offrePro") },
      ],
    },
    {
      id: "compte",
      titre: t("monCompte"),
      liens: [
        { href: `/${locale}/connexion`, label: t("connexion") },
        { href: `/${locale}/fidelite`, label: t("programmeFidelite") },
        { href: `/${locale}/verifier-solde`, label: t("verifierSolde") },
      ],
    },
    {
      id: "aide",
      titre: t("aide"),
      liens: [
        { href: `/${locale}/aide`, label: t("centreAide") },
        { href: `/${locale}/contact`, label: t("contact") },
        { href: `/${locale}/blog`, label: t("blog") },
      ],
    },
    {
      id: "legal",
      titre: t("legal"),
      liens: [
        { href: `/${locale}/mentions-legales`, label: t("mentionsLegales") },
        { href: `/${locale}/cgv`, label: t("cgv") },
        { href: `/${locale}/confidentialite`, label: t("confidentialite") },
        { href: `/${locale}/cookies`, label: t("cookies") },
        { href: `/${locale}/retractation`, label: tRetractation("lienFooter") },
      ],
    },
  ];

  const toggle = (id) => {
    setOuvert(ouvert === id ? null : id);
  };

  return (
    <footer className="bg-ink-secondary border-t border-ivory/10 mt-auto">
      <div className="max-w-[1240px] mx-auto px-6 py-14 md:py-16 md:grid md:grid-cols-[1.4fr_repeat(4,1fr)] md:gap-10">

        {/* La marque */}
        <div className="mb-8 md:mb-0">
          <p className="text-lg uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
            Estalviar<span className="text-gold">.</span>
          </p>
          <p className="mt-3 text-sm text-ivory/60 max-w-[16rem]">
            {t("accroche")}
          </p>
        </div>

        {/* Version mobile : accordéon */}
        <div className="md:hidden mt-6">
          {sections.map((section) => (
            <div key={section.id} className="border-t border-ivory/10">
              <button
                onClick={() => toggle(section.id)}
                aria-expanded={ouvert === section.id}
                className="w-full flex items-center justify-between py-4 text-left"
              >
                <span className="text-[15px] text-ivory/80">{section.titre}</span>
                <span aria-hidden className={`text-ivory/50 transition-transform ${ouvert === section.id ? "rotate-45" : ""}`}>
                  +
                </span>
              </button>
              {ouvert === section.id && (
                <ul className="pb-4 space-y-2">
                  {section.liens.map((lien) => (
                    <li key={lien.href}>
                      <a href={lien.href} className="text-sm text-ivory/80 hover:text-ivory">
                        {lien.label}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Version ordinateur : une colonne par rubrique */}
        {sections.map((section) => (
          <div key={section.id} className="hidden md:block">
            <p className="text-sm font-medium text-ivory mb-3">{section.titre}</p>
            <ul className="space-y-2 text-sm text-ivory/80">
              {section.liens.map((lien) => (
                <li key={lien.href}>
                  <a href={lien.href} className="hover:text-ivory">{lien.label}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-ivory/50">
          <p>&copy; 2026 {t("copyright")}</p>

          <p className="flex items-center gap-2">
            <svg width="12" height="14" viewBox="0 0 12 14" fill="none" aria-hidden>
              <rect x="1" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M3.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            {t("paiementSecurise")}
          </p>
        </div>
      </div>
    </footer>
  );
}