"use client";

import { useEffect, useState } from "react";

const MONTANTS = [20, 30, 50, 100];

// Carte posée à plat, personnalisable en direct (enseigne, prénom, message, montant)
export default function HeroCarte({ locale, marques, tx }) {
  const [indexMarque, setIndexMarque] = useState(0);
  const [prenom, setPrenom] = useState(tx.prenomDefaut);
  const [message, setMessage] = useState(tx.messages[0]);
  const [montant, setMontant] = useState(50);

  // Si la liste des enseignes change (catalogue chargé), on revient à la première
  useEffect(() => setIndexMarque(0), [marques]);

  const marque = marques[indexMarque] || marques[0];
  if (!marque) return null;

  const prenomAffiche = prenom.trim() || tx.prenomDefaut;
  const lienFiche = `/${locale}/boutique/${marque.slug}`;

  return (
    <div className="bg-white rounded-lg p-6 sm:p-7 flex flex-col gap-5 shadow-[0_18px_40px_rgba(17,22,43,0.14)]">
      {/* La carte */}
      <div className="bg-ink text-ivory rounded-xl aspect-[1.586] p-6 sm:p-7 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-4">
          <span className="bg-white rounded-md h-12 w-28 flex items-center justify-center">
            {marque.image ? (
              <img src={marque.image} alt={marque.nom} className="max-h-[60%] max-w-[80%] object-contain" />
            ) : (
              <span className="text-ink font-bold">{marque.nom}</span>
            )}
          </span>
          <span className="font-[family-name:var(--font-logo,var(--font-fraunces,serif))] font-semibold text-[13px] tracking-[0.08em]">
            ESTALVIAR<span className="text-gold">.</span>
          </span>
        </div>
        <div>
          <div className="text-lg font-semibold leading-tight">{tx.pourPrenom(prenomAffiche)}</div>
          <div className="text-sm text-[#BDB9AF] mt-1">{message}</div>
        </div>
        <div className="font-[family-name:var(--font-titre)] text-[40px] leading-none">
          {locale === "en" ? `€${montant}` : `${montant} €`}
        </div>
      </div>

      {/* Prénom */}
      <div className="flex flex-col gap-2">
        <label htmlFor="hero-prenom" className="text-[13px] font-semibold text-ink">{tx.pourQui}</label>
        <input
          id="hero-prenom"
          type="text"
          maxLength={24}
          value={prenom}
          onChange={(e) => setPrenom(e.target.value)}
          className="h-11 rounded border border-[#D9D5CB] bg-[#F6F5F2] px-3.5 text-[15px] text-ink focus:outline-none focus:border-ink"
        />
      </div>

      {/* Message */}
      <div className="flex flex-wrap gap-2">
        {tx.messages.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMessage(m)}
            aria-pressed={message === m}
            className={`min-h-9 px-3 rounded-full border text-sm transition-colors ${
              message === m ? "border-ink bg-ink text-ivory" : "border-[#D9D5CB] bg-white text-ink hover:border-ink"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Enseigne */}
      <fieldset>
        <legend className="sr-only">{tx.choisirEnseigne}</legend>
        <div className="flex flex-wrap gap-2">
          {marques.map((m, i) => (
            <button
              key={m.slug}
              type="button"
              onClick={() => setIndexMarque(i)}
              aria-pressed={i === indexMarque}
              aria-label={m.nom}
              className={`h-11 w-[72px] rounded bg-white flex items-center justify-center border transition-colors ${
                i === indexMarque ? "border-2 border-ink" : "border-[#D9D5CB] hover:border-ink"
              }`}
            >
              {m.image ? (
                <img src={m.image} alt="" className="max-h-[55%] max-w-[75%] object-contain" />
              ) : (
                <span className="text-xs font-semibold text-ink">{m.nom}</span>
              )}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Montant */}
      <fieldset>
        <legend className="sr-only">{tx.choisirMontant}</legend>
        <div className="flex flex-wrap gap-2">
          {MONTANTS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setMontant(v)}
              aria-pressed={montant === v}
              className={`min-h-11 px-4 rounded bg-white text-[15px] text-ink transition-colors ${
                montant === v ? "border-2 border-ink font-semibold" : "border border-[#D9D5CB] hover:border-ink"
              }`}
            >
              {locale === "en" ? `€${v}` : `${v} €`}
            </button>
          ))}
        </div>
      </fieldset>

      <a
        href={lienFiche}
        className="min-h-[52px] rounded bg-gold text-ink text-base font-semibold flex items-center justify-center hover:bg-[#B8921F] transition-colors"
      >
        {tx.offrir(marque.nom)}
      </a>
    </div>
  );
}
