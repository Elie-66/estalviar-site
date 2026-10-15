"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import { fetchSession } from "../../../lib/fetchSession";
import { POINTS_NEWSLETTER } from "../../../lib/newsletter";
import { JOURS_AVANT_RAPPEL } from "../../../lib/rappelsAnniversaire";

// Client connecté ? (null tant qu'on ne sait pas)
function useSession() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session || false));
  }, []);
  return session;
}

/* ---------- Trouver la bonne carte : par univers et par budget ---------- */

const BUDGETS = [
  { montant: 20, cle: "budget20", fond: "linear-gradient(150deg, #2E7D6B 0%, #173f36 100%)" },
  { montant: 50, cle: "budget50", fond: "linear-gradient(150deg, #C9A227 0%, #7a6012 100%)" },
  { montant: 100, cle: "budget100", fond: "linear-gradient(150deg, #5B3A5C 0%, #2a1a2b 100%)" },
];

export function TrouverCarte({ cartes, traduireCategorie }) {
  const t = useTranslations("accueil2");
  const tVit = useTranslations("accueilVitrine");
  const locale = useLocale();
  if (!cartes.length) return null;

  // Univers : les catégories les plus fournies, avec 3 logos chacune
  const parCategorie = {};
  cartes.forEach((c) => {
    if (!c.categorie) return;
    (parCategorie[c.categorie] ||= []).push(c);
  });
  const univers = Object.entries(parCategorie)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 6);

  return (
    <section className="border-t border-ivory/10">
      <div className="max-w-[1240px] mx-auto px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{t("trouverTitre")}</h2>
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-12 lg:gap-16">

          <div>
            <h3 className="text-sm font-medium text-ivory/55 mb-2">{t("parUnivers")}</h3>
            <ul className="border-t border-ivory/10">
              {univers.map(([nom, liste]) => (
                <li key={nom} className="border-b border-ivory/10">
                  <a href={`/${locale}/boutique?categorie=${encodeURIComponent(nom)}`}
                    className="group flex items-center gap-4 py-4">
                    <span className="flex-1 min-w-0">
                      <span className="block text-ivory text-lg sm:text-xl font-semibold font-[family-name:var(--font-fraunces)] group-hover:text-gold transition-colors truncate">
                        {traduireCategorie(nom)}
                      </span>
                      <span className="block text-xs text-ivory/45 mt-0.5">{tVit("nbEnseignes", { n: liste.length })}</span>
                    </span>
                    <span className="hidden sm:flex gap-1.5 shrink-0" aria-hidden>
                      {liste.filter((c) => c.image).slice(0, 3).map((c) => (
                        <span key={c.slug} className="h-8 w-14 rounded bg-white flex items-center justify-center px-1.5">
                          <img src={c.image} alt="" className="max-h-[65%] max-w-full object-contain" />
                        </span>
                      ))}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-ivory/55 mb-4">{t("parBudget")}</h3>
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              {BUDGETS.map((b) => {
                const nombre = cartes.filter((c) => c.montant_min <= b.montant && b.montant <= c.montant_max).length;
                return (
                  <a key={b.montant} href={`/${locale}/boutique?budget=${b.montant}`}
                    className="group flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-5 focus-visible:outline-2 focus-visible:outline-gold rounded-xl">
                    <span className="relative block w-full lg:w-40 shrink-0 aspect-[1.586/1] rounded-xl p-3 border border-white/10 shadow-[0_14px_30px_-18px_rgba(0,0,0,0.9)] transition-transform group-hover:-translate-y-0.5"
                      style={{ background: b.fond }}>
                      <span className="absolute top-2.5 right-3 text-white/60 text-[8px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
                      <span className="absolute bottom-2.5 left-3 text-white text-2xl sm:text-3xl font-semibold leading-none font-[family-name:var(--font-fraunces)]">
                        {b.montant}<span className="text-base ml-0.5 opacity-80">€</span>
                      </span>
                    </span>
                    <span>
                      <span className="block text-ivory text-sm sm:text-base font-medium group-hover:text-gold transition-colors">{t(b.cle)}</span>
                      <span className="block text-xs text-ivory/45 mt-0.5">{tVit("nbEnseignes", { n: nombre })}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------- Deux services : cagnotte et rappels d'anniversaire ---------- */

export function Services() {
  const t = useTranslations("accueil2");
  const tPlus = useTranslations("accueilPlus");
  const tCagnotte = useTranslations("cagnotteAccueil");
  const locale = useLocale();
  const session = useSession();
  const lienRappels = session ? `/${locale}/profil?onglet=beneficiaires` : `/${locale}/inscription`;
  const lien = "inline-block mt-5 text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold";

  return (
    <section className="border-t border-ivory/10">
      <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-10 lg:gap-20">

        {/* Cagnotte */}
        <div>
          <div aria-hidden className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-ivory/10 bg-ivory/[0.03] flex items-center justify-center">
            <div className="w-[58%] max-w-[290px] aspect-[1.586/1] -rotate-3 rounded-xl p-4 flex flex-col justify-between border border-white/10 shadow-[0_24px_40px_-24px_rgba(0,0,0,0.9)]"
              style={{ background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)" }}>
              <div className="flex justify-between items-start">
                <span className="text-white text-xs font-medium">{tPlus("cagnotteVisuel")}</span>
                <span className="text-white/50 text-[8px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
              </div>
              <div>
                <p className="text-white text-2xl font-semibold leading-none font-[family-name:var(--font-fraunces)]">
                  140<span className="text-gold text-base ml-0.5">€</span><span className="text-white/40 text-xs font-sans ml-1.5">/ 200 €</span>
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full w-[70%] bg-gold rounded-full" /></div>
              </div>
            </div>
          </div>
          <h2 className="mt-7 text-2xl font-semibold text-ivory">{t("cagnotteTitre")}</h2>
          <p className="mt-2 text-ivory/65 leading-relaxed max-w-[30rem]">{t("cagnotteTexte")}</p>
          <a href={`/${locale}/cagnotte/creer`} className={lien}>{tCagnotte("bouton")}</a>
        </div>

        {/* Rappels d'anniversaire */}
        <div>
          <div aria-hidden className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border border-ivory/10 bg-ivory/[0.03] flex items-center justify-center">
            <div className="w-[82%] max-w-[360px] rotate-2 rounded-xl bg-ivory text-ink shadow-[0_24px_40px_-24px_rgba(0,0,0,0.9)] overflow-hidden">
              <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-ink/10">
                <span className="w-6 h-6 rounded-full bg-ink text-ivory text-[11px] flex items-center justify-center font-semibold font-[family-name:var(--font-fraunces)]">
                  E<span className="text-gold">.</span>
                </span>
                <span className="text-xs font-medium">{tPlus("rappelExempleDe")}</span>
                <span className="ml-auto text-[11px] text-ink/45">08:30</span>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-sm font-semibold leading-snug font-[family-name:var(--font-fraunces)]">
                  {tPlus("rappelExempleTitre", { jours: JOURS_AVANT_RAPPEL })}
                </p>
                <span className="mt-2.5 inline-block bg-gold text-ink text-xs font-semibold rounded-md px-3 py-1.5">
                  {tPlus("rappelExempleBouton")}
                </span>
              </div>
            </div>
          </div>
          <h2 className="mt-7 text-2xl font-semibold text-ivory">{t("rappelTitre")}</h2>
          <p className="mt-2 text-ivory/65 leading-relaxed max-w-[30rem]">{t("rappelTexte", { jours: JOURS_AVANT_RAPPEL })}</p>
          <a href={lienRappels} className={lien}>{tPlus("rappelBouton")}</a>
        </div>
      </div>
    </section>
  );
}

/* ---------- Newsletter (25 points offerts) ---------- */

const ETATS_LIEN = { confirmee: "nlConfirmee", desinscrit: "nlDesinscrit", "lien-invalide": "nlLienInvalide" };

export function Newsletter() {
  const t = useTranslations("accueilPlus");
  const session = useSession();
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState(null); // { texte, ok }
  const [dejaInscrit, setDejaInscrit] = useState(false);

  // Retour d'un lien reçu par email (?newsletter=confirmee…)
  useEffect(() => {
    const etat = new URLSearchParams(window.location.search).get("newsletter");
    if (!ETATS_LIEN[etat]) return;
    // Après le premier affichage, pour ne pas gêner l'hydratation de la page
    const minuteur = setTimeout(() => {
      setMessage({ texte: t(ETATS_LIEN[etat], { points: POINTS_NEWSLETTER }), ok: etat !== "lien-invalide" });
      document.getElementById("newsletter")?.scrollIntoView({ block: "center" });
    }, 0);
    return () => clearTimeout(minuteur);
  }, [t]);

  // Client connecté déjà inscrit : pas de formulaire
  useEffect(() => {
    if (!session) return;
    supabase.from("profils").select("accepte_marketing").eq("id", session.user.id).maybeSingle()
      .then(({ data }) => setDejaInscrit(!!data?.accepte_marketing));
  }, [session]);

  const inscrire = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setMessage(null);
    try {
      const res = await fetchSession("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ texte: data.error || t("nlErreur"), ok: false });
      } else if (data.statut === "inscrit") {
        setDejaInscrit(true);
        setMessage({ texte: data.points ? t("nlInscritPoints", { points: data.points }) : t("nlInscrit"), ok: true });
      } else {
        setEmail("");
        setMessage({ texte: t("nlConfirmation"), ok: true });
      }
    } catch {
      setMessage({ texte: t("nlErreur"), ok: false });
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <section id="newsletter" className="scroll-mt-24 border-t border-ivory/10">
      <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{t("nlTitre")}</h2>
          <p className="mt-3 text-ivory/65 leading-relaxed max-w-[34rem]">{t("nlTexte", { points: POINTS_NEWSLETTER })}</p>
        </div>

        <div>
          {dejaInscrit ? (
            !message && <p className="text-sm text-vert">{t("nlDejaInscrit")}</p>
          ) : (
            <form onSubmit={inscrire} className="flex flex-col sm:flex-row gap-3">
              {session ? (
                <p className="flex-1 self-center text-sm text-ivory/60 truncate">{t("nlCompte", { email: session.user.email })}</p>
              ) : (
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200}
                  placeholder={t("nlPlaceholder")} aria-label={t("nlPlaceholder")} autoComplete="email"
                  className="flex-1 min-w-0 bg-ivory/[0.06] border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm focus:border-gold/70 outline-none" />
              )}
              <button type="submit" disabled={envoi || session === null}
                className="bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-50 whitespace-nowrap">
                {envoi ? t("nlEnvoi") : t("nlBouton")}
              </button>
            </form>
          )}
          {message && (
            <p role="status" className={`mt-4 text-sm ${message.ok ? "text-vert" : "text-corail"}`}>{message.texte}</p>
          )}
          {!dejaInscrit && <p className="mt-3 text-xs text-ivory/40">{t("nlMentions")}</p>}
        </div>
      </div>
    </section>
  );
}
