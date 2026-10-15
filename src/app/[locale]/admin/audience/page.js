"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { peutVoir } from "../../../../lib/accesAdmin";
import { fetchAdmin } from "../../../../lib/fetchAdmin";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const PERIODES = [
  { jours: 1, nom: "Aujourd'hui" },
  { jours: 7, nom: "7 jours" },
  { jours: 30, nom: "30 jours" },
  { jours: 90, nom: "3 mois" },
  { jours: 365, nom: "12 mois" },
];
const MESURES = [
  { cle: "visiteurs", nom: "Visiteurs" },
  { cle: "visites", nom: "Visites" },
  { cle: "pages", nom: "Pages vues" },
];

const nombre = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(Number(n) || 0));
const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);
const nomPays = (code) => {
  if (!code || code === "??") return "Inconnu";
  try {
    return new Intl.DisplayNames(["fr"], { type: "region" }).of(code);
  } catch {
    return code;
  }
};
const NOMS_LANGUES = { fr: "Français", en: "Anglais", de: "Allemand", es: "Espagnol", it: "Italien" };
const NOMS_PAGES = {
  "/": "Accueil", "/boutique": "Boutique", "/cagnotte": "Cagnottes", "/cagnotte/creer": "Créer une cagnotte",
  "/fidelite": "Fidélité", "/professionnels": "Professionnels", "/aide": "Centre d'aide", "/panier": "Panier",
  "/paiement": "Paiement", "/confirmation": "Confirmation de commande", "/profil": "Mon compte", "/connexion": "Connexion",
  "/inscription": "Inscription", "/qui-sommes-nous": "Qui sommes-nous", "/blog": "Blog", "/contact": "Contact",
  "/carte/…": "Ma carte (lien reçu par email)",
};

// « /boutique/nike » → « Fiche Nike »
const nomPage = (chemin) => {
  if (NOMS_PAGES[chemin]) return NOMS_PAGES[chemin];
  const fiche = chemin.match(/^\/boutique\/([^/]+)$/);
  if (fiche) return `Fiche ${fiche[1].replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase())}`;
  const article = chemin.match(/^\/blog\/([^/]+)$/);
  if (article) return `Blog : ${article[1].replace(/-/g, " ")}`;
  return chemin;
};

/** Écart avec la période précédente, en % */
function Evolution({ actuel, avant }) {
  if (!avant) return <span className="text-xs text-ivory/40">pas de comparaison</span>;
  const ecart = Math.round(((actuel - avant) / avant) * 100);
  if (ecart === 0) return <span className="text-xs text-ivory/45">stable</span>;
  return (
    <span className={`text-xs ${ecart > 0 ? "text-vert" : "text-corail"}`}>
      {ecart > 0 ? "▲" : "▼"} {Math.abs(ecart)} % <span className="text-ivory/40 max-md:hidden">vs période précédente</span>
    </span>
  );
}

/** Liste classée avec une barre fine proportionnelle à la valeur */
function Classement({ titre, lignes, valeur = "visites", nom = (l) => l.nom, unite, vide = "Rien pour l'instant", aide }) {
  const max = Math.max(1, ...lignes.map((l) => Number(l[valeur]) || 0));
  const total = lignes.reduce((s, l) => s + (Number(l[valeur]) || 0), 0);
  return (
    <section className="border border-ivory/10 rounded-xl p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-base font-semibold text-ivory">{titre}</h2>
        <span className="text-xs text-ivory/45">{unite}</span>
      </div>
      {aide && <p className="-mt-2 mb-4 text-xs text-ivory/45">{aide}</p>}
      {lignes.length === 0 ? (
        <p className="text-sm text-ivory/45 py-4">{vide}</p>
      ) : (
        <ul className="space-y-3">
          {lignes.map((l) => {
            const v = Number(l[valeur]) || 0;
            return (
              <li key={l.nom} title={`${nom(l)} : ${nombre(v)} (${total ? Math.round((v / total) * 100) : 0} %)`}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-ivory/85 truncate">{nom(l)}</span>
                  <span className="text-ivory tabular-nums shrink-0">
                    {nombre(v)} <span className="text-ivory/40 text-xs">{total ? Math.round((v / total) * 100) : 0} %</span>
                  </span>
                </div>
                <div className="mt-1.5 h-[3px] rounded-full bg-ivory/[0.06]">
                  <div className="h-full rounded-full bg-gold/80" style={{ width: `${(v / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function BulleGraphique({ active, payload, label, mesure }) {
  if (!active || !payload?.length) return null;
  const d = new Date(`${label}T12:00:00Z`);
  return (
    <div className="bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-sm shadow-lg">
      <p className="text-ivory/60 text-xs">{d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}</p>
      <p className="text-ivory mt-0.5"><span className="font-semibold">{nombre(payload[0].value)}</span> {mesure.nom.toLowerCase()}</p>
    </div>
  );
}

export default function AdminAudience() {
  const [pret, setPret] = useState(false);
  const [jours, setJours] = useState(30);
  const [mesure, setMesure] = useState(MESURES[0]);
  const [donnees, setDonnees] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user || !(await peutVoir("audience"))) window.location.href = user ? "/fr/admin" : "/fr";
      else setPret(true);
    });
  }, []);

  useEffect(() => {
    if (!pret) return;
    fetchAdmin(`/api/admin-audience?jours=${jours}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || "Erreur de chargement");
        setDonnees(json);
        setErreur("");
      })
      .catch((e) => setErreur(e.message))
      .finally(() => setChargement(false));
  }, [pret, jours]);

  if (!pret) {
    return <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">Chargement...</div>;
  }

  const s = donnees?.stats || {};
  const avant = donnees?.avant || {};
  const conversion = s.visites ? (s.commandes / s.visites) * 100 : 0;
  const conversionAvant = avant.visites ? (avant.commandes / avant.visites) * 100 : 0;
  const jourCourt = (j) => new Date(`${j}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });

  const chiffres = [
    { nom: "Visiteurs", valeur: nombre(s.visiteurs), actuel: s.visiteurs, avant: avant.visiteurs, aide: "Personnes différentes, comptées une fois par jour" },
    { nom: "Visites", valeur: nombre(s.visites), actuel: s.visites, avant: avant.visites, aide: "Arrivées sur le site" },
    { nom: "Pages vues", valeur: nombre(s.pages), actuel: s.pages, avant: avant.pages, aide: s.visites ? `${(s.pages / s.visites).toFixed(1).replace(".", ",")} pages par visite` : "" },
    { nom: "Commandes", valeur: nombre(s.commandes), actuel: s.commandes, avant: avant.commandes, aide: `${euros(s.chiffre)} de ventes` },
    { nom: "Taux de conversion", valeur: `${conversion.toFixed(1).replace(".", ",")} %`, actuel: conversion, avant: conversionAvant, aide: "Commandes pour 100 visites" },
  ];

  return (
    <div className="max-w-[1180px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-ivory">Audience</h1>
          <p className="mt-1 text-sm text-ivory/55">Qui vient sur le site, d&apos;où, et ce qu&apos;ils regardent. Mesure anonyme, sans cookie.</p>
        </div>
        <div className="max-w-full overflow-x-auto [scrollbar-width:none]"><div className="flex gap-5 w-max border-b border-ivory/10" role="tablist" aria-label="Période">
          {PERIODES.map((p) => (
            <button key={p.jours} type="button" role="tab" aria-selected={jours === p.jours} onClick={() => { if (p.jours !== jours) { setChargement(true); setJours(p.jours); } }}
              className={`pb-2.5 -mb-px text-sm whitespace-nowrap border-b-2 transition-colors ${jours === p.jours ? "border-gold text-ivory" : "border-transparent text-ivory/50 hover:text-ivory/80"}`}>
              {p.nom}
            </button>
          ))}
        </div></div>
      </div>

      {erreur && <p className="mt-6 text-sm text-corail">{erreur}</p>}

      <div className={`transition-opacity ${chargement ? "opacity-50" : ""}`}>
        {/* Chiffres clés */}
        <dl className="mt-8 grid grid-cols-2 md:grid-cols-5 gap-x-6 md:gap-x-0 border-y border-ivory/10 md:divide-x md:divide-ivory/10">
          {chiffres.map((c) => (
            <div key={c.nom} className="py-5 md:px-4 md:first:pl-0 max-md:border-b max-md:border-ivory/10 max-md:last:border-b-0">
              <dt className="text-sm text-ivory/60">{c.nom}</dt>
              <dd className="mt-1.5 text-2xl md:text-[28px] font-semibold text-ivory font-[family-name:var(--font-fraunces)] tabular-nums">{c.valeur}</dd>
              <dd className="mt-1"><Evolution actuel={c.actuel || 0} avant={c.avant || 0} /></dd>
              <dd className="mt-1 text-xs text-ivory/40">{c.aide}</dd>
            </div>
          ))}
        </dl>

        {/* Évolution jour par jour */}
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-ivory">{mesure.nom} par jour</h2>
            <div className="flex gap-1 text-sm" role="group" aria-label="Mesure affichée">
              {MESURES.map((m) => (
                <button key={m.cle} type="button" aria-pressed={mesure.cle === m.cle} onClick={() => setMesure(m)}
                  className={`px-3 py-1.5 rounded-md transition-colors ${mesure.cle === m.cle ? "bg-ivory/10 text-ivory" : "text-ivory/50 hover:text-ivory/80"}`}>
                  {m.nom}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 h-[260px]">
            {jours === 1 ? (
              <p className="text-sm text-ivory/45 pt-10">Le graphique jour par jour s&apos;affiche à partir de 7 jours.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={s.jours || []} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fondCourbe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A227" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(246,242,233,0.08)" />
                  <XAxis dataKey="jour" tickFormatter={jourCourt} tick={{ fill: "rgba(246,242,233,0.5)", fontSize: 12 }}
                    axisLine={false} tickLine={false} minTickGap={28} />
                  <YAxis allowDecimals={false} tick={{ fill: "rgba(246,242,233,0.5)", fontSize: 12 }} axisLine={false} tickLine={false} width={44} />
                  <Tooltip content={<BulleGraphique mesure={mesure} />} cursor={{ stroke: "rgba(246,242,233,0.3)" }} />
                  <Area type="monotone" dataKey={mesure.cle} stroke="#C9A227" strokeWidth={2} fill="url(#fondCourbe)"
                    activeDot={{ r: 5, fill: "#C9A227", stroke: "#12172B", strokeWidth: 2 }} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* D'où ils viennent */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Classement titre="D'où ils viennent" lignes={s.sources || []} unite="visites"
            aide="« Accès direct » : adresse tapée, favori, lien dans un email ou une appli de messagerie." />
          <Classement titre="Pages les plus vues" lignes={s.pages_vues || []} valeur="vues" unite="vues"
            nom={(l) => nomPage(l.nom)} />
          <Classement titre="Pages d'arrivée" lignes={s.entrees || []} unite="visites"
            nom={(l) => nomPage(l.nom)} aide="La première page vue lors de la visite." />
          <Classement titre="Campagnes" lignes={s.campagnes || []} unite="visites"
            nom={(l) => `${l.nom}${l.source ? ` (${l.source})` : ""}`}
            vide="Aucune campagne. Ajoutez ?utm_source=instagram&utm_campaign=noel à vos liens pour les suivre ici." />
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Classement titre="Pays" lignes={s.pays || []} unite="visites" nom={(l) => nomPays(l.nom)} />
          <div className="grid gap-6">
            <Classement titre="Appareils" lignes={s.appareils || []} unite="visites"
              nom={(l) => l.nom.charAt(0).toUpperCase() + l.nom.slice(1)} />
            <Classement titre="Langue du site" lignes={s.langues || []} unite="visites" nom={(l) => NOMS_LANGUES[l.nom] || l.nom} />
          </div>
          <Classement titre="Navigateurs" lignes={s.navigateurs || []} unite="visites" />
        </div>
      </div>
    </div>
  );
}
