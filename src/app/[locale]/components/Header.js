"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
export default function Header() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const segments = pathname.split("/");
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  const langues = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "es", label: "ES" },
    { code: "it", label: "IT" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 h-[74px] bg-ink/80 backdrop-blur-md border-b border-ivory/10 z-50">
      <div className="max-w-[1240px] mx-auto h-full px-6 flex items-center justify-between">

       <a href="/" className="text-xl font-semibold uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
          Estalviar<span className="text-gold">.</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-ivory/80">
          <a href="/boutique" className="hover:text-ivory transition-colors">{t("boutique")}</a>
          <a href="/professionnels" className="hover:text-ivory transition-colors">{t("professionnels")}</a>
          <a href="/fidelite" className="hover:text-ivory transition-colors">{t("fidelite")}</a>
          <a href="/aide" className="hover:text-ivory transition-colors">{t("aide")}</a>
        </nav>

        <div className="flex items-center gap-4">
          <select
            defaultValue={segments[1]}
            onChange={(e) => {
              window.location.href = `/${e.target.value}${pathWithoutLocale}`;
            }}
            className="bg-transparent text-ivory/80 hover:text-ivory text-sm border border-ivory/20 rounded px-2 py-1"
          >
            {langues.map((l) => (
              <option key={l.code} value={l.code} className="bg-ink text-ivory">
                {l.label}
              </option>
            ))}
          </select>
          <a href="/panier" className="text-ivory/80 hover:text-ivory">🛒</a>
         <a href="/connexion" className="text-ivory/80 hover:text-ivory text-sm">{t("connexion")}</a>
        </div>

      </div>
    </header>
  );
}
