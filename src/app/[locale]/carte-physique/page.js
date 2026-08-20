"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function CartePhysique() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    setResultat(null);

    let emailUtilise = email;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      emailUtilise = user.email;
    }

    if (!emailUtilise) {
      setErreur("Veuillez indiquer votre email.");
      setChargement(false);
      return;
    }

    const res = await fetch("/api/activer-carte-physique", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, email: emailUtilise }),
    });

    const data = await res.json();
    setChargement(false);

    if (res.ok) {
      setResultat(data);
    } else {
      setErreur(data.error || "Une erreur est survenue.");
    }
  };

  return (
    <div className="max-w-[500px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Estalviar</p>
      <h1 className="text-3xl font-semibold text-ivory mb-3">Activer ma carte physique</h1>
      <p className="text-ivory/60 text-sm mb-8">
        Entrez le code présent au dos de votre carte pour lier son solde à votre compte.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="block text-sm text-ivory/70 mb-2">Code de la carte</label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="ABCD-1234-EFGH-5678"
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory font-mono text-sm"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Votre email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm"
        />

        <button
          type="submit"
          disabled={chargement}
          className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {chargement ? "Vérification..." : "Activer ma carte"}
        </button>
      </form>

      {resultat && (
        <div className="mt-8 border border-gold/30 bg-gold/5 rounded-xl p-6 text-center">
          <p className="text-xs uppercase tracking-wide text-gold mb-1">Carte activée</p>
          <p className="text-sm text-ivory/50 mt-1">Solde disponible</p>
          <p className="text-4xl font-semibold text-ivory mt-2 font-[family-name:var(--font-fraunces)]">
            {resultat.solde} <span className="text-gold text-xl">€</span>
          </p>
          <a
            href="/fr/boutique"
            className="inline-block mt-4 text-sm text-gold hover:underline"
          >
            Utiliser ce solde sur la boutique →
          </a>
        </div>
      )}

      {erreur && (
        <p className="mt-6 text-sm text-corail text-center">{erreur}</p>
      )}
    </div>
  );
}