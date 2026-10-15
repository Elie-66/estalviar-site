"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { DecorEvenement } from "../components/BandeauEvenement";
import { themeDe } from "../components/themesEvenements";
import CarteVitrine from "../components/CarteVitrine";
import Tricolore from "../components/Tricolore";
import { couleurCategorie } from "../../../lib/couleursCartes";
import { pourOccasion, trouverOccasion } from "../../../lib/occasions";

export default function Boutique() {
  const t = useTranslations("boutiqueVitrine");
  const tEvenement = useTranslations("evenement");
  const tOcc = useTranslations("occasions");
  const locale = useLocale();
  const tCategories = useTranslations("categories");
  const searchParams = useSearchParams();
  const [cartes, setCartes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "Toutes");
  // Venue d'une tuile « Une idée pour… » de l'accueil (?occasion=naissance)
  const [occasion, setOccasion] = useState(() => trouverOccasion(searchParams.get("occasion")));
  // Venue d'un bloc « Idées par budget » de l'accueil (?budget=50) : enseignes qui acceptent ce montant
  const [budget, setBudget] = useState(() => {
    const b = Number(searchParams.get("budget"));
    return Number.isInteger(b) && b > 0 && b <= 5000 ? b : null;
  });
  // Venue d'un rappel d'anniversaire ou d'un bénéficiaire (?pour=Camille) : prénom prérempli sur la fiche
  const pour = (searchParams.get("pour") || "").slice(0, 30);
  const retirerParametre = (nom) => {
    const url = new URL(window.location.href);
    url.searchParams.delete(nom);
    window.history.replaceState(null, "", url);
  };
  const retirerBudget = () => {
    setBudget(null);
    retirerParametre("budget");
  };
  const retirerOccasion = () => {
    setOccasion(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("occasion");
    window.history.replaceState(null, "", url);
  };
  // Onglets : « toutes », « francaises » (Fabriqué en France), « evenement » (Fête des mères, Noël…)
  // Liens directs : /fr/boutique?onglet=francaises  ou  /fr/boutique?evenement=fete-des-meres
  const slugEvenement = searchParams.get("evenement");
  const [onglet, setOnglet] = useState(
    slugEvenement ? "evenement" : searchParams.get("onglet") === "francaises" ? "francaises" : "toutes"
  );
  const [evenement, setEvenement] = useState(null);
  const [cartesEvenement, setCartesEvenement] = useState([]);

  const changerOnglet = (nouvelOnglet) => {
    setOnglet(nouvelOnglet);
    setCategorie("Toutes");
    const url = new URL(window.location.href);
    url.searchParams.delete("onglet");
    url.searchParams.delete("evenement");
    url.searchParams.delete("categorie");
    if (nouvelOnglet === "francaises") url.searchParams.set("onglet", "francaises");
    if (nouvelOnglet === "evenement" && evenement) url.searchParams.set("evenement", evenement.slug);
    window.history.replaceState(null, "", url);
  };

  // Événement du moment (ou celui du lien) et sa sélection de marques
  useEffect(() => {
    const url = slugEvenement ? `/api/evenement?slug=${encodeURIComponent(slugEvenement)}` : "/api/evenement";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.evenement && data.cartes?.length) {
          setEvenement(data.evenement);
          setCartesEvenement(data.cartes);
        } else {
          setOnglet((o) => (o === "evenement" ? "toutes" : o));
        }
      })
      .catch(() => setOnglet((o) => (o === "evenement" ? "toutes" : o)));
  }, [slugEvenement]);

  // Catégorie sans traduction (ex. nouvelle catégorie du catalogue) : on affiche son nom tel quel
  const traduireCategorie = (cat) => (cat && tCategories.has(cat) ? tCategories(cat) : cat);

  useEffect(() => {
    const charger = async () => {
      // Ordre calculé par le serveur (marge, notoriété, ventes, quotas, rotation du jour)
      try {
        const res = await fetch("/api/catalogue-classe");
        if (res.ok) {
          const json = await res.json();
          setCartes(json.cartes || []);
          setChargement(false);
          return;
        }
      } catch {
        // on passe au plan B ci-dessous
      }

      // Plan B si le classement est indisponible : ordre manuel du back-office
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      setCartes(data || []);
      setChargement(false);
    };
    charger();
  }, []);

  const cartesOnglet = (
    onglet === "francaises" ? cartes.filter((c) => c.made_in_france)
    : onglet === "evenement" && evenement ? cartesEvenement
    : cartes
  )
    .filter((c) => pourOccasion(occasion, c))
    .filter((c) => !budget || (c.montant_min <= budget && budget <= c.montant_max));

  // Lien vers la fiche : on garde le prénom et le budget choisis
  const lienFiche = (slug) => {
    const params = new URLSearchParams();
    if (pour) params.set("pour", pour);
    if (budget) params.set("montant", String(budget));
    const suite = params.toString();
    return `/${locale}/boutique/${slug}${suite ? `?${suite}` : ""}`;
  };

  const categories = ["Toutes", ...Array.from(new Set(cartesOnglet.map((c) => c.categorie)))];

  const cartesFiltrees = cartesOnglet.filter((c) => {
    const correspondRecherche = c.nom.toLowerCase().includes(recherche.toLowerCase());
    const correspondCategorie = categorie === "Toutes" || c.categorie === categorie;
    return correspondRecherche && correspondCategorie;
  });
  const nbFrancaises = cartes.filter((c) => c.made_in_france).length;

  // Sur téléphone, le rayon choisi doit être visible dans la ligne qui défile
  useEffect(() => {
    if (chargement) return;
    const actif = document.querySelector('[role="tab"][aria-selected="true"]');
    actif?.parentElement?.parentElement?.scrollTo({ left: Math.max(0, actif.offsetLeft - 24), behavior: "smooth" });
  }, [onglet, chargement, evenement]);

  if (chargement) {
    return (
      <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        {t("chargement")}
      </div>
    );
  }

  // Les rayons de la boutique : toutes les enseignes, l'événement du moment, Fabriqué en France
  const rayons = [
    { cle: "toutes", titre: t("ongletToutes"), nombre: cartes.length, accent: "#C9A227" },
    ...(evenement ? [{ cle: "evenement", titre: evenement.nom, nombre: cartesEvenement.length, accent: themeDe(evenement.slug).accent }] : []),
    ...(nbFrancaises > 0 ? [{ cle: "francaises", titre: t("ongletFrancaises"), nombre: nbFrancaises, tricolore: true }] : []),
  ];
  const nombreParCategorie = (cat) => (cat === "Toutes" ? cartesOnglet.length : cartesOnglet.filter((c) => c.categorie === cat).length);

  return (
    <div className="max-w-[1240px] w-full mx-auto px-6 pt-32 pb-20">
      <h1 className="sr-only">{rayons.find((r) => r.cle === onglet)?.titre || t("titre")}</h1>
      {/* Rayons : de grands titres, celui qu'on regarde est en clair */}
      <div className="-mx-6 px-6 overflow-x-auto [scrollbar-width:none]">
        <div role="tablist" aria-label={t("titre")} className="flex items-end gap-x-8 sm:gap-x-12 w-max">
          {rayons.map((r) => {
            const actif = onglet === r.cle;
            return (
              <button key={r.cle} type="button" role="tab" aria-selected={actif} onClick={() => changerOnglet(r.cle)}
                className={`group relative pb-3 text-left transition-colors ${actif ? "text-ivory" : "text-ivory/30 hover:text-ivory/60"}`}>
                <span className="block text-[1.7rem] sm:text-4xl font-semibold leading-none tracking-tight font-[family-name:var(--font-fraunces)] whitespace-nowrap">
                  {r.titre}
                  <sup className="ml-1.5 text-xs sm:text-sm font-normal font-sans tabular-nums align-super opacity-60">{r.nombre}</sup>
                </span>
                {actif && (
                  r.tricolore
                    ? <span aria-hidden className="absolute left-0 right-0 bottom-0 h-[3px] flex"><span className="flex-1 bg-[#2f5bd3]" /><span className="flex-1 bg-ivory" /><span className="flex-1 bg-[#e1293b]" /></span>
                    : <span aria-hidden className="absolute left-0 right-0 bottom-0 h-[3px]" style={{ background: r.accent }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ce que contient le rayon */}
      {onglet === "evenement" && evenement ? (
        <div
          className="relative overflow-hidden rounded-xl border px-6 py-5 mt-6"
          style={{ background: themeDe(evenement.slug).fond, borderColor: themeDe(evenement.slug).bordure }}
        >
          <DecorEvenement slug={evenement.slug} />
          <div className="relative max-w-[640px]">
            <p className="text-sm font-medium" style={{ color: themeDe(evenement.slug).accent }}>
              <span className="inline-block first-letter:uppercase">{new Date(`${evenement.date}T12:00:00Z`).toLocaleDateString(locale, {
                weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
              })}</span>
              {", "}
              {evenement.joursRestants === 0 ? tEvenement("aujourdhui")
                : evenement.joursRestants === 1 ? tEvenement("demain")
                : tEvenement("dansJours", { jours: evenement.joursRestants })}
            </p>
            {evenement.description && <p className="text-ivory/75 text-sm mt-1.5">{evenement.description}</p>}
          </div>
        </div>
      ) : onglet === "francaises" ? (
        <p className="mt-6 text-ivory/60 text-[15px] leading-relaxed max-w-[640px]">{t("introFrancaises")}</p>
      ) : null}

      {/* Filtres actifs venus d'un lien (prénom, budget, occasion) */}
      {(budget || pour || occasion) && (
        <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          {pour && (
            <span className="inline-flex items-center rounded-md border border-gold/40 text-gold px-3 py-1.5">
              {t("pourQui", { prenom: pour })}
            </span>
          )}
          {budget && (
            <span className="inline-flex items-center gap-2 rounded-md border border-ivory/25 text-ivory pl-3 pr-1 py-1">
              {t("filtreBudget", { montant: budget })}
              <button type="button" onClick={retirerBudget} aria-label={tOcc("retirer")}
                className="w-6 h-6 rounded flex items-center justify-center text-ivory/60 hover:text-ivory hover:bg-ivory/10">×</button>
            </span>
          )}
          {occasion && (
            <span className="inline-flex items-center gap-2 rounded-md border border-ivory/25 text-ivory pl-3 pr-1 py-1">
              {tOcc("filtre", { occasion: tOcc(occasion.slug).toLowerCase() })}
              <button type="button" onClick={retirerOccasion} aria-label={tOcc("retirer")}
                className="w-6 h-6 rounded flex items-center justify-center text-ivory/60 hover:text-ivory hover:bg-ivory/10">×</button>
            </span>
          )}
        </div>
      )}

      {/* Catégories (onglets soulignés de la couleur de la catégorie) et recherche */}
      <div className="mt-8 mb-9 flex flex-col-reverse lg:flex-row lg:items-end gap-5 lg:gap-10 border-b border-ivory/10">
        <div className="-mx-6 px-6 lg:mx-0 lg:px-0 overflow-x-auto [scrollbar-width:none] flex-1 min-w-0 lg:[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent)]">
          <div role="group" aria-label={t("toutes")} className="flex gap-6 w-max">
            {categories.map((cat) => {
              const active = categorie === cat;
              const couleur = cat === "Toutes" ? "#C9A227" : couleurCategorie(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategorie(cat)}
                  aria-pressed={active}
                  className={`relative pb-3 text-[15px] whitespace-nowrap transition-colors ${
                    active ? "text-ivory font-medium" : "text-ivory/50 hover:text-ivory/85"
                  }`}
                >
                  {cat === "Toutes" ? t("toutes") : traduireCategorie(cat)}
                  <span className="ml-1.5 text-xs tabular-nums text-ivory/35">{nombreParCategorie(cat)}</span>
                  <span aria-hidden className={`absolute left-0 right-0 -bottom-px h-[2px] transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                    style={{ background: couleur }} />
                </button>
              );
            })}
          </div>
        </div>

        <label className="relative block w-full lg:w-72 shrink-0">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-0 top-1/2 -translate-y-1/2 lg:top-auto lg:translate-y-0 lg:bottom-[15px] text-ivory/40" aria-hidden
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("recherchePlaceholder")}
            aria-label={t("recherchePlaceholder")}
            className="w-full bg-transparent border-0 border-b border-ivory/20 lg:border-transparent pl-7 pr-2 py-2 lg:pt-0 lg:pb-3 text-[15px] lg:text-sm leading-normal text-ivory text-sm placeholder:text-ivory/40 focus:border-gold/70 outline-none"
          />
        </label>
      </div>

      {cartesFiltrees.length === 0 ? (
        <p className="text-ivory/50 text-sm">{onglet === "francaises" ? t("aucuneFrancaise") : t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-7 sm:gap-x-5 sm:gap-y-9">
          {cartesFiltrees.map((carte) => (
            <CarteVitrine
              key={carte.slug}
              carte={carte}
              href={lienFiche(carte.slug)}
              prixLabel={budget ? t("montantChoisi", { montant: budget }) : `${t("apartirDe")} ${carte.montant_min} €`}
              badge={
                carte.made_in_france && onglet !== "francaises" ? (
                  <span title={t("badgeFabrique")} className="inline-flex items-center gap-1.5 text-[10px] font-medium text-ink/70 bg-white/90 rounded px-1.5 py-1 whitespace-nowrap">
                    <Tricolore className="w-3 h-2" /> <span className="hidden sm:inline">{t("badgeFabrique")}</span>
                  </span>
                ) : null
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}