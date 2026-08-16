"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function VerifierSolde() {
  const t = useTranslations("verifierSolde");
  const [code, setCode] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur(false);
    setResultat(null);

    const res = await fetch("/api/verifier-solde", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    setChargement(false);

    if (data.trouve) {
      setResultat(data);
    } else {
      setErreur(true);
    }
  };

  return (
    <div className="max-w-[500px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Estalviar</p>
      <h1 className="text-3xl font-semibold text-ivory mb-3">{t("titre")}</h1>
      <p className="text-ivory/60 text-sm mb-8">{t("description")}</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("placeholder")}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory font-mono text-sm"
        />
        <button
          type="submit"
          disabled={chargement}
          className="mt-4 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {chargement ? t("chargement") : t("bouton")}
        </button>
      </form>

      {resultat && (
        <div className="mt-8 border border-gold/30 bg-gold/5 rounded-xl p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-gold mb-1">{t("resultatTitre")}</p>
          <p className="text-ivory text-lg font-medium">{resultat.marque}</p>
          <p className="text-sm text-ivory/50 mt-1">{t("resultatMontant")}</p>
          <p className="text-4xl font-semibold text-ivory mt-2 font-[family-name:var(--font-fraunces)]">
            {resultat.montant} <span className="text-gold text-xl">€</span>
          </p>
          <p className="text-xs text-ivory/40 mt-4 leading-relaxed">
            {t("avertissement")}
          </p>
        </div>
      )}

      {erreur && (
        <p className="mt-6 text-sm text-corail text-center">{t("codeIntrouvable")}</p>
      )}
    </div>
  );
}