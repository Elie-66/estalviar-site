"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";

export default function Blog() {
  const t = useTranslations("blog");
  const locale = useLocale();
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

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
      <p className="mt-3 mb-10 text-ivory/65">{t("intro")}</p>

      {chargement ? (
        <p className="text-ivory/55 text-sm">{t("chargement")}</p>
      ) : articles.length === 0 ? (
        <p className="text-ivory/55 text-sm">{t("aucun")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {articles.map((art) => (
            <a key={art.id} href={`/${locale}/blog/${art.slug}`}
              className="group block border border-ivory/10 rounded-2xl overflow-hidden hover:border-gold/30 transition-colors">
              {art.image && <img src={art.image} alt="" className="w-full aspect-[16/9] object-cover" />}
              <div className="p-6">
                {art.categorie && <p className="text-xs text-gold mb-2">{art.categorie}</p>}
                <h2 className="text-xl font-semibold text-ivory group-hover:text-gold transition-colors">{art.titre}</h2>
                {art.extrait && <p className="mt-2 text-sm text-ivory/65 leading-relaxed">{art.extrait}</p>}
                <p className="mt-4 text-xs text-ivory/45">
                  {new Date(art.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
