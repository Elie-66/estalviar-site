"use client";

import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function Connexion() {
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleConnexion = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");

    const ilYAQuinzeMinutes = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("tentatives_connexion")
      .select("*", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .gte("created_at", ilYAQuinzeMinutes);

    if (count >= 5) {
      setErreur("Trop de tentatives échouées. Réessayez dans 15 minutes.");
      setChargement(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });

    if (error) {
      await supabase.from("tentatives_connexion").insert({ email: email.toLowerCase() });
      setErreur(error.message);
      setChargement(false);
    } else {
      window.location.href = "/fr/profil";
    }
  };

  return (
    <div className="max-w-[440px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-8">Se connecter</h1>

      <form onSubmit={handleConnexion}>
        <label className="block text-sm text-ivory/70 mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-6">Mot de passe</label>
        <div className="relative">
          <input
            type={afficherMotDePasse ? "text" : "password"}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 pr-12 text-ivory outline-none focus:border-gold/50 transition-colors"
          />
          <button
            type="button"
            onClick={() => setAfficherMotDePasse(!afficherMotDePasse)}
            aria-label={afficherMotDePasse ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 hover:text-ink/80 transition-colors"
          >
            {afficherMotDePasse ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.22-5.66M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.6 18.6 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <button
          type="submit"
          disabled={chargement}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {chargement ? "Connexion..." : "Se connecter"}
        </button>

        {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-ivory/50">
        Pas encore de compte ? <a href="/fr/inscription" className="text-gold hover:underline">Créer un compte</a>
      </p>
    </div>
  );
}