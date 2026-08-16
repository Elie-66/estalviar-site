"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

export default function Article({ params }) {
  const { slug } = use(params);
  const [article, setArticle] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("articles_blog")
        .select("*")
        .eq("slug", slug)
        .eq("publie", true)
        .single();

      setArticle(data);
      setChargement(false);
    };
    charger();
  }, [slug]);

  if (chargement) {
    return (
      <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">Article introuvable</h1>
        <a href="/fr/blog" className="inline-block mt-6 text-gold hover:underline text-sm">
          ← Retour au blog
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/blog" className="text-sm text-gold hover:underline">← Retour au blog</a>

      {article.categorie && (
        <p className="text-xs uppercase tracking-wide text-gold mt-6 mb-2">{article.categorie}</p>
      )}
      <h1 className="text-3xl font-semibold text-ivory mb-4">{article.titre}</h1>
      <p className="text-xs text-ivory/40 mb-10">
        {article.auteur} — {new Date(article.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="text-ivory/80 leading-relaxed space-y-4">
        {article.contenu.split("\n\n").map((paragraphe, i) => (
          <p key={i}>{paragraphe}</p>
        ))}
      </div>
    </div>
  );
}