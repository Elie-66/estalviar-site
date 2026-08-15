"use client";

import { useState, useRef, useEffect } from "react";

export default function SelecteurCarte({ cartes, valeur, onChange }) {
  const [ouvert, setOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const ref = useRef(null);

  const carteActuelle = cartes[valeur];

  const entrees = Object.entries(cartes).filter(([, c]) =>
    c.nom.toLowerCase().includes(recherche.toLowerCase())
  );

  useEffect(() => {
    const fermerSiExterieur = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOuvert(false);
        setRecherche("");
      }
    };
    document.addEventListener("mousedown", fermerSiExterieur);
    return () => document.removeEventListener("mousedown", fermerSiExterieur);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOuvert(!ouvert)}
        className="w-full flex items-center gap-3 border border-ivory/20 rounded-lg px-4 py-3 bg-transparent hover:border-gold/50 transition-colors"
      >
        <div className="bg-white rounded-md p-1 flex-shrink-0">
          <img src={carteActuelle.image} alt={carteActuelle.nom} className="h-5 w-5 object-contain" />
        </div>
        <span className="text-ivory text-sm flex-1 text-left">{carteActuelle.nom}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ivory/50">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {ouvert && (
        <div className="absolute z-50 mt-2 w-full bg-ink-secondary border border-ivory/20 rounded-lg shadow-2xl overflow-hidden">
          <input
            type="text"
            autoFocus
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une enseigne..."
            className="w-full bg-transparent border-b border-ivory/10 px-4 py-3 text-ivory text-sm outline-none"
          />
          <div className="max-h-64 overflow-y-auto">
            {entrees.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ivory/40">Aucune enseigne trouvée.</p>
            ) : (
              entrees.map(([slug, c]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={() => {
                    onChange(slug);
                    setOuvert(false);
                    setRecherche("");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-ivory/5 transition-colors ${
                    slug === valeur ? "bg-gold/10" : ""
                  }`}
                >
                  <div className="bg-white rounded-md p-1 flex-shrink-0">
                    <img src={c.image} alt={c.nom} className="h-4 w-4 object-contain" />
                  </div>
                  <span className="text-ivory text-sm">{c.nom}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}