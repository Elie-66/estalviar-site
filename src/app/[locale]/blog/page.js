"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function Blog() {
  const [articles, setArticles] = useState([]);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("articles_blog")
        .select("*")
        .eq("publie", true)
        .order("created_at", { ascending: false });

      setArticles(data || []);
      setChargement(false);
    };
    charger();
  }, []);

  if (chargement) {
    return (
      <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Estalviar</p>
      <h1 className="text-3xl font-semibold text-ivory mb-10">Blog</h1>

      {articles.length === 0 ? (
        <p className="text-ivory/50 text-sm">Aucun article pour le moment.</p>
      ) : (
        <div className="space-y-6">
          {articles.map((art) => (
            <a
              key={art.id}
              href={`/fr/blog/${art.slug}`}
              className="block border border-ivory/10 rounded-xl p-6 hover:border-gold/30 transition-colors"
            >
              {art.categorie && (
                <p className="text-xs uppercase tracking-wide text-gold mb-2">{art.categorie}</p>
              )}
              <h2 className="text-xl font-semibold text-ivory">{art.titre}</h2>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed">{art.extrait}</p>
              <p className="mt-4 text-xs text-ivory/40">
                {new Date(art.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}