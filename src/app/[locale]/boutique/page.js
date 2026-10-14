"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function Boutique() {
  const t = useTranslations("boutiqueVitrine");
  const tCategories = useTranslations("categories");
  const searchParams = useSearchParams();
  const [cartes, setCartes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState(searchParams.get("categorie") || "Toutes");
  // Onglet « Fabriqué en France » : lien direct possible avec /fr/boutique?onglet=francaises
  const [onglet, setOnglet] = useState(searchParams.get("onglet") === "francaises" ? "francaises" : "toutes");

  const changerOnglet = (nouvelOnglet) => {
    setOnglet(nouvelOnglet);
    setCategorie("Toutes");
    const url = new URL(window.location.href);
    if (nouvelOnglet === "francaises") url.searchParams.set("onglet", "francaises");
    else url.searchParams.delete("onglet");
    url.searchParams.delete("categorie");
    window.history.replaceState(null, "", url);
  };

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

  const cartesOnglet = onglet === "francaises" ? cartes.filter((c) => c.made_in_france) : cartes;

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
    <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20">
      <div className="flex gap-2 border border-ivory/10 rounded-lg p-1 w-fit mb-8">
        <button
          onClick={() => changerOnglet("toutes")}
          className={`text-sm px-4 py-2 rounded-md transition-colors ${
            onglet === "toutes" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          {t("ongletToutes")}
        </button>
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

      <h1 className="text-3xl font-semibold text-ivory mb-3">
        {onglet === "francaises" ? t("titreFrancaises") : t("titre")}
      </h1>
      {onglet === "francaises" ? (
        <p className="text-ivory/60 text-sm max-w-[640px] mb-8">{t("introFrancaises")}</p>
      ) : (
        <div className="mb-5" />
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-ivory/40"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={t("recherchePlaceholder")}
            className="w-full bg-transparent border border-ivory/20 rounded-lg pl-11 pr-4 py-3 text-ivory text-sm"
          />
        </div>

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm"
        >
          <option value="Toutes" className="bg-ink">{t("toutes")}</option>
          {categories.filter((cat) => cat !== "Toutes").map((cat) => (
            <option key={cat} value={cat} className="bg-ink">
              {traduireCategorie(cat)}
            </option>
          ))}
        </select>
      </div>

      {cartesFiltrees.length === 0 ? (
        <p className="text-ivory/50 text-sm">{onglet === "francaises" ? t("aucuneFrancaise") : t("aucunResultat")}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {cartesFiltrees.map((carte) => (
            <a
              key={carte.slug}
              href={`/fr/boutique/${carte.slug}`}
              className="border border-ivory/10 rounded-lg p-6 text-center hover:border-gold/50 transition-colors"
            >
              <div className="h-24 flex items-center justify-center bg-white rounded-md">
                {carte.image ? (
                  <Image src={carte.image} alt={carte.nom} width={100} height={100} className="object-contain" />
                ) : (
                  <span className="text-ink text-sm">{carte.nom}</span>
                )}
              </div>
              <p className="mt-4 text-ivory">{carte.nom}</p>
              <p className="text-xs text-gold/60 mt-0.5">{traduireCategorie(carte.categorie)}</p>
              <p className="text-sm text-ivory/50">{t("apartirDe")} {carte.montant_min} €</p>
              {carte.made_in_france && onglet !== "francaises" && (
                <p className="mt-2 inline-block text-[10px] rounded-full px-2 py-0.5 bg-ivory/10 text-ivory/70">
                  🇫🇷 {t("badgeFabrique")}
                </p>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}