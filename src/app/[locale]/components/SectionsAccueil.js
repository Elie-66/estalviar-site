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

/* ---------- Bande de réassurance, juste sous le hero ---------- */

const ICONES = {
  cadenas: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  envoi: <><path d="M3 7l9 6 9-6" /><rect x="3" y="5" width="18" height="14" rx="2" /></>,
  etoile: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  bulle: <path d="M4 5h16v11H9l-5 4z" />,
};

export function Reassurance() {
  const t = useTranslations("accueilPlus");
  const points = [
    ["cadenas", 1], ["envoi", 2], ["etoile", 3], ["bulle", 4],
  ];
  return (
    <section className="border-y border-ivory/10 bg-ivory/[0.025]">
      <ul className="max-w-[1240px] mx-auto px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-5">
        {points.map(([icone, n]) => (
          <li key={n} className="flex items-center gap-3">
            <span className="shrink-0 w-10 h-10 rounded-full border border-gold/35 text-gold flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" aria-hidden>
                {ICONES[icone]}
              </svg>
            </span>
            <span className="min-w-0">
              <span className="block text-ivory text-sm font-medium leading-snug">{t(`reassurance${n}Titre`)}</span>
              <span className="hidden sm:block text-ivory/50 text-xs leading-snug">{t(`reassurance${n}Texte`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ---------- Idées par budget ---------- */

const BUDGETS = [
  { montant: 20, cle: "budget20", couleur: "#2E7D6B" },
  { montant: 50, cle: "budget50", couleur: "#C9A227" },
  { montant: 100, cle: "budget100", couleur: "#E5604D" },
];

export function IdeesBudget({ cartes }) {
  const t = useTranslations("accueilPlus");
  const tVit = useTranslations("accueilVitrine");
  const locale = useLocale();
  if (!cartes.length) return null;

  return (
    <section className="max-w-[1240px] w-full mx-auto px-6 pt-20">
      <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{t("budgetTitre")}</h2>
      <p className="mt-2 text-ivory/60 mb-8">{t("budgetTexte")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {BUDGETS.map((b) => {
          const nombre = cartes.filter((c) => c.montant_min <= b.montant && b.montant <= c.montant_max).length;
          if (nombre === 0) return null;
          return (
            <a key={b.montant} href={`/${locale}/boutique?budget=${b.montant}`}
              className="group relative overflow-hidden rounded-2xl border border-ivory/10 bg-ivory/[0.03] p-6 flex items-end justify-between gap-4 transition-colors hover:border-ivory/25 focus-visible:outline-2 focus-visible:outline-gold">
              <span aria-hidden className="absolute left-0 inset-y-0 w-1" style={{ background: b.couleur }} />
              <span>
                <span className="block text-ivory text-[2.6rem] leading-none font-semibold font-[family-name:var(--font-fraunces)]">
                  {b.montant}<span className="text-2xl ml-1" style={{ color: b.couleur }}>€</span>
                </span>
                <span className="block mt-3 text-ivory font-medium">{t(b.cle)}</span>
                <span className="block text-xs text-ivory/50 mt-0.5">{tVit("nbEnseignes", { n: nombre })}</span>
              </span>
              <span className="text-sm text-ivory/60 group-hover:text-gold whitespace-nowrap transition-colors">
                {t("budgetVoir")}
                <span aria-hidden className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">›</span>
              </span>
            </a>
          );
        })}
      </div>
    </section>
  );
}

/* ---------- Rappels d'anniversaire ---------- */

export function RappelAnniversaire() {
  const t = useTranslations("accueilPlus");
  const locale = useLocale();
  const session = useSession();
  const lien = session ? `/${locale}/profil?onglet=beneficiaires` : `/${locale}/inscription`;

  return (
    <section className="border-t border-ivory/10">
      <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-semibold text-ivory leading-tight">{t("rappelTitre")}</h2>
          <p className="mt-6 text-ivory/60 leading-relaxed max-w-md mx-auto md:mx-0">
            {t("rappelTexte", { jours: JOURS_AVANT_RAPPEL })}
          </p>
          <a href={lien}
            className="inline-block mt-8 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
            {t("rappelBouton")}
          </a>
        </div>

        {/* Aperçu de l'email de rappel */}
        <div aria-hidden className="relative max-w-[440px] w-full mx-auto">
          <div className="absolute -inset-6 rounded-[2rem] opacity-40 blur-3xl"
            style={{ background: "radial-gradient(circle at 60% 40%, #E5604D 0%, transparent 65%)" }} />
          <div className="relative rotate-2 rounded-2xl bg-ivory text-ink shadow-[0_30px_60px_-25px_rgba(0,0,0,0.9)] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-ink/10">
              <span className="w-8 h-8 rounded-full bg-ink text-ivory text-sm flex items-center justify-center font-semibold font-[family-name:var(--font-fraunces)]">
                E<span className="text-gold">.</span>
              </span>
              <span className="text-sm font-medium">{t("rappelExempleDe")}</span>
              <span className="ml-auto text-xs text-ink/45">08:30</span>
            </div>
            <div className="px-5 py-6">
              <p className="text-3xl leading-none">🎂</p>
              <p className="mt-3 text-lg font-semibold leading-snug font-[family-name:var(--font-fraunces)]">
                {t("rappelExempleTitre", { jours: JOURS_AVANT_RAPPEL })}
              </p>
              <p className="mt-2 text-sm text-ink/65 leading-relaxed">{t("rappelExempleTexte")}</p>
              <span className="mt-5 inline-block bg-gold text-ink text-sm font-semibold rounded-lg px-4 py-2.5">
                {t("rappelExempleBouton")}
              </span>
            </div>
          </div>
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
    <section id="newsletter" className="scroll-mt-24 max-w-[1240px] w-full mx-auto px-6 pb-20">
      <div className="relative overflow-hidden rounded-2xl px-6 py-10 sm:px-12 grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 lg:gap-14 items-center"
        style={{ background: "radial-gradient(circle at 92% 8%, rgba(201,162,39,0.22), transparent 42%), linear-gradient(135deg, #1d2440 0%, #12172B 60%)" }}>

        {/* Le jeton de 25 points */}
        <div className="relative mx-auto lg:mx-0 w-32 h-32 sm:w-36 sm:h-36 rounded-full flex flex-col items-center justify-center text-ink shadow-[0_18px_40px_-18px_rgba(201,162,39,0.9)]"
          style={{ background: "radial-gradient(circle at 32% 28%, #fff6d6 0%, #E3C25A 38%, #C9A227 70%, #9c7c17 100%)" }}>
          <span className="absolute inset-2 rounded-full border border-ink/15" aria-hidden />
          <span className="text-5xl font-semibold leading-none font-[family-name:var(--font-fraunces)]">{POINTS_NEWSLETTER}</span>
          <span className="text-[11px] font-semibold tracking-wide mt-1">points</span>
        </div>

        <div className="relative text-center lg:text-left">
          <p className="text-gold text-sm font-medium">{t("nlPoints", { points: POINTS_NEWSLETTER })}</p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-ivory">{t("nlTitre")}</h2>
          <p className="mt-3 text-ivory/65 leading-relaxed max-w-[38rem] mx-auto lg:mx-0">{t("nlTexte", { points: POINTS_NEWSLETTER })}</p>

          {dejaInscrit ? (
            !message && <p className="mt-6 text-sm text-vert">{t("nlDejaInscrit")}</p>
          ) : (
            <form onSubmit={inscrire} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-[520px] mx-auto lg:mx-0">
              {session ? (
                <p className="flex-1 self-center text-sm text-ivory/60 truncate">{t("nlCompte", { email: session.user.email })}</p>
              ) : (
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200}
                  placeholder={t("nlPlaceholder")} aria-label={t("nlPlaceholder")} autoComplete="email"
                  className="flex-1 min-w-0 bg-ivory/[0.07] border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm focus:border-gold/70 outline-none" />
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
