"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { couleurCarte, fondCarte, logoEnBlanc } from "../../../lib/couleursCartes";

const MONTANTS = [20, 30, 50, 100];

/**
 * Accueil : une carte cadeau qui se personnalise en direct (prénom, message, enseigne, montant).
 * Le bouton mène à la fiche de l'enseigne avec ces choix déjà remplis.
 */
export default function CarteVivante({ marques }) {
  const t = useTranslations("carteVivante");
  const locale = useLocale();
  const messages = [t("message1"), t("message2"), t("message3")];

  const [prenom, setPrenom] = useState("Camille");
  const [indexMarque, setIndexMarque] = useState(0);
  const [montant, setMontant] = useState(50);
  const [indexMessage, setIndexMessage] = useState(0);

  if (!marques.length) return null;
  const marque = marques[Math.min(indexMarque, marques.length - 1)];
  const montantAffiche = Math.min(Math.max(montant, marque.montant_min || 0), marque.montant_max || montant);
  const nom = prenom.trim() || t("prenomVide");
  const lien = `/${locale}/boutique/${marque.slug}?pour=${encodeURIComponent(prenom.trim())}&montant=${montantAffiche}&message=${encodeURIComponent(messages[indexMessage])}`;

  return (
    <div className="w-full max-w-[460px] mx-auto">
      {/* La carte */}
      <div className="relative px-2 sm:px-4">
        <div
          aria-hidden
          className="absolute inset-x-10 top-6 bottom-0 rounded-3xl blur-3xl opacity-50 transition-colors duration-500"
          style={{ background: couleurCarte(marque) }}
        />
        <div
          className="relative aspect-[1.586/1] rounded-2xl p-5 sm:p-7 flex flex-col justify-between -rotate-3 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.8)] border border-white/10"
          style={{ background: fondCarte(couleurCarte(marque)) }}
          aria-live="polite"
        >
          <div aria-hidden className="absolute inset-0 rounded-2xl opacity-[0.14]"
            style={{ background: "linear-gradient(115deg, transparent 35%, #fff 50%, transparent 65%)" }} />
          <div className="relative flex items-start justify-between">
            {/* Logo posé sur la carte, sans cadre */}
            <div className="h-10 sm:h-11 w-32 flex items-center">
              {marque.image
                ? <img src={marque.image} alt={marque.nom}
                    className={`max-h-full max-w-full object-contain object-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${logoEnBlanc(marque) ? "brightness-0 invert" : "rounded-md"}`} />
                : <span className="text-white text-lg font-semibold font-[family-name:var(--font-fraunces)]">{marque.nom}</span>}
            </div>
            <span className="text-white/70 text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
          </div>
          <div className="relative">
            <p className="text-white text-lg sm:text-xl font-medium truncate">{t("pour", { prenom: nom })}</p>
            <p className="text-white/70 text-sm italic truncate">« {messages[indexMessage]} »</p>
            <div className="h-px bg-white/25 my-3" />
            <p className="text-white text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-fraunces)] leading-none">
              {montantAffiche}<span className="text-gold text-2xl ml-1">€</span>
            </p>
          </div>
        </div>
      </div>

      {/* Les réglages */}
      <div className="mt-9 space-y-4">
        <div>
          <label htmlFor="prenom-vivant" className="block text-xs text-ivory/60 mb-1.5">{t("prenomLabel")}</label>
          <input
            id="prenom-vivant"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value.slice(0, 20))}
            className="w-full bg-ivory/[0.06] border border-ivory/15 rounded-lg px-4 py-2.5 text-ivory text-sm focus:border-gold/70 outline-none"
          />
        </div>

        <div role="group" aria-label={t("messageLabel")} className="flex flex-wrap gap-2">
          {messages.map((m, i) => (
            <button key={m} type="button" onClick={() => setIndexMessage(i)} aria-pressed={i === indexMessage}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                i === indexMessage ? "border-gold bg-gold/15 text-gold" : "border-ivory/15 text-ivory/70 hover:border-ivory/40"
              }`}>
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label={t("enseigneLabel")} className="flex gap-2 flex-wrap">
            {marques.map((m, i) => (
              <button key={m.slug} type="button" onClick={() => setIndexMarque(i)} aria-pressed={i === indexMarque} title={m.nom}
                className={`h-9 w-14 rounded-md bg-white flex items-center justify-center px-1.5 transition-all ${
                  i === indexMarque ? "ring-2 ring-gold ring-offset-2 ring-offset-ink" : "opacity-60 hover:opacity-100"
                }`}>
                {m.image ? <img src={m.image} alt={m.nom} className="h-[70%] w-full object-contain" />
                  : <span className="text-ink text-[9px] font-semibold leading-tight">{m.nom}</span>}
              </button>
            ))}
          </div>
          <div role="group" aria-label={t("montantLabel")} className="flex gap-1.5 sm:ml-auto">
            {MONTANTS.map((v) => (
              <button key={v} type="button" onClick={() => setMontant(v)} aria-pressed={v === montant}
                className={`text-sm rounded-md px-2.5 py-1.5 border transition-colors ${
                  v === montant ? "border-gold bg-gold text-ink font-semibold" : "border-ivory/15 text-ivory/75 hover:border-ivory/40"
                }`}>
                {v} €
              </button>
            ))}
          </div>
        </div>

        <a href={lien}
          className="block text-center w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors">
          {t("offrir", { marque: marque.nom })}
        </a>
      </div>
    </div>
  );
}
