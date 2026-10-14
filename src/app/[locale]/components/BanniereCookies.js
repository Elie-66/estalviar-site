"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * Le site n'utilise que des traceurs nécessaires (panier, connexion, langue) : pas de consentement
 * à demander. Ce bandeau informe simplement, une fois, avec un lien vers la politique de cookies.
 */
export default function BanniereCookies() {
  const t = useTranslations("cookiesBandeau");
  const locale = useLocale();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let dejaVu = true;
    try {
      dejaVu = !!localStorage.getItem("estalviar-cookies-consentement");
    } catch {
      // stockage indisponible : on n'affiche rien
    }
    if (!dejaVu) {
      const minuteur = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(minuteur);
    }
  }, []);

  const fermer = () => {
    try {
      localStorage.setItem("estalviar-cookies-consentement", "vu");
    } catch {
      // rien à faire
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div role="region" aria-label={t("titre")}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-[420px] z-[100] rounded-2xl bg-ink-secondary border border-ivory/15 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] p-5">
      <p className="text-sm text-ivory/75 leading-relaxed">
        {t("texte")}{" "}
        <a href={`/${locale}/cookies`} className="text-gold underline underline-offset-2">{t("lien")}</a>
      </p>
      <button onClick={fermer}
        className="mt-4 w-full text-sm bg-gold text-ink font-semibold rounded-lg px-4 py-2.5 hover:bg-gold/90 transition-colors">
        {t("ok")}
      </button>
    </div>
  );
}
