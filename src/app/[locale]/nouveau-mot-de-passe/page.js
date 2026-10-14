"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import CadreCompte, { ChampMotDePasse, motDePasseValide } from "../components/CadreCompte";

/**
 * Page ouverte depuis le lien « réinitialiser mon mot de passe » reçu par email.
 * Supabase ouvre une session temporaire à partir du lien ; on demande le nouveau mot de passe.
 */
export default function NouveauMotDePasse() {
  const t = useTranslations("compte");
  const locale = useLocale();
  const [pret, setPret] = useState(null); // null = vérification, true = lien valide, false = lien expiré
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [fini, setFini] = useState(false);

  useEffect(() => {
    let annule = false;
    const { data: ecoute } = supabase.auth.onAuthStateChange((evenement, session) => {
      if (!annule && (evenement === "PASSWORD_RECOVERY" || session)) setPret(true);
    });
    // Le lien a peut-être déjà été lu avant l'abonnement
    const minuteur = setTimeout(async () => {
      const { data } = await supabase.auth.getSession();
      if (!annule) setPret((p) => p || !!data.session);
    }, 1500);
    return () => {
      annule = true;
      clearTimeout(minuteur);
      ecoute.subscription.unsubscribe();
    };
  }, []);

  const enregistrer = async (e) => {
    e.preventDefault();
    setErreur("");
    if (!motDePasseValide(motDePasse)) return setErreur(t("mdpRegle"));
    if (motDePasse !== confirmation) return setErreur(t("mdpDifferents"));
    setEnvoi(true);
    const { error } = await supabase.auth.updateUser({ password: motDePasse });
    setEnvoi(false);
    if (error) return setErreur(/different|same/i.test(error.message || "") ? t("mdpIdentique") : t("erreur"));
    setFini(true);
  };

  return (
    <CadreCompte titre={t("nouveauTitre")}>
      {fini ? (
        <div className="space-y-6">
          <p className="rounded-xl border border-vert/40 bg-vert/10 p-5 text-sm text-ivory/80" role="status">{t("nouveauOk")}</p>
          <a href={`/${locale}/profil`} className="block text-center bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors">
            {t("allerCompte")}
          </a>
        </div>
      ) : pret === false ? (
        <div className="space-y-6">
          <p className="rounded-xl border border-corail/40 bg-corail/10 p-5 text-sm text-ivory/80">{t("lienExpire")}</p>
          <a href={`/${locale}/mot-de-passe-oublie`} className="block text-center bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors">
            {t("recevoirLien")}
          </a>
        </div>
      ) : (
        <form onSubmit={enregistrer}>
          <label htmlFor="n-mdp" className="block text-sm text-ivory/70 mb-2">{t("nouveauMdp")}</label>
          <ChampMotDePasse id="n-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="new-password" minLength={8} />
          <p className="mt-1.5 text-xs text-ivory/45">{t("mdpRegle")}</p>
          <label htmlFor="n-mdp2" className="block text-sm text-ivory/70 mb-2 mt-6">{t("confirmerMdp")}</label>
          <ChampMotDePasse id="n-mdp2" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" minLength={8} />
          <button type="submit" disabled={envoi || !pret}
            className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {envoi ? t("envoiEnCours") : t("enregistrerMdp")}
          </button>
          {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}
        </form>
      )}
    </CadreCompte>
  );
}
