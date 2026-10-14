"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import { POINTS_NEWSLETTER } from "../../../lib/newsletter";
import CadreCompte, { ChampMotDePasse, classeChamp, motDePasseValide } from "../components/CadreCompte";

// L'email peut être pré-rempli par un lien (ex. invitation après une participation à une cagnotte)
export default function PageInscription() {
  return (
    <Suspense fallback={null}>
      <Inscription />
    </Suspense>
  );
}

function Inscription() {
  const t = useTranslations("compte");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [pseudo, setPseudo] = useState("");
  const [email, setEmail] = useState(() => (searchParams.get("email") || "").slice(0, 200));
  const [motDePasse, setMotDePasse] = useState("");
  const [accepteMarketing, setAccepteMarketing] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState(false);

  const handleInscription = async (e) => {
    e.preventDefault();
    if (!motDePasseValide(motDePasse)) {
      setErreur(t("mdpRegle"));
      return;
    }
    setChargement(true);
    setErreur("");

    // Le profil est créé automatiquement par la base de données à l'inscription,
    // avec le pseudo et le choix marketing transmis ici.
    const { error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
      options: {
        data: { pseudo, accepte_marketing: accepteMarketing },
        emailRedirectTo: `${window.location.origin}/${locale}/connexion`,
      },
    });

    if (error) {
      const message = error.message || "";
      setErreur(/registered|exists/i.test(message) ? t("dejaInscrit") : /password/i.test(message) ? t("mdpRegle") : t("erreur"));
    } else {
      setSucces(true);
    }
    setChargement(false);
  };

  if (succes) {
    return (
      <div className="max-w-[520px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto" aria-hidden>✉</div>
        <h1 className="mt-6 text-3xl font-semibold text-ivory">{t("verifiezTitre")}</h1>
        <p className="mt-4 text-ivory/65 leading-relaxed">{t("verifiezTexte", { email })}</p>
        <p className="mt-3 text-sm text-ivory/45">{t("verifiezSpam")}</p>
      </div>
    );
  }

  return (
    <CadreCompte
      titre={t("inscriptionTitre")}
      sousTitre={t("inscriptionSousTitre")}
      pied={<>{t("dejaCompte")} <a href={`/${locale}/connexion`} className="text-gold hover:underline">{t("seConnecter")}</a></>}
    >
      <form onSubmit={handleInscription}>
        <label htmlFor="i-pseudo" className="block text-sm text-ivory/70 mb-2">{t("pseudo")}</label>
        <input id="i-pseudo" type="text" value={pseudo} onChange={(e) => setPseudo(e.target.value)} required maxLength={20}
          autoComplete="nickname" className={classeChamp} />

        <label htmlFor="i-email" className="block text-sm text-ivory/70 mb-2 mt-6">{t("email")}</label>
        <input id="i-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className={classeChamp} />

        <label htmlFor="i-mdp" className="block text-sm text-ivory/70 mb-2 mt-6">{t("motDePasse")}</label>
        <ChampMotDePasse id="i-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} autoComplete="new-password" minLength={8} />
        <p className={`mt-1.5 text-xs ${motDePasse && !motDePasseValide(motDePasse) ? "text-corail/90" : "text-ivory/45"}`}>{t("mdpRegle")}</p>

        <label className="flex items-start gap-3 mt-6 text-sm text-ivory/70 cursor-pointer">
          <input type="checkbox" checked={accepteMarketing} onChange={(e) => setAccepteMarketing(e.target.checked)}
            className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]" />
          <span>
            {t("newsletter")}
            <span className="block text-xs text-gold/85 mt-0.5">{t("newsletterBonus", { points: POINTS_NEWSLETTER })}</span>
          </span>
        </label>

        <button type="submit" disabled={chargement}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
          {chargement ? t("creationEnCours") : t("creerMonCompte")}
        </button>
        {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}

        <p className="mt-4 text-xs text-ivory/45 leading-relaxed">
          {t("mentionAvant")}{" "}
          <a href={`/${locale}/cgv`} className="underline hover:text-ivory/70">{t("cgv")}</a>{" "}
          {t("et")}{" "}
          <a href={`/${locale}/confidentialite`} className="underline hover:text-ivory/70">{t("confidentialite")}</a>.
        </p>
      </form>
    </CadreCompte>
  );
}
