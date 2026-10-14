"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

// Bandeau de la page d'accueil : l'événement du moment (Fête des mères, Noël…) et quelques marques.
// N'affiche rien s'il n'y a pas d'événement en cours.
export default function BandeauEvenement() {
  const t = useTranslations("evenement");
  const locale = useLocale();
  const [infos, setInfos] = useState(null);

  useEffect(() => {
    fetch("/api/evenement")
      .then((r) => r.json())
      .then((data) => setInfos(data.evenement ? data : null))
      .catch(() => setInfos(null));
  }, []);

  if (!infos) return null;
  const { evenement, cartes } = infos;
  const date = new Date(`${evenement.date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
  const quand =
    evenement.joursRestants === 0 ? t("aujourdhui")
    : evenement.joursRestants === 1 ? t("demain")
    : t("dansJours", { jours: evenement.joursRestants });

  return (
    <section className="border-t border-gold/20 bg-gold/[0.04]">
      <div className="max-w-[1240px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-3">
            {evenement.nom} · <span className="normal-case tracking-normal">{date}</span> · {quand}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory leading-tight">
            {evenement.accroche || evenement.nom}
          </h2>
          <a
            href={`/${locale}/boutique?evenement=${evenement.slug}`}
            className="inline-block mt-6 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
          >
            {t("voirSelection")}
          </a>
        </div>

        {cartes.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[420px] md:w-[400px] mx-auto md:mx-0">
            {cartes.slice(0, 4).map((c) => (
              <a
                key={c.slug}
                href={`/${locale}/boutique/${c.slug}`}
                className="aspect-[4/3] w-full bg-white rounded-lg flex items-center justify-center p-2 hover:scale-105 transition-transform"
                title={c.nom}
              >
                {c.image ? (
                  <img src={c.image} alt={c.nom} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-ink text-[11px] text-center leading-tight">{c.nom}</span>
                )}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
