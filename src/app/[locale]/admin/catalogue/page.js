"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";
import { adminLire, adminAjouter, adminModifier, adminSupprimer } from "../../../../lib/adminDb";
import { fetchAdmin } from "../../../../lib/fetchAdmin";

const NOTORIETES = [
  { valeur: "peu", label: "Peu connue" },
  { valeur: "moyen", label: "Moyennement connue" },
  { valeur: "tres", label: "Très connue" },
];

const vide = {
  notoriete: "peu",
  etiquettes: "",
  made_in_france: false,
  mise_en_avant: false,
  fournisseur: "tillo",
  marge: "",
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
  const [marges, setMarges] = useState({});
  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreCategorie, setFiltreCategorie] = useState("toutes");

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
    const { data } = await adminLire("catalogue", "ordre", true);
    setCartes(data || []);

    // Les marges sont privées : on les lit via la route serveur protégée
    const res = await fetchAdmin("/api/admin-marges");
    if (res.ok) {
      const json = await res.json();
      const parSlug = {};
      (json.marges || []).forEach((m) => { parSlug[m.slug] = m; });
      setMarges(parSlug);
    }
  };

  const ouvrirEdition = (carte) => {
    setIdEnEdition(carte.id);
    setLangueActive("fr");
    setFormulaire({
      ...vide,
      ...carte,
      suggestions: (carte.suggestions || []).join(","),
      etiquettes: (carte.etiquettes || []).join(", "),
      notoriete: carte.notoriete || "peu",
      fournisseur: carte.fournisseur || "tillo",
      made_in_france: !!carte.made_in_france,
      mise_en_avant: !!carte.mise_en_avant,
      marge: marges[carte.slug]?.marge ?? "",
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

    if (formulaire.actif && !formulaire.image.trim()) {
      setErreur("Ajoute un logo avant de rendre cette enseigne visible sur le site.");
      setEnregistrement(false);
      return;
    }

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
      notoriete: formulaire.notoriete,
      etiquettes: formulaire.etiquettes
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      made_in_france: formulaire.made_in_france,
      mise_en_avant: formulaire.mise_en_avant,
      fournisseur: formulaire.fournisseur,
    };

    let resultat;
    if (idEnEdition === "nouveau") {
      resultat = await adminAjouter("catalogue", donnees);
    } else {
      resultat = await adminModifier("catalogue", idEnEdition, donnees);
    }

    if (resultat.error) {
      setErreur(resultat.error.message);
      setEnregistrement(false);
      return;
    }

    // Marge : enregistrée à part, dans la table privée, via la route serveur
    if (formulaire.marge !== "" && formulaire.marge !== null) {
      const res = await fetchAdmin("/api/admin-marges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: donnees.slug,
          marge: formulaire.marge,
          fournisseur: formulaire.fournisseur,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setErreur(`Enseigne enregistrée, mais pas la marge : ${json.error || "erreur"}`);
        setEnregistrement(false);
        await charger();
        return;
      }
    }

    await charger();
    annuler();
    setEnregistrement(false);
  };

  const basculerActif = async (carte) => {
    if (!carte.actif && !carte.image) {
      alert("Ajoute un logo avant de rendre cette enseigne visible sur le site.");
      return;
    }
    await adminModifier("catalogue", carte.id, { actif: !carte.actif });
    await charger();
  };

  const estVisible = (c) => {
    if (recherche && !c.nom.toLowerCase().includes(recherche.toLowerCase())) return false;
    if (filtreCategorie !== "toutes" && c.categorie !== filtreCategorie) return false;
    if (filtreStatut === "actifs" && !c.actif) return false;
    if (filtreStatut === "inactifs" && c.actif) return false;
    if (filtreStatut === "sans-logo" && c.image) return false;
    if (filtreStatut === "made-in-france" && !c.made_in_france) return false;
    if (filtreStatut === "mises-en-avant" && !c.mise_en_avant) return false;
    return true;
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

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Notoriété</label>
              <select
                value={formulaire.notoriete}
                onChange={(e) => setFormulaire({ ...formulaire, notoriete: e.target.value })}
                className="w-full bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              >
                {NOTORIETES.map((n) => (
                  <option key={n.valeur} value={n.valeur}>{n.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Fournisseur</label>
              <select
                value={formulaire.fournisseur}
                onChange={(e) => setFormulaire({ ...formulaire, fournisseur: e.target.value })}
                className="w-full bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              >
                <option value="tillo">Tillo</option>
                <option value="finperks">Finperks</option>
                <option value="direct">En direct (marque partenaire)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Ta marge (%) — privée, jamais visible sur le site</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formulaire.marge}
                onChange={(e) => setFormulaire({ ...formulaire, marge: e.target.value })}
                placeholder="ex: 13"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Étiquettes (séparées par des virgules)</label>
              <input
                type="text"
                value={formulaire.etiquettes}
                onChange={(e) => setFormulaire({ ...formulaire, etiquettes: e.target.value })}
                placeholder="ex: sport, fete-des-peres"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm text-ivory/70">
              <input
                type="checkbox"
                checked={formulaire.made_in_france}
                onChange={(e) => setFormulaire({ ...formulaire, made_in_france: e.target.checked })}
              />
              Fabriquée en France
            </label>
            <label className="flex items-center gap-2 text-sm text-ivory/70">
              <input
                type="checkbox"
                checked={formulaire.mise_en_avant}
                onChange={(e) => setFormulaire({ ...formulaire, mise_en_avant: e.target.checked })}
              />
              Mise en avant manuelle (prioritaire sur le classement)
            </label>
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

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher une enseigne..."
          className="flex-1 min-w-[180px] bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
        >
          <option value="tous">Toutes</option>
          <option value="actifs">Actives</option>
          <option value="inactifs">Inactives</option>
          <option value="sans-logo">Sans logo</option>
          <option value="made-in-france">Fabriquées en France</option>
          <option value="mises-en-avant">Mises en avant</option>
        </select>
        <select
          value={filtreCategorie}
          onChange={(e) => setFiltreCategorie(e.target.value)}
          className="bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
        >
          <option value="toutes">Toutes catégories</option>
          {[...new Set(cartes.map((c) => c.categorie).filter(Boolean))].sort().map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {(() => {
        const visibles = cartes.filter(estVisible);
        return (
          <p className="text-xs text-ivory/50 mb-3">
            {visibles.length} enseigne{visibles.length > 1 ? "s" : ""} affichée{visibles.length > 1 ? "s" : ""} sur {cartes.length} ({cartes.filter((c) => c.actif).length} actives)
          </p>
        );
      })()}

      <div className="space-y-3">
        {cartes
          .filter(estVisible)
          .map((carte) => (
          <div
            key={carte.id}
            className={`border rounded-lg p-4 flex items-center justify-between ${
              carte.actif ? "border-ivory/10" : "border-ivory/5 opacity-50"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="bg-white rounded-md p-1.5 flex-shrink-0 h-9 w-9 flex items-center justify-center">
                {carte.image ? (
                  <img src={carte.image} alt={carte.nom} className="h-6 w-6 object-contain" />
                ) : (
                  <span className="text-[10px] text-ink/40">logo</span>
                )}
              </div>
              <div>
                <p className="text-ivory font-medium">
                  {carte.nom}
                  {carte.made_in_france && <span className="ml-2 text-[10px] rounded-full px-2 py-0.5 bg-ivory/10 text-ivory/70">🇫🇷 Made in France</span>}
                  {carte.mise_en_avant && <span className="ml-2 text-[10px] rounded-full px-2 py-0.5 bg-gold/20 text-gold">★ Mise en avant</span>}
                </p>
                <p className="text-xs text-ivory/50">
                  {carte.categorie} — {carte.montant_min} à {carte.montant_max} €
                  {" — "}{NOTORIETES.find((n) => n.valeur === carte.notoriete)?.label || "Notoriété ?"}
                  {" — "}
                  <span className={marges[carte.slug] ? "text-gold" : "text-corail"}>
                    {marges[carte.slug] ? `marge ${marges[carte.slug].marge} %` : "marge non renseignée"}
                  </span>
                </p>
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