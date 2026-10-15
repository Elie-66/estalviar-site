"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MOTIFS, PLACEMENTS, themeDe } from "./themesEvenements";

// Motifs décoratifs dessinés en fond du bandeau (cœurs, flocons, citrouilles…)
export function DecorEvenement({ slug }) {
  const theme = themeDe(slug);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {PLACEMENTS.map((p, i) => {
        const motif = MOTIFS[theme.motifs[i % theme.motifs.length]];
        const couleur = theme.couleurs[i % theme.couleurs.length];
        return (
          <svg
            key={i}
            viewBox="0 0 24 24"
            width={p.taille}
            height={p.taille}
            className={`absolute animate-[flotter_6s_ease-in-out_infinite] ${
              p.x > 20 && p.x < 80 ? "hidden md:block" : "" // au centre : seulement sur grand écran (sinon sur le texte)
            }`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
              opacity: p.opacite,
              animationDelay: `${(i % 5) * 0.8}s`,
            }}
          >
            <path
              d={motif.d}
              fill={motif.plein ? couleur : "none"}
              stroke={motif.plein ? "none" : couleur}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      })}
    </div>
  );
}

// Placé tout en haut de l'accueil : il commence sous le menu (fixe, 74 px de haut).
// onAffiche(true/false) prévient la page pour qu'elle réduise l'espace au-dessus du titre.
export default function BandeauEvenement({ onAffiche }) {
  const t = useTranslations("evenement");
  const locale = useLocale();
  const [infos, setInfos] = useState(null);

  useEffect(() => {
    fetch("/api/evenement")
      .then((r) => r.json())
      .then((data) => {
        setInfos(data.evenement ? data : null);
        onAffiche?.(!!data.evenement);
      })
      .catch(() => setInfos(null));
  }, [onAffiche]);

  if (!infos) return null;
  const { evenement, cartes } = infos;
  const theme = themeDe(evenement.slug);
  const date = new Date(`${evenement.date}T12:00:00Z`).toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
  const quand =
    evenement.joursRestants === 0 ? t("aujourdhui")
    : evenement.joursRestants === 1 ? t("demain")
    : t("dansJours", { jours: evenement.joursRestants });

  return (
    <section
      className="relative overflow-hidden mt-[74px] border-b"
      style={{ background: theme.fond, borderColor: theme.bordure }}
    >
      <DecorEvenement slug={evenement.slug} />

      <div className="relative max-w-[1240px] mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
        <div className="text-center md:text-left">
          <p className="text-sm font-medium mb-2" style={{ color: theme.accent }}>
            <span className="first-letter:uppercase inline-block">{date}</span>
            <span className="text-ivory/60 font-normal">{", "}{quand.charAt(0).toLowerCase() + quand.slice(1)}</span>
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            {evenement.accroche || evenement.nom}
          </h2>
          <a
            href={`/${locale}/boutique?evenement=${evenement.slug}`}
            className="inline-block mt-6 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors shadow-lg shadow-black/30"
          >
            {t("voirSelection")}
          </a>
        </div>

        {cartes.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full max-w-[420px] md:w-[400px] mx-auto md:mx-0">
            {cartes.slice(0, 4).map((c, i) => (
              <a
                key={c.slug}
                href={`/${locale}/boutique/${c.slug}`}
                className="aspect-[4/3] w-full bg-white rounded-lg flex items-center justify-center p-2 shadow-lg shadow-black/30 hover:scale-105 hover:rotate-0 transition-transform"
                style={{ transform: `rotate(${[-3, 2, -2, 3][i]}deg)`, outline: `2px solid ${theme.bordure}` }}
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
