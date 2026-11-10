"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Icone } from "./accueil/Icones";
import { textesAccueil } from "./accueil/textes";

// Recherche d'enseigne dans le header : le catalogue n'est chargé qu'au premier clic dans le champ
export default function RechercheHeader({ locale, id = "recherche-header", onChoix }) {
  const tx = textesAccueil(locale);
  const tCategories = useTranslations("categories");
  const [catalogue, setCatalogue] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef(null);

  const traduire = (cat) => (cat && tCategories.has(cat) ? tCategories(cat) : cat);

  const charger = async () => {
    if (catalogue) return;
    const { data } = await supabase
      .from("catalogue")
      .select("slug, nom, image, categorie")
      .eq("actif", true)
      .order("ordre", { ascending: true });
    setCatalogue(data || []);
  };

  // Ferme la liste quand on clique ailleurs
  useEffect(() => {
    const fermer = (e) => {
      if (zone.current && !zone.current.contains(e.target)) setOuvert(false);
    };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q || !catalogue) return [];
    return catalogue
      .filter((c) => c.nom?.toLowerCase().includes(q) || traduire(c.categorie)?.toLowerCase().includes(q))
      .slice(0, 6);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche, catalogue]);

  const aller = (slug) => {
    setOuvert(false);
    setRecherche("");
    onChoix?.();
    window.location.href = `/${locale}/boutique/${slug}`;
  };

  return (
    <form
      ref={zone}
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (resultats[0]) aller(resultats[0].slug);
        else window.location.href = `/${locale}/boutique`;
      }}
    >
      <label htmlFor={id} className="sr-only">{tx.rechercheLabel}</label>
      <div className="flex">
        <input
          id={id}
          type="search"
          value={recherche}
          onFocus={() => { charger(); setOuvert(true); }}
          onChange={(e) => { setRecherche(e.target.value); setOuvert(true); }}
          placeholder={tx.recherche}
          autoComplete="off"
          className="flex-1 min-w-0 h-10 rounded-l bg-white px-3.5 text-sm text-[#12172B] placeholder:text-[#6B6F7C] focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <button
          type="submit"
          aria-label={tx.rechercheLabel}
          className="w-11 h-10 rounded-r bg-gold text-[#12172B] flex items-center justify-center hover:bg-[#B8921F] transition-colors"
        >
          <Icone nom="loupe" taille={18} />
        </button>
      </div>

      {ouvert && recherche.trim() && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E4E1D9] rounded shadow-[0_8px_24px_rgba(17,22,43,0.12)] overflow-hidden">
          {catalogue && resultats.length === 0 && (
            <li className="px-4 py-3 text-sm text-[#4A4F5E]">{tx.aucunResultat}</li>
          )}
          {resultats.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => aller(c.slug)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#F6F5F2]"
              >
                <span className="w-12 h-8 flex items-center justify-center bg-white border border-[#EFECE5] rounded shrink-0">
                  {c.image ? <img src={c.image} alt="" className="max-w-[80%] max-h-[70%] object-contain" /> : null}
                </span>
                <span className="text-sm text-[#12172B] font-medium">{c.nom}</span>
                <span className="ml-auto text-xs text-[#6B6F7C]">{traduire(c.categorie)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
