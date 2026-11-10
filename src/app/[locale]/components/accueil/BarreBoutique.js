"use client";

import { useMemo, useState } from "react";
import { Icone } from "./Icones";

// Barre claire sous le menu : recherche d'enseigne + accès direct aux univers
export default function BarreBoutique({ locale, catalogue, categories, traduireCategorie, tx }) {
  const [recherche, setRecherche] = useState("");

  const resultats = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return [];
    return catalogue
      .filter(
        (c) =>
          c.nom?.toLowerCase().includes(q) ||
          traduireCategorie(c.categorie)?.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [recherche, catalogue, traduireCategorie]);

  return (
    <div className="bg-ink border-y border-ivory/10">
      <div className="max-w-[1240px] mx-auto px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-4">
        <form
          role="search"
          className="relative flex-1 lg:max-w-[460px]"
          onSubmit={(e) => {
            e.preventDefault();
            if (resultats[0]) window.location.href = `/${locale}/boutique/${resultats[0].slug}`;
          }}
        >
          <label htmlFor="recherche-accueil" className="sr-only">{tx.rechercheLabel}</label>
          <div className="flex">
            <input
              id="recherche-accueil"
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={tx.recherche}
              autoComplete="off"
              className="flex-1 min-w-0 h-11 rounded-l border-0 bg-white px-4 text-[15px] text-ink placeholder:text-[#6B6F7C] focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <button
              type="submit"
              aria-label={tx.rechercheLabel}
              className="w-12 h-11 rounded-r bg-gold text-ink flex items-center justify-center hover:bg-[#B8921F] transition-colors"
            >
              <Icone nom="loupe" taille={18} />
            </button>
          </div>

          {recherche.trim() && (
            <ul className="absolute z-30 left-0 right-0 mt-1 bg-white border border-[#E4E1D9] rounded shadow-[0_8px_24px_rgba(17,22,43,0.08)] overflow-hidden">
              {resultats.length === 0 && (
                <li className="px-4 py-3 text-sm text-[#4A4F5E]">{tx.aucunResultat}</li>
              )}
              {resultats.map((c) => (
                <li key={c.slug}>
                  <a
                    href={`/${locale}/boutique/${c.slug}`}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#F6F5F2]"
                  >
                    <span className="w-12 h-8 flex items-center justify-center bg-white border border-[#EFECE5] rounded">
                      {c.image ? (
                        <img src={c.image} alt="" className="max-w-[80%] max-h-[70%] object-contain" />
                      ) : null}
                    </span>
                    <span className="text-sm text-ink font-medium">{c.nom}</span>
                    <span className="ml-auto text-xs text-[#6B6F7C]">{traduireCategorie(c.categorie)}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </form>

        <nav className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <a href={`/${locale}/boutique`} className="py-2 text-ivory font-semibold hover:underline underline-offset-4">
            {tx.toutesEnseignes}
          </a>
          {categories.slice(0, 5).map((cat) => (
            <a
              key={cat.nom}
              href={`/${locale}/boutique?categorie=${encodeURIComponent(cat.nom)}`}
              className="py-2 text-[#C9C5BB] hover:text-ivory hover:underline underline-offset-4"
            >
              {traduireCategorie(cat.nom)}
            </a>
          ))}
          <a href={`/${locale}/cagnotte`} className="py-2 text-gold font-semibold hover:underline underline-offset-4">
            {tx.cagnotte}
          </a>
        </nav>
      </div>
    </div>
  );
}
