"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

const vide = {
  slug: "",
  titre: "",
  extrait: "",
  contenu: "",
  image: "",
  categorie: "",
  publie: false,
};

export default function AdminBlog() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [articles, setArticles] = useState([]);
  const [formulaire, setFormulaire] = useState(vide);
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);
      await charger();
      setChargement(false);
    };
    verifier();
  }, []);

  const charger = async () => {
    const { data } = await supabase
      .from("articles_blog")
      .select("*")
      .order("created_at", { ascending: false });
    setArticles(data || []);
  };

  const ouvrirEdition = (art) => {
    setIdEnEdition(art.id);
    setFormulaire(art);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ouvrirCreation = () => {
    setIdEnEdition("nouveau");
    setFormulaire(vide);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annuler = () => {
    setIdEnEdition(null);
    setFormulaire(vide);
    setErreur("");
  };

  const genererSlug = (titre) => {
    return titre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreur("");

    const donnees = {
      slug: formulaire.slug.trim() || genererSlug(formulaire.titre),
      titre: formulaire.titre.trim(),
      extrait: formulaire.extrait.trim(),
      contenu: formulaire.contenu.trim(),
      image: formulaire.image.trim() || null,
      categorie: formulaire.categorie.trim() || null,
      publie: formulaire.publie,
      updated_at: new Date().toISOString(),
    };

    let resultat;
    if (idEnEdition === "nouveau") {
      resultat = await supabase.from("articles_blog").insert(donnees);
    } else {
      resultat = await supabase.from("articles_blog").update(donnees).eq("id", idEnEdition);
    }

    if (resultat.error) {
      setErreur(resultat.error.message);
    } else {
      await charger();
      annuler();
    }
    setEnregistrement(false);
  };

  const supprimer = async (id) => {
    await supabase.from("articles_blog").delete().eq("id", id);
    await charger();
  };

  const basculerPublie = async (art) => {
    await supabase.from("articles_blog").update({ publie: !art.publie }).eq("id", art.id);
    await charger();
  };

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Blog</h1>

      {idEnEdition && (
        <form onSubmit={enregistrer} className="border border-gold/30 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold text-ivory mb-4">
            {idEnEdition === "nouveau" ? "Nouvel article" : "Modifier l'article"}
          </h2>

          <label className="block text-xs text-ivory/60 mb-1">Titre</label>
          <input
            type="text"
            value={formulaire.titre}
            onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })}
            required
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />

          <label className="block text-xs text-ivory/60 mb-1 mt-4">
            Slug (URL — laisser vide pour génération automatique)
          </label>
          <input
            type="text"
            value={formulaire.slug}
            onChange={(e) => setFormulaire({ ...formulaire, slug: e.target.value })}
            placeholder="ex: comment-verifier-solde-amazon"
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Catégorie</label>
              <input
                type="text"
                value={formulaire.categorie}
                onChange={(e) => setFormulaire({ ...formulaire, categorie: e.target.value })}
                placeholder="ex: Guides"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Image (URL, facultatif)</label>
              <input
                type="text"
                value={formulaire.image}
                onChange={(e) => setFormulaire({ ...formulaire, image: e.target.value })}
                placeholder="/blog/mon-image.jpg"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
          </div>

          <label className="block text-xs text-ivory/60 mb-1 mt-4">Extrait (résumé court, affiché dans la liste)</label>
          <textarea
            value={formulaire.extrait}
            onChange={(e) => setFormulaire({ ...formulaire, extrait: e.target.value })}
            required
            rows={2}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm resize-none"
          />

          <label className="block text-xs text-ivory/60 mb-1 mt-4">Contenu (texte de l'article)</label>
          <textarea
            value={formulaire.contenu}
            onChange={(e) => setFormulaire({ ...formulaire, contenu: e.target.value })}
            required
            rows={10}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm resize-none font-mono"
          />
          <p className="mt-1 text-xs text-ivory/40">
            Astuce : sépare les paragraphes par une ligne vide.
          </p>

          <label className="flex items-center gap-2 text-sm text-ivory/70 mt-4">
            <input
              type="checkbox"
              checked={formulaire.publie}
              onChange={(e) => setFormulaire({ ...formulaire, publie: e.target.checked })}
            />
            Publié (visible sur le site)
          </label>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={enregistrement}
              className="bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              {enregistrement ? "Enregistrement..." : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={annuler}
              className="text-sm text-ivory/60 hover:text-ivory"
            >
              Annuler
            </button>
          </div>

          {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
        </form>
      )}

      {!idEnEdition && (
        <button
          onClick={ouvrirCreation}
          className="mb-6 bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gold/90 transition-colors"
        >
          + Nouvel article
        </button>
      )}

      <div className="space-y-3">
        {articles.map((art) => (
          <div
            key={art.id}
            className={`border rounded-lg p-4 flex items-center justify-between ${
              art.publie ? "border-ivory/10" : "border-ivory/5 opacity-60"
            }`}
          >
            <div>
              <p className="text-ivory font-medium">{art.titre}</p>
              <p className="text-xs text-ivory/50">
                {art.categorie && `${art.categorie} — `}
                {new Date(art.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => basculerPublie(art)}
                className={`text-xs rounded-full px-2.5 py-1 ${
                  art.publie ? "bg-vert/20 text-vert" : "bg-ivory/10 text-ivory/50"
                }`}
              >
                {art.publie ? "Publié" : "Brouillon"}
              </button>
              <button
                onClick={() => ouvrirEdition(art)}
                className="text-xs text-gold hover:underline"
              >
                Modifier
              </button>
              <button
                onClick={() => supprimer(art.id)}
                className="text-xs text-corail/70 hover:text-corail"
              >
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}