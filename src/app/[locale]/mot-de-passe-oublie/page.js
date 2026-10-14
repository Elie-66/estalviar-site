"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import CadreCompte, { classeChamp } from "../components/CadreCompte";

export default function MotDePasseOublie() {
  const t = useTranslations("compte");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState("");

  const envoyer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/${locale}/nouveau-mot-de-passe`,
    });
    // Même message que l'adresse existe ou non (on ne révèle pas qui a un compte)
    if (error && /rate|limit|seconds/i.test(error.message || "")) setErreur(t("tropDemandes"));
    else setEnvoye(true);
    setEnvoi(false);
  };

  return (
    <CadreCompte
      titre={t("oublieTitre")}
      sousTitre={envoye ? null : t("oublieSousTitre")}
      pied={<a href={`/${locale}/connexion`} className="text-gold hover:underline">{t("retourConnexion")}</a>}
    >
      {envoye ? (
        <div className="rounded-xl border border-vert/40 bg-vert/10 p-5 text-sm text-ivory/80 leading-relaxed" role="status">
          {t("oublieEnvoye", { email })}
        </div>
      ) : (
        <form onSubmit={envoyer}>
          <label htmlFor="o-email" className="block text-sm text-ivory/70 mb-2">{t("email")}</label>
          <input id="o-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={classeChamp} />
          <button type="submit" disabled={envoi}
            className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {envoi ? t("envoiEnCours") : t("recevoirLien")}
          </button>
          {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}
        </form>
      )}
    </CadreCompte>
  );
}
