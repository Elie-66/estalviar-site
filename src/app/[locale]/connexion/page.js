"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import CadreCompte, { ChampMotDePasse, classeChamp } from "../components/CadreCompte";

export default function Connexion() {
  const t = useTranslations("compte");
  const tErreur = useTranslations("erreursAuth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleConnexion = async (e) => {
    e.preventDefault();
    setChargement(true);
    setErreur("");
    try {
      const res = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, motDePasse }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(tErreur.has(data.error || "") ? tErreur(data.error) : t("erreur"));
        setChargement(false);
        return;
      }
      if (data.session) {
        await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }
      window.location.href = `/${locale}/profil`;
    } catch {
      setErreur(t("erreur"));
      setChargement(false);
    }
  };

  return (
    <CadreCompte
      titre={t("connexionTitre")}
      sousTitre={t("connexionSousTitre")}
      pied={<>{t("pasDeCompte")} <a href={`/${locale}/inscription`} className="text-gold hover:underline">{t("creerCompte")}</a></>}
    >
      <form onSubmit={handleConnexion}>
        <label htmlFor="c-email" className="block text-sm text-ivory/70 mb-2">{t("email")}</label>
        <input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={classeChamp} />

        <div className="mt-6 mb-2 flex items-baseline justify-between gap-4">
          <label htmlFor="c-mdp" className="text-sm text-ivory/70">{t("motDePasse")}</label>
          <a href={`/${locale}/mot-de-passe-oublie`} className="text-xs text-ivory/55 hover:text-gold underline underline-offset-2">{t("oublie")}</a>
        </div>
        <ChampMotDePasse id="c-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />

        <button type="submit" disabled={chargement}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
          {chargement ? t("connexionEnCours") : t("seConnecter")}
        </button>
        {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}
      </form>
    </CadreCompte>
  );
}
