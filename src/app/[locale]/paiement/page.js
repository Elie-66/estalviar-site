"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePanier } from "../context/PanierContext";
import { supabase } from "../../../lib/supabase";
import { fetchSession } from "../../../lib/fetchSession";
import { ChampMotDePasse, classeChamp, motDePasseValide } from "../components/CadreCompte";

function Etape({ numero, titre, children }) {
  return (
    <section className="border-t border-ivory/10 pt-7 mt-7 first:border-t-0 first:pt-0 first:mt-0">
      <h2 className="flex items-center gap-3 text-lg font-semibold text-ivory mb-5">
        <span className="w-7 h-7 rounded-full border border-gold/50 text-gold text-sm flex items-center justify-center font-[family-name:var(--font-fraunces)]">
          {numero}
        </span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export default function Paiement() {
  const t = useTranslations("paiement");
  const tCompte = useTranslations("compte");
  const tErreur = useTranslations("erreursAuth");
  const locale = useLocale();
  const { articles, total } = usePanier();
  const [emailAcheteur, setEmailAcheteur] = useState("");
  const [emailsBeneficiaires, setEmailsBeneficiaires] = useState({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  // Case obligatoire : CGV + envoi immédiat de la carte (perte du droit de rétractation à l'envoi)
  const [accepteCgv, setAccepteCgv] = useState(false);
  const [cashback, setCashback] = useState(null);
  const [utiliserCashback, setUtiliserCashback] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const [codeApplique, setCodeApplique] = useState(null);
  const [erreurCode, setErreurCode] = useState("");
  const [verificationCode, setVerificationCode] = useState(false);

  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
  const [modeAuth, setModeAuth] = useState("invite"); // "invite" | "creer" | "connexion"
  const [motDePasse, setMotDePasse] = useState("");
  const [chargementAuth, setChargementAuth] = useState(false);
  const [messageAuth, setMessageAuth] = useState(null); // { texte, ok }

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailAcheteur(user.email);
      }
    };
    charger();
  }, []);

  // Cashback disponible pour ce panier (calculé par le serveur)
  useEffect(() => {
    if (!utilisateurConnecte || !total) return;
    fetchSession(`/api/cashback?total=${total}`)
      .then((r) => r.json())
      .then((data) => setCashback(data.connecte ? data : null))
      .catch(() => setCashback(null));
  }, [utilisateurConnecte, total]);

  const cashbackAffiche = utilisateurConnecte && total ? cashback : null;
  // Le code reste appliqué tant que le panier ne change pas (sinon il faut le revalider)
  const codeAffiche = codeApplique && utilisateurConnecte && codeApplique.total === total ? codeApplique : null;
  const reductionCashback = !codeAffiche && utiliserCashback && cashbackAffiche ? cashbackAffiche.utilisable : 0;
  const totalAPayer = Math.round((total - reductionCashback) * 100) / 100;
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(n) || 0);
  const dateEnvoi = (a) =>
    new Date(`${a.dateEnvoi}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

  const handleAppliquerCode = async (e) => {
    e.preventDefault();
    if (!codeSaisi.trim()) return;
    setVerificationCode(true);
    setErreurCode("");
    try {
      const res = await fetchSession("/api/code-influence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSaisi,
          articles: articles.map((a) => ({ marque: a.marque, montant: a.montant })),
        }),
      });
      const data = await res.json();
      if (data.valide) {
        setCodeApplique({ ...data, total });
        setUtiliserCashback(false);
      } else {
        setCodeApplique(null);
        setErreurCode(data.error || t("codeInvalide"));
      }
    } catch {
      setErreurCode(t("erreurReseau"));
    } finally {
      setVerificationCode(false);
    }
  };

  const handleRetirerCode = () => {
    setCodeApplique(null);
    setCodeSaisi("");
    setErreurCode("");
  };

  const handleCreerCompte = async (e) => {
    e.preventDefault();
    if (!motDePasseValide(motDePasse)) return setMessageAuth({ texte: tCompte("mdpRegle"), ok: false });
    setChargementAuth(true);
    setMessageAuth(null);
    // Le profil est créé automatiquement par la base de données à l'inscription.
    const { error } = await supabase.auth.signUp({
      email: emailAcheteur,
      password: motDePasse,
      options: { emailRedirectTo: `${window.location.origin}/${locale}/paiement` },
    });
    if (error) {
      setMessageAuth({ texte: /registered|exists/i.test(error.message || "") ? tCompte("dejaInscrit") : tCompte("erreur"), ok: false });
    } else {
      setMessageAuth({ texte: t("compteCree"), ok: true });
      setModeAuth("invite");
    }
    setChargementAuth(false);
  };

  // Même route que la page de connexion (limite les tentatives)
  const handleConnexion = async (e) => {
    e.preventDefault();
    setChargementAuth(true);
    setMessageAuth(null);
    try {
      const res = await fetch("/api/connexion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAcheteur, motDePasse }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessageAuth({ texte: tErreur.has(data.error || "") ? tErreur(data.error) : tCompte("erreur"), ok: false });
      } else {
        if (data.session) {
          await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
        }
        const { data: { user } } = await supabase.auth.getUser();
        setUtilisateurConnecte(user);
        setModeAuth("invite");
        setMotDePasse("");
      }
    } catch {
      setMessageAuth({ texte: tCompte("erreur"), ok: false });
    }
    setChargementAuth(false);
  };

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    setUtilisateurConnecte(null);
    setEmailAcheteur("");
    setCashback(null);
    setCodeApplique(null);
  };

  const handlePaiement = async () => {
    setChargement(true);
    setErreur("");
    try {
      localStorage.setItem("estalviar-emails-beneficiaires", JSON.stringify(emailsBeneficiaires));
      const res = await fetchSession("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles,
          emailAcheteur,
          emailsBeneficiaires,
          utiliserCashback: reductionCashback > 0,
          codeInfluence: codeAffiche ? codeAffiche.code : null,
          accepteCgv,
          locale,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErreur(data.error || t("erreurInconnue"));
        setChargement(false);
      }
    } catch {
      setErreur(t("erreurReseau"));
      setChargement(false);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="max-w-[640px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">{t("titre")}</h1>
        <p className="mt-4 text-ivory/60">{t("panierVide")}</p>
        <a href={`/${locale}/boutique`}
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
          {t("decouvrir")}
        </a>
      </div>
    );
  }

  const onglet = (mode, label) => (
    <button type="button" onClick={() => { setModeAuth(mode); setMessageAuth(null); }} aria-pressed={modeAuth === mode}
      className={`flex-1 text-xs sm:text-sm py-2 px-2 rounded-md transition-colors ${
        modeAuth === mode ? "bg-gold text-ink font-medium" : "text-ivory/65 hover:text-ivory"
      }`}>
      {label}
    </button>
  );

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      <a href={`/${locale}/panier`} className="text-sm text-ivory/55 hover:text-gold">‹ {t("retourPanier")}</a>
      <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 lg:gap-14 items-start">
        <div>
          {/* 1. Coordonnées */}
          <Etape numero={1} titre={t("etapeCoordonnees")}>
            {utilisateurConnecte ? (
              <div className="border border-gold/25 bg-gold/[0.06] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ivory/80">
                  {t("connecteEn")} <span className="text-gold break-all">{utilisateurConnecte.email}</span>
                </p>
                <button onClick={handleDeconnexion} className="text-xs text-ivory/55 hover:text-ivory underline">{t("deconnexion")}</button>
              </div>
            ) : (
              <>
                <div className="flex gap-1 border border-ivory/10 rounded-lg p-1 mb-5" role="group">
                  {onglet("invite", t("ongletInvite"))}
                  {onglet("connexion", t("ongletConnexion"))}
                  {onglet("creer", t("ongletCreer"))}
                </div>
                {modeAuth === "invite" ? (
                  <div>
                    <label htmlFor="p-email" className="block text-sm text-ivory/70 mb-2">{t("votreEmail")}</label>
                    <input id="p-email" type="email" value={emailAcheteur} onChange={(e) => setEmailAcheteur(e.target.value)}
                      placeholder={t("emailExemple")} required autoComplete="email" className={classeChamp} />
                    <p className="mt-1.5 text-xs text-ivory/45">{t("emailAide")}</p>
                    <p className="mt-1 text-xs text-gold/80">{t("compteAvantage")}</p>
                  </div>
                ) : (
                  <form onSubmit={modeAuth === "creer" ? handleCreerCompte : handleConnexion}>
                    <label htmlFor="p-email2" className="block text-sm text-ivory/70 mb-2">{tCompte("email")}</label>
                    <input id="p-email2" type="email" value={emailAcheteur} onChange={(e) => setEmailAcheteur(e.target.value)}
                      required autoComplete="email" className={classeChamp} />
                    <label htmlFor="p-mdp" className="block text-sm text-ivory/70 mb-2 mt-4">{tCompte("motDePasse")}</label>
                    <ChampMotDePasse id="p-mdp" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)}
                      autoComplete={modeAuth === "creer" ? "new-password" : "current-password"} />
                    {modeAuth === "creer" && <p className="mt-1.5 text-xs text-ivory/45">{tCompte("mdpRegle")}</p>}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <button type="submit" disabled={chargementAuth}
                        className="border border-gold text-gold text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40">
                        {chargementAuth ? "…" : modeAuth === "creer" ? tCompte("creerMonCompte") : tCompte("seConnecter")}
                      </button>
                      {modeAuth === "connexion" && (
                        <a href={`/${locale}/mot-de-passe-oublie`} className="text-xs text-ivory/55 hover:text-gold underline">{tCompte("oublie")}</a>
                      )}
                    </div>
                  </form>
                )}
                {messageAuth && (
                  <p role="status" className={`mt-3 text-sm ${messageAuth.ok ? "text-vert" : "text-corail"}`}>{messageAuth.texte}</p>
                )}
              </>
            )}
          </Etape>

          {/* 2. Envoi des cartes */}
          <Etape numero={2} titre={t("etapeEnvoi")}>
            <p className="text-sm text-ivory/60 mb-4">{t("envoiAide")}</p>
            <ul className="space-y-3">
              {articles.map((a) => (
                <li key={a.id} className="rounded-xl border border-ivory/10 p-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-ivory text-sm font-medium truncate">
                      {a.marque}{a.beneficiaire ? <span className="text-ivory/55 font-normal"> · {t("pour", { prenom: a.beneficiaire })}</span> : null}
                    </p>
                    <p className="text-ivory text-sm whitespace-nowrap">{euros(a.montant)}</p>
                  </div>
                  <p className="text-xs text-gold/80 mt-1">
                    {a.dateEnvoi ? t("envoiProgramme", { date: dateEnvoi(a), heure: a.heureEnvoi || "" }) : t("envoiImmediat")}
                  </p>
                  <input type="email" value={emailsBeneficiaires[a.id] || ""}
                    onChange={(e) => setEmailsBeneficiaires((prev) => ({ ...prev, [a.id]: e.target.value }))}
                    placeholder={t("emailDestinataire")} aria-label={t("emailDestinataire")}
                    className="mt-3 w-full bg-ivory/[0.03] border border-ivory/15 rounded-lg px-3 py-2.5 text-sm text-ivory placeholder:text-ivory/35 focus:border-gold/50 outline-none" />
                </li>
              ))}
            </ul>
          </Etape>

          {/* 3. Cashback et code partenaire */}
          <Etape numero={3} titre={t("etapeAvantages")}>
            {!codeAffiche && cashbackAffiche && (cashbackAffiche.disponible > 0 || cashbackAffiche.enAttente > 0) && (
              <div className="mb-6 border border-gold/30 rounded-xl p-4">
                {cashbackAffiche.utilisable > 0 ? (
                  <label className="flex items-start gap-3 text-sm text-ivory cursor-pointer">
                    <input type="checkbox" checked={utiliserCashback} onChange={(e) => setUtiliserCashback(e.target.checked)}
                      className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]" />
                    <span>
                      {t("utiliserCashback")} <span className="text-gold font-semibold">−{euros(cashbackAffiche.utilisable)}</span>
                      <span className="block text-xs text-ivory/55 mt-0.5">
                        {t("cashbackDispo", { montant: euros(cashbackAffiche.disponible), max: cashbackAffiche.regles.plafondPourcent })}
                      </span>
                      <span className="block text-xs text-ivory/45 mt-0.5">{t("cashbackPasCumul")}</span>
                    </span>
                  </label>
                ) : (
                  <p className="text-sm text-ivory/65">
                    {cashbackAffiche.disponible > 0
                      ? t("cashbackMinimum", { montant: euros(cashbackAffiche.disponible), min: cashbackAffiche.regles.commandeMinimum })
                      : t("cashbackAttente", { montant: euros(cashbackAffiche.enAttente) })}
                  </p>
                )}
              </div>
            )}

            {codeAffiche ? (
              <div className="border border-gold/30 bg-gold/[0.06] rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-ivory">
                    {t("codeApplique", { code: codeAffiche.code, montant: euros(codeAffiche.cashbackAbonne) })}
                    {codeAffiche.cartesConcernees ? ` (${codeAffiche.cartesConcernees.join(", ")})` : ""}
                  </p>
                  <button onClick={handleRetirerCode} className="text-xs text-ivory/55 hover:text-ivory underline shrink-0">{t("retirer")}</button>
                </div>
                <p className="text-xs text-ivory/55 mt-2">{t("codeRegles", { jours: cashbackAffiche?.regles?.joursAttente || 14 })}</p>
              </div>
            ) : (
              <form onSubmit={handleAppliquerCode}>
                <label htmlFor="p-code" className="block text-sm text-ivory/70 mb-2">{t("codePartenaire")}</label>
                <div className="flex gap-2">
                  <input id="p-code" type="text" value={codeSaisi} onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
                    placeholder={t("codeExemple")} maxLength={20}
                    className="flex-1 min-w-0 bg-ivory/[0.03] border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm uppercase outline-none focus:border-gold/50" />
                  <button type="submit" disabled={!codeSaisi.trim() || verificationCode}
                    className="border border-gold text-gold text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40">
                    {verificationCode ? "…" : t("appliquer")}
                  </button>
                </div>
                {erreurCode && <p className="mt-2 text-xs text-corail">{erreurCode}</p>}
                {codeApplique && !codeAffiche && utilisateurConnecte && <p className="mt-2 text-xs text-ivory/55">{t("codePanierChange")}</p>}
                {!utilisateurConnecte && <p className="mt-1.5 text-xs text-ivory/45">{t("codeCompte")}</p>}
              </form>
            )}
          </Etape>
        </div>

        {/* Récapitulatif + paiement (collé en haut sur ordinateur) */}
        <aside className="lg:sticky lg:top-28 rounded-2xl border border-ivory/15 bg-ivory/[0.03] p-6">
          <h2 className="text-lg font-semibold text-ivory">{t("recap")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {articles.map((a) => (
              <li key={a.id} className="flex items-center gap-3">
                <span className="w-10 aspect-[1.586/1] rounded shrink-0 border border-white/10" style={{ background: a.background }} aria-hidden />
                <span className="flex-1 min-w-0 truncate text-ivory/80">{a.marque}</span>
                <span className="text-ivory/80 whitespace-nowrap">{euros(a.montant)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 pt-4 border-t border-ivory/10 space-y-1.5 text-sm">
            <div className="flex justify-between text-ivory/65"><span>{t("sousTotal")}</span><span>{euros(total)}</span></div>
            <div className="flex justify-between text-ivory/65"><span>{t("frais")}</span><span>{euros(0)}</span></div>
            {reductionCashback > 0 && (
              <div className="flex justify-between text-gold"><span>{t("cashbackUtilise")}</span><span>−{euros(reductionCashback)}</span></div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-ivory/10 flex justify-between items-baseline">
            <span className="text-ivory font-medium">{t("total")}</span>
            <span className="text-2xl font-semibold text-ivory">{euros(totalAPayer)}</span>
          </div>

          <label className="mt-6 flex items-start gap-3 text-xs text-ivory/70 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={accepteCgv} onChange={(e) => setAccepteCgv(e.target.checked)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-[#C9A227]" />
            <span>
              {t("cgvAvant")}{" "}
              <a href={`/${locale}/cgv`} target="_blank" className="text-gold underline underline-offset-2">{t("cgvLien")}</a>{" "}
              {t("cgvApres")}
            </span>
          </label>

          <button onClick={handlePaiement} disabled={!emailAcheteur || !accepteCgv || chargement}
            className="mt-5 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {chargement ? t("redirection") : t("payer", { montant: euros(totalAPayer) })}
          </button>
          {!emailAcheteur && <p className="mt-2 text-xs text-ivory/50 text-center">{t("emailRequis")}</p>}
          {emailAcheteur && !accepteCgv && <p className="mt-2 text-xs text-ivory/50 text-center">{t("cgvRequise")}</p>}
          {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}

          <p className="mt-5 flex items-center justify-center gap-2 text-xs text-ivory/50">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {t("securise")}
          </p>
        </aside>
      </div>
    </div>
  );
}
