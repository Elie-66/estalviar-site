"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

const vide = {
  slug: "",
  nom: "",
  categorie: "",
  image: "",
  couleur: "#1b3a5c",
  montant_min: 15,
  montant_max: 200,
  suggestions: "15,25,50,100",
  description: "",
  description_en: "",
  description_de: "",
  description_es: "",
  description_it: "",
  actif: true,
  ordre: 0,
};

export default function AdminCatalogue() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [cartes, setCartes] = useState([]);
  const [formulaire, setFormulaire] = useState(vide);
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [langueActive, setLangueActive] = useState("fr");

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
      .from("catalogue")
      .select("*")
      .order("ordre", { ascending: true });
    setCartes(data || []);
  };

  const ouvrirEdition = (carte) => {
    setIdEnEdition(carte.id);
    setLangueActive("fr");
    setFormulaire({
      ...carte,
      suggestions: carte.suggestions.join(","),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const ouvrirCreation = () => {
    setIdEnEdition("nouveau");
    setLangueActive("fr");
    setFormulaire(vide);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annuler = () => {
    setIdEnEdition(null);
    setFormulaire(vide);
    setErreur("");
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreur("");

    const suggestionsArray = formulaire.suggestions
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n));

    const donnees = {
      slug: formulaire.slug.trim().toLowerCase(),
      nom: formulaire.nom.trim(),
      categorie: formulaire.categorie.trim(),
      image: formulaire.image.trim(),
      couleur: formulaire.couleur,
      montant_min: parseInt(formulaire.montant_min),
      montant_max: parseInt(formulaire.montant_max),
      suggestions: suggestionsArray,
      description: formulaire.description.trim(),
      description_en: formulaire.description_en?.trim() || null,
      description_de: formulaire.description_de?.trim() || null,
      description_es: formulaire.description_es?.trim() || null,
      description_it: formulaire.description_it?.trim() || null,
      actif: formulaire.actif,
      ordre: parseInt(formulaire.ordre) || 0,
    };

    let resultat;
    if (idEnEdition === "nouveau") {
      resultat = await supabase.from("catalogue").insert(donnees);
    } else {
      resultat = await supabase.from("catalogue").update(donnees).eq("id", idEnEdition);
    }

    if (resultat.error) {
      setErreur(resultat.error.message);
    } else {
      await charger();
      annuler();
    }
    setEnregistrement(false);
  };

  const basculerActif = async (carte) => {
    await supabase.from("catalogue").update({ actif: !carte.actif }).eq("id", carte.id);
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
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Catalogue</h1>

      {idEnEdition && (
        <form onSubmit={enregistrer} className="border border-gold/30 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold text-ivory mb-4">
            {idEnEdition === "nouveau" ? "Ajouter une enseigne" : "Modifier l'enseigne"}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Identifiant (slug)</label>
              <input
                type="text"
                value={formulaire.slug}
                onChange={(e) => setFormulaire({ ...formulaire, slug: e.target.value })}
                required
                disabled={idEnEdition !== "nouveau"}
                placeholder="ex: nike"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Nom affiché</label>
              <input
                type="text"
                value={formulaire.nom}
                onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Catégorie</label>
              <input
                type="text"
                value={formulaire.categorie}
                onChange={(e) => setFormulaire({ ...formulaire, categorie: e.target.value })}
                required
                placeholder="ex: Shopping"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Chemin du logo</label>
              <input
                type="text"
                value={formulaire.image}
                onChange={(e) => setFormulaire({ ...formulaire, image: e.target.value })}
                required
                placeholder="/logos/nike.svg"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Couleur (hex)</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formulaire.couleur}
                  onChange={(e) => setFormulaire({ ...formulaire, couleur: e.target.value })}
                  className="h-9 w-12 bg-transparent border border-ivory/20 rounded-lg"
                />
                <input
                  type="text"
                  value={formulaire.couleur}
                  onChange={(e) => setFormulaire({ ...formulaire, couleur: e.target.value })}
                  className="flex-1 bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Ordre d'affichage</label>
              <input
                type="number"
                value={formulaire.ordre}
                onChange={(e) => setFormulaire({ ...formulaire, ordre: e.target.value })}
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Montant min (€)</label>
              <input
                type="number"
                value={formulaire.montant_min}
                onChange={(e) => setFormulaire({ ...formulaire, montant_min: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Montant max (€)</label>
              <input
                type="number"
                value={formulaire.montant_max}
                onChange={(e) => setFormulaire({ ...formulaire, montant_max: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs text-ivory/60 mb-1">Montants suggérés (séparés par des virgules)</label>
            <input
              type="text"
              value={formulaire.suggestions}
              onChange={(e) => setFormulaire({ ...formulaire, suggestions: e.target.value })}
              placeholder="15,25,50,100"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs text-ivory/60 mb-2">Description</label>
            <div className="flex gap-1 mb-2">
              {[
                { code: "fr", label: "FR" },
                { code: "en", label: "EN" },
                { code: "de", label: "DE" },
                { code: "es", label: "ES" },
                { code: "it", label: "IT" },
              ].map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLangueActive(l.code)}
                  className={`text-xs px-3 py-1 rounded-md transition-colors ${
                    langueActive === l.code ? "bg-gold text-ink font-medium" : "bg-ivory/5 text-ivory/50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <textarea
              value={langueActive === "fr" ? formulaire.description : formulaire[`description_${langueActive}`] || ""}
              onChange={(e) => {
                const champ = langueActive === "fr" ? "description" : `description_${langueActive}`;
                setFormulaire({ ...formulaire, [champ]: e.target.value });
              }}
              rows={2}
              placeholder={langueActive !== "fr" ? "Laissez vide pour utiliser le français par défaut" : ""}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm resize-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-ivory/70 mt-4">
            <input
              type="checkbox"
              checked={formulaire.actif}
              onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })}
            />
            Visible sur le site
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
          + Ajouter une enseigne
        </button>
      )}

      <div className="space-y-3">
        {cartes.map((carte) => (
          <div
            key={carte.id}
            className={`border rounded-lg p-4 flex items-center justify-between ${
              carte.actif ? "border-ivory/10" : "border-ivory/5 opacity-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-md p-1.5 flex-shrink-0">
                <img src={carte.image} alt={carte.nom} className="h-6 w-6 object-contain" />
              </div>
              <div>
                <p className="text-ivory font-medium">{carte.nom}</p>
                <p className="text-xs text-ivory/50">{carte.categorie} — {carte.montant_min} à {carte.montant_max} €</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => basculerActif(carte)}
                className={`text-xs rounded-full px-2.5 py-1 ${
                  carte.actif ? "bg-vert/20 text-vert" : "bg-ivory/10 text-ivory/50"
                }`}
              >
                {carte.actif ? "Actif" : "Inactif"}
              </button>
              <button
                onClick={() => ouvrirEdition(carte)}
                className="text-xs text-gold hover:underline"
              >
                Modifier
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}