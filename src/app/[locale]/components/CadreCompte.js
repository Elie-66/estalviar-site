"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * Mise en page des pages de compte (connexion, inscription, mot de passe) :
 * à gauche ce que le compte apporte, à droite le formulaire.
 */
export default function CadreCompte({ titre, sousTitre, children, pied }) {
  const t = useTranslations("compte");
  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-28 md:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 lg:gap-20 items-center">
      {/* Ce que le compte apporte (masqué sur téléphone, résumé sous le formulaire) */}
      <div className="hidden lg:block">
        <div aria-hidden className="relative h-56 mb-10">
          <div className="absolute left-8 top-6 w-64 aspect-[1.586/1] rounded-2xl -rotate-6 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)]"
            style={{ background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)" }} />
          <div className="absolute left-40 top-0 w-64 aspect-[1.586/1] rounded-2xl rotate-3 shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] p-5 flex flex-col justify-between border border-white/10"
            style={{ background: "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)" }}>
            <span className="self-end text-white/70 text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
            <span className="text-white text-3xl font-semibold font-[family-name:var(--font-fraunces)]">25 <span className="text-base">{t("points")}</span></span>
          </div>
        </div>
        <p className="text-2xl font-semibold text-ivory font-[family-name:var(--font-fraunces)]">{t("avantagesTitre")}</p>
        <p className="mt-4 text-ivory/70 leading-relaxed max-w-[30rem]">{t("avantagesTexte")}</p>
      </div>

      <div className="w-full max-w-[440px] mx-auto lg:mx-0">
        <h1 className="text-3xl font-semibold text-ivory">{titre}</h1>
        {sousTitre && <p className="mt-2 text-sm text-ivory/60">{sousTitre}</p>}
        <div className="mt-8">{children}</div>
        {pied && <div className="mt-8 text-center text-sm text-ivory/55">{pied}</div>}
      </div>
    </div>
  );
}

export const classeChamp =
  "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold/60 transition-colors";

/** Champ mot de passe avec bouton « afficher » */
export function ChampMotDePasse({ id, value, onChange, autoComplete = "current-password", minLength }) {
  const t = useTranslations("compte");
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={visible ? "text" : "password"} value={value} onChange={onChange} required
        minLength={minLength} autoComplete={autoComplete} className={`${classeChamp} pr-12`} />
      <button type="button" onClick={() => setVisible(!visible)}
        aria-label={visible ? t("masquer") : t("afficher")}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ivory/50 hover:text-ivory transition-colors">
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.22-5.66M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export const motDePasseValide = (mdp) => mdp.length >= 8 && /[a-zA-Z]/.test(mdp) && /[0-9]/.test(mdp);
