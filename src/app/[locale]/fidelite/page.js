"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import { fetchSession } from "../../../lib/fetchSession";
import { POINTS_NEWSLETTER } from "../../../lib/newsletter";

// Mêmes seuils que le serveur (lib/cashback.js) ; les règles chiffrées du cashback viennent de /api/cashback
const PALIERS = [
  { cle: "bronze", seuil: 0, couleur: "#B08D57" },
  { cle: "argent", seuil: 100, couleur: "#C0C0C0" },
  { cle: "or", seuil: 300, couleur: "#C9A227" },
  { cle: "platine", seuil: 700, couleur: "#E5E4E2" },
];
const REGLES = { joursAttente: 14, commandeMinimum: 20, plafondPourcent: 50 };

const palierPour = (points) => [...PALIERS].reverse().find((p) => points >= p.seuil) || PALIERS[0];

export default function Fidelite() {
  const t = useTranslations("fidelitePage");
  const tFid = useTranslations("fideliteAccueil");
  const locale = useLocale();
  const nombre = (n) => new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(n);
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(n);

  const [connecte, setConnecte] = useState(null); // null = on ne sait pas encore
  const [points, setPoints] = useState(0);
  const [cashback, setCashback] = useState(null);
  const [marques, setMarques] = useState({}); // { argent: { multiplicateur, nouvelles, exemples } }

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setConnecte(!!user);
      if (!user) return;
      const { data: profil } = await supabase.from("profils").select("points").eq("id", user.id).maybeSingle();
      setPoints(profil?.points || 0);
      fetchSession("/api/cashback").then((r) => r.json()).then((d) => d.connecte && setCashback(d)).catch(() => {});
    };
    charger();

    fetch("/api/fidelite-marques")
      .then((r) => r.json())
      .then(({ paliers = [] }) => {
        const parCle = {};
        paliers.forEach((p) => {
          const cle = PALIERS.find((x) => x.seuil === p.seuil)?.cle;
          if (cle) parCle[cle] = p;
        });
        setMarques(parCle);
      })
      .catch(() => {});
  }, []);

  const regles = cashback?.regles || REGLES;
  const actuel = connecte ? palierPour(points) : null;
  const suivant = connecte ? PALIERS.find((p) => p.seuil > points) : null;
  const precedentSeuil = actuel?.seuil || 0;
  const progression = suivant ? Math.min(100, ((points - precedentSeuil) / (suivant.seuil - precedentSeuil)) * 100) : 100;

  const avantages = {
    bronze: [t("bronze1"), t("bronze2")],
    argent: [t("argent1"), t("argent2")],
    or: [t("or1", { x: nombre(marques.or?.multiplicateur || 1.25) }), t("or2")],
    platine: [t("platine1", { x: nombre(marques.platine?.multiplicateur || 1.5) }), t("platine2")],
  };

  return (
    <div className="flex-1 w-full">
      {/* En-tête : le programme, et le statut du client */}
      <section className="max-w-[1140px] mx-auto px-6 pt-32 pb-16 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold text-ivory leading-tight">{t("titre")}</h1>
          <p className="mt-6 text-ivory/70 text-lg leading-relaxed max-w-[36rem]">{t("intro")}</p>
          <p className="mt-3 text-sm text-gold/90">{t("gratuit")}</p>
        </div>

        {connecte === true && actuel && (
          <div className="rounded-2xl border border-ivory/15 bg-ivory/[0.03] p-6">
            <p className="text-sm text-ivory/55">{t("statut")}</p>
            <div className="mt-3 flex items-center gap-4">
              <span aria-hidden className="w-1 self-stretch rounded-full" style={{ background: actuel.couleur }} />
              <div>
                <p className="text-ivory text-xl font-semibold">{tFid(`${actuel.cle}Nom`)}</p>
                <p className="text-ivory/60 text-sm">{t("points", { n: points })}</p>
              </div>
            </div>
            <div className="mt-5 h-2 rounded-full bg-ivory/10 overflow-hidden" role="progressbar"
              aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progression)}>
              <div className="h-full rounded-full" style={{ width: `${progression}%`, background: suivant?.couleur || actuel.couleur }} />
            </div>
            <p className="mt-2 text-xs text-ivory/55">
              {suivant ? t("encore", { n: suivant.seuil - points, palier: tFid(`${suivant.cle}Nom`) }) : t("max")}
            </p>
            {cashback && (
              <div className="mt-5 pt-5 border-t border-ivory/10 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs text-ivory/50">{t("cashbackDispo")}</p>
                  <p className="text-2xl font-semibold text-gold">{euros(cashback.disponible)}</p>
                  {cashback.enAttente > 0 && (
                    <p className="text-xs text-ivory/45">+ {euros(cashback.enAttente)} {t("cashbackAttente")}</p>
                  )}
                </div>
                <a href={`/${locale}/profil?onglet=cashback`} className="text-sm text-gold underline underline-offset-4 decoration-gold/40 hover:decoration-gold whitespace-nowrap">
                  {t("voirCashback")}
                </a>
              </div>
            )}
          </div>
        )}

        {connecte === false && (
          <div className="rounded-2xl border border-gold/30 bg-gold/[0.06] p-6">
            <p className="text-ivory text-xl font-semibold">{t("ctaTitre")}</p>
            <p className="mt-2 text-sm text-ivory/65 leading-relaxed">{t("ctaTexte")}</p>
            <a href={`/${locale}/inscription`}
              className="mt-5 block text-center bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
              {t("ctaBouton")}
            </a>
            <a href={`/${locale}/connexion`} className="mt-3 block text-center text-sm text-ivory/60 hover:text-gold">{t("dejaCompte")}</a>
          </div>
        )}
      </section>

      {/* Gagner des points */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1140px] mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-8">{t("gagnerTitre")}</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-12">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="border-t border-ivory/10 pt-4 pb-6">
                <p className="text-ivory font-medium">
                  {n === 3 ? t("gagner3Titre").replace("25", String(POINTS_NEWSLETTER)) : t(`gagner${n}Titre`)}
                </p>
                <p className="mt-1.5 text-sm text-ivory/60 leading-relaxed">{t(`gagner${n}Texte`)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Les 4 paliers */}
      <section className="border-t border-ivory/10 bg-[radial-gradient(ellipse_at_80%_0%,rgba(201,162,39,0.12),transparent_55%)]">
        <div className="max-w-[1140px] mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{t("paliersTitre")}</h2>
          <p className="mt-2 text-ivory/60 max-w-[40rem]">{t("paliersTexte")}</p>
          <ol className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PALIERS.map((p) => {
              const estActuel = actuel?.cle === p.cle;
              const infos = marques[p.cle];
              return (
                <li key={p.cle} className="relative rounded-2xl border p-5 flex flex-col"
                  style={{ borderColor: estActuel ? p.couleur : "rgba(246,242,233,0.1)", background: estActuel ? `${p.couleur}10` : undefined }}>
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1 rounded-t-2xl" style={{ background: p.couleur }} />
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-ivory font-semibold text-xl leading-tight font-[family-name:var(--font-titre)]">
                        {tFid(`${p.cle}Nom`)}
                        {estActuel && <span className="ml-2 align-middle text-xs font-sans font-medium text-gold">{t("palierActuel")}</span>}
                      </p>
                      <p className="text-xs text-gold/85">{p.seuil === 0 ? t("desDepart") : t("aPartirDe", { n: p.seuil })}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-1.5 text-sm text-ivory/70">
                    {avantages[p.cle].map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ul>
                  {infos?.nouvelles > 0 && (
                    <div className="mt-auto pt-5">
                      <p className="text-xs text-ivory/45 mb-2">{t("enseignes", { n: infos.nouvelles })}, {t("exemples").toLowerCase()}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {infos.exemples.map((m) => (
                          <a key={m.slug} href={`/${locale}/boutique/${m.slug}`} title={m.nom}
                            className="h-8 w-14 rounded-md bg-white flex items-center justify-center px-1.5 hover:ring-2 hover:ring-gold/60 transition">
                            {m.image ? <img src={m.image} alt={m.nom} className="max-h-[70%] max-w-full object-contain" />
                              : <span className="text-ink text-[9px] font-semibold leading-tight text-center">{m.nom}</span>}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Le cashback étape par étape */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1140px] mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-10">{t("cashbackTitre")}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="relative">
                <span className="text-gold text-4xl font-semibold leading-none font-[family-name:var(--font-titre)]">{n}</span>
                <h3 className="mt-3 text-ivory font-medium">{t(`etape${n}Titre`, { j: regles.joursAttente })}</h3>
                <p className="mt-1.5 text-sm text-ivory/60 leading-relaxed">
                  {t(`etape${n}Texte`, { j: regles.joursAttente, min: regles.commandeMinimum, max: regles.plafondPourcent })}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-xl border border-gold/25 bg-gold/[0.05] p-5 max-w-[46rem]">
            <p className="text-gold text-sm font-medium">{t("exempleTitre")}</p>
            <p className="mt-1 text-sm text-ivory/75 leading-relaxed">{t("exempleTexte")}</p>
          </div>
        </div>
      </section>

      {/* Bon à savoir */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1140px] mx-auto px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-6">{t("savoirTitre")}</h2>
          <div className="max-w-[860px] divide-y divide-ivory/10 border-y border-ivory/10">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <details key={n} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-ivory font-medium [&::-webkit-details-marker]:hidden">
                  {t(`q${n}`)}
                  <span aria-hidden className="text-gold text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-ivory/65 leading-relaxed max-w-[44rem]">{t(`r${n}`)}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-ivory/55">
            {t("conditions")}{" "}
            <a href={`/${locale}/cgv#fidelite`} className="text-gold underline underline-offset-2 decoration-gold/40 hover:decoration-gold">{t("cgv")}</a>.
          </p>
          <a href={`/${locale}/boutique`}
            className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
            {t("boutique")}
          </a>
        </div>
      </section>
    </div>
  );
}
