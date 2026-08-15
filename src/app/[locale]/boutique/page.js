"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "../../../lib/supabase";

export default function Boutique() {
  const [cartes, setCartes] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [categorie, setCategorie] = useState("Toutes");

  useEffect(() => {
    const charger = async () => {
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

  const categories = ["Toutes", ...Array.from(new Set(cartes.map((c) => c.categorie)))];

  const cartesFiltrees = cartes.filter((c) => {
    const correspondRecherche = c.nom.toLowerCase().includes(recherche.toLowerCase());
    const correspondCategorie = categorie === "Toutes" || c.categorie === categorie;
    return correspondRecherche && correspondCategorie;
  });

  if (chargement) {
    return (
      <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-8">Toutes les enseignes</h1>

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
            placeholder="Rechercher une enseigne..."
            className="w-full bg-transparent border border-ivory/20 rounded-lg pl-11 pr-4 py-3 text-ivory text-sm"
          />
        </div>

        <select
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-ink">
              {cat}
            </option>
          ))}
        </select>
      </div>

      {cartesFiltrees.length === 0 ? (
        <p className="text-ivory/50 text-sm">Aucune enseigne ne correspond à votre recherche.</p>
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
                  <Image src={carte.image} alt={carte.nom} width={80} height={80} className="object-contain" />
                ) : (
                  <span className="text-ink text-sm">{carte.nom}</span>
                )}
              </div>
              <p className="mt-4 text-ivory">{carte.nom}</p>
              <p className="text-xs text-gold/60 mt-0.5">{carte.categorie}</p>
              <p className="text-sm text-ivory/50">à partir de {carte.montant_min} €</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}