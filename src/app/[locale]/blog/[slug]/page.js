"use client";

import { use, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../../lib/supabase";

export default function Article({ params }) {
  const { slug } = use(params);
  const t = useTranslations("blog");
  const locale = useLocale();
  const [article, setArticle] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("articles_blog")
        .select("*")
        .eq("slug", slug)
        .eq("publie", true)
        .maybeSingle();
      setArticle(data);
      setChargement(false);
    };
    charger();
  }, [slug]);

  if (chargement) {
    return <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">{t("chargement")}</div>;
  }

  if (!article) {
    return (
      <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">{t("introuvable")}</h1>
        <a href={`/${locale}/blog`} className="inline-block mt-6 text-gold hover:underline text-sm">‹ {t("retour")}</a>
      </div>
    );
  }

  return (
    <article className="max-w-[720px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      <a href={`/${locale}/blog`} className="text-sm text-ivory/55 hover:text-gold">‹ {t("retour")}</a>
      {article.categorie && <p className="text-sm text-gold mt-8 mb-2">{article.categorie}</p>}
      <h1 className="text-3xl md:text-4xl font-semibold text-ivory leading-tight">{article.titre}</h1>
      <p className="mt-4 text-sm text-ivory/50">
        {[article.auteur, new Date(article.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })]
          .filter(Boolean).join(" · ")}
      </p>
      {article.image && <img src={article.image} alt="" className="mt-8 w-full rounded-2xl aspect-[16/9] object-cover" />}
      <div className="mt-10 text-ivory/80 text-[17px] leading-[1.8] space-y-5">
        {(article.contenu || "").split("\n\n").map((paragraphe, i) => <p key={i}>{paragraphe}</p>)}
      </div>
      <div className="mt-14 rounded-2xl border border-gold/25 bg-gold/[0.06] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="text-ivory font-medium">{t("cta")}</p>
        <a href={`/${locale}/boutique`} className="shrink-0 bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-3 hover:bg-gold/90 text-center">{t("ctaBouton")}</a>
      </div>
    </article>
  );
}
