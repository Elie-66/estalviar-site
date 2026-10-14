"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { DecorEvenement } from "../components/BandeauEvenement";
import { themeDe } from "../components/themesEvenements";
import CarteVitrine from "../components/CarteVitrine";
import { couleurCategorie } from "../../../lib/couleursCartes";

export default function Boutique() {
  const t = useTranslations("boutiqueVitrine");
  const tEvenement = useTranslations("evenement");
  const locale = useLocale();
  const tCategories = useTranslations("categories");
  const searchParams = useSearchParams();
  const [cartes, setCartes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "Toutes");
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

  const cartesOnglet =
    onglet === "francaises" ? cartes.filter((c) => c.made_in_france)
    : onglet === "evenement" && evenement ? cartesEvenement
    : cartes;

  const categories = ["Toutes", ...Array.from(new Set(cartesOnglet.map((c) => c.categorie)))];

  const cartesFiltrees = cartesOnglet.filter((c) => {
    const correspondRecherche = c.nom.toLowerCase().includes(recherche.toLowerCase());
    const correspondCategorie = categorie === "Toutes" || c.categorie === categorie;
    return correspondRecherche && correspondCategorie;
  });
  const nbFrancaises = cartes.filter((c) => c.made_in_france).length;

  if (chargement) {
    return (
      <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        {t("chargement")}
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] w-full mx-auto px-6 pt-32 pb-20">
      {(evenement || nbFrancaises > 0) && (
      <div className="flex flex-wrap gap-1 sm:gap-2 border border-ivory/10 rounded-lg p-1 w-fit max-w-full mb-8">
        <button
          onClick={() => changerOnglet("toutes")}
          className={`text-sm px-4 py-2 rounded-md transition-colors ${
            onglet === "toutes" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          {t("ongletToutes")}
        </button>
        {evenement && (
          <button
            onClick={() => changerOnglet("evenement")}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${
              onglet === "evenement" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
            }`}
          >
            🎁 {evenement.nom}
          </button>
        )}
        {nbFrancaises > 0 && (
          <button
            onClick={() => changerOnglet("francaises")}
            className={`text-sm px-4 py-2 rounded-md transition-colors ${
              onglet === "francaises" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
            }`}
          >
            🇫🇷 {t("ongletFrancaises")}
          </button>
        )}
      </div>
      )}

      {onglet === "evenement" && evenement ? (
        <div
          className="relative overflow-hidden rounded-2xl border px-6 py-8 mb-8"
          style={{ background: themeDe(evenement.slug).fond, borderColor: themeDe(evenement.slug).bordure }}
        >
          <DecorEvenement slug={evenement.slug} />
          <div className="relative max-w-[640px]">
          <h1 className="text-3xl font-semibold text-ivory mb-3">{evenement.nom}</h1>
          <p className="text-sm" style={{ color: themeDe(evenement.slug).accent }}>
            {new Date(`${evenement.date}T12:00:00Z`).toLocaleDateString(locale, {
              weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
            })}
            {" · "}
            {evenement.joursRestants === 0 ? tEvenement("aujourdhui")
              : evenement.joursRestants === 1 ? tEvenement("demain")
              : tEvenement("dansJours", { jours: evenement.joursRestants })}
          </p>
          {evenement.description && <p className="text-ivory/75 text-sm mt-2">{evenement.description}</p>}
          </div>
        </div>
      ) : (
        <>
          <h1 className="text-3xl font-semibold text-ivory mb-3">
            {onglet === "francaises" ? t("titreFrancaises") : t("titre")}
          </h1>
          {onglet === "francaises" ? (
            <p className="text-ivory/60 text-sm max-w-[640px] mb-8">{t("introFrancaises")}</p>
          ) : (
            <div className="mb-5" />
          )}
        </>
      )}

      <div className="relative max-w-[520px] mb-5">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40" aria-hidden
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
          className="w-full bg-ivory/[0.05] border border-ivory/15 rounded-full pl-11 pr-4 py-3 text-ivory text-sm focus:border-gold/60 outline-none"
        />
      </div>

      {/* Catégories : pastilles de couleur (défilent à l'horizontale sur téléphone) */}
      <div className="-mx-6 px-6 overflow-x-auto mb-9 [scrollbar-width:none]">
        <div role="group" aria-label={t("toutes")} className="flex gap-2 w-max pb-1">
          {categories.map((cat) => {
            const active = categorie === cat;
            const couleur = cat === "Toutes" ? "#C9A227" : couleurCategorie(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategorie(cat)}
                aria-pressed={active}
                className={`flex items-center gap-2 text-sm rounded-full pl-2.5 pr-4 py-2 border whitespace-nowrap transition-colors ${
                  active ? "text-ink font-medium border-transparent" : "text-ivory/80 border-ivory/15 hover:border-ivory/35"
                }`}
                style={active ? { background: couleur, color: "#fff" } : undefined}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: active ? "#fff" : couleur }} />
                {cat === "Toutes" ? t("toutes") : traduireCategorie(cat)}
              </button>
            );
          })}
        </div>
      </div>

      {cartesFiltrees.length === 0 ? (
        <p className="text-ivory/50 text-sm">{onglet === "francaises" ? t("aucuneFrancaise") : t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-7 sm:gap-x-5 sm:gap-y-9">
          {cartesFiltrees.map((carte) => (
            <CarteVitrine
              key={carte.slug}
              carte={carte}
              href={`/${locale}/boutique/${carte.slug}`}
              prixLabel={`${t("apartirDe")} ${carte.montant_min} €`}
              badge={
                carte.made_in_france && onglet !== "francaises" ? (
                  <span title={t("badgeFabrique")} className="text-[10px] text-ink/70 bg-ink/[0.06] rounded-full px-2 py-0.5 whitespace-nowrap">
                    🇫🇷 <span className="hidden sm:inline">{t("badgeFabrique")}</span>
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