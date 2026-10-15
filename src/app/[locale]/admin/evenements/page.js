"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { peutVoir } from "../../../../lib/accesAdmin";
import { adminLire, adminAjouter, adminModifier, adminSupprimer } from "../../../../lib/adminDb";
import {
  REGLES_DATE, aujourdhuiParis, dansSelection, prochaineOccurrence,
} from "../../../../lib/evenements";

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const VIDE = {
  nom: "", slug: "", accroche: "", description: "", regle: "fixe", mois: 1, jour: 1, jours_avant: 21,
  etiquette: "", categories: [], marques: [], fabrique_en_france: false, actif: true,
};

const versSlug = (texte) =>
  String(texte || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const dateLongue = (texte) =>
  new Date(`${texte}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function AdminEvenements() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [evenements, setEvenements] = useState([]);
  const [catalogue, setCatalogue] = useState([]);
  const [formulaire, setFormulaire] = useState(null); // null = formulaire fermé
  const [idEnEdition, setIdEnEdition] = useState(null);
  const [rechercheMarque, setRechercheMarque] = useState("");
  const [message, setMessage] = useState("");

  const charger = async () => {
    const [{ data: e }, { data: c }] = await Promise.all([
      adminLire("evenements"),
      adminLire("catalogue", "nom", true),
    ]);
    setEvenements(e || []);
    setCatalogue(c || []);
  };

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !(await peutVoir("evenements"))) {
        window.location.href = user ? "/fr/admin" : "/fr";
        return;
      }
      setAutorise(true);
      await charger();
      setChargement(false);
    };
    verifier();
  }, []);

  const ouvrir = (evenement) => {
    setMessage("");
    setRechercheMarque("");
    setIdEnEdition(evenement ? evenement.id : "nouveau");
    setFormulaire(evenement
      ? { ...VIDE, ...evenement, etiquette: evenement.etiquette || "", categories: evenement.categories || [], marques: evenement.marques || [] }
      : { ...VIDE });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const fermer = () => {
    setFormulaire(null);
    setIdEnEdition(null);
  };

  const basculer = (champ, valeur) => {
    const liste = formulaire[champ];
    setFormulaire({ ...formulaire, [champ]: liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur] });
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setMessage("");
    const slug = idEnEdition === "nouveau" ? versSlug(formulaire.slug || formulaire.nom) : formulaire.slug;
    if (!formulaire.nom.trim() || slug.length < 2) {
      setMessage("Indique un nom d'événement.");
      return;
    }
    if (idEnEdition === "nouveau" && evenements.some((x) => x.slug === slug)) {
      setMessage("Un événement porte déjà ce nom.");
      return;
    }
    const donnees = {
      nom: formulaire.nom.trim(),
      accroche: formulaire.accroche.trim() || null,
      description: formulaire.description.trim() || null,
      regle: formulaire.regle,
      mois: formulaire.regle === "fixe" ? Number(formulaire.mois) : null,
      jour: formulaire.regle === "fixe" ? Number(formulaire.jour) : null,
      jours_avant: Math.min(90, Math.max(1, parseInt(formulaire.jours_avant, 10) || 21)),
      etiquette: versSlug(formulaire.etiquette) || null,
      categories: formulaire.categories.length ? formulaire.categories : null,
      marques: formulaire.marques.length ? formulaire.marques : null,
      fabrique_en_france: formulaire.fabrique_en_france,
      actif: formulaire.actif,
    };
    const { error } = idEnEdition === "nouveau"
      ? await adminAjouter("evenements", { ...donnees, slug })
      : await adminModifier("evenements", idEnEdition, donnees);
    if (error) {
      setMessage("Erreur : " + error.message);
      return;
    }
    fermer();
    await charger();
  };

  const supprimer = async (ev) => {
    if (!window.confirm(`Supprimer l'événement « ${ev.nom} » ?`)) return;
    await adminSupprimer("evenements", ev.id);
    await charger();
  };

  const basculerActif = async (ev) => {
    await adminModifier("evenements", ev.id, { actif: !ev.actif });
    await charger();
  };

  if (chargement || !autorise) {
    return <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">Chargement...</div>;
  }

  const aujourdhui = aujourdhuiParis();
  const actives = catalogue.filter((c) => c.actif);
  const toutesCategories = [...new Set(catalogue.map((c) => c.categorie).filter(Boolean))].sort();
  const etiquettesConnues = [...new Set(catalogue.flatMap((c) => c.etiquettes || []))].sort();

  const liste = evenements
    .map((ev) => {
      const { date, joursRestants } = prochaineOccurrence(ev, aujourdhui);
      const selection = actives.filter((c) => dansSelection(ev, c));
      const debut = new Date(new Date(`${date}T12:00:00Z`).getTime() - (ev.jours_avant || 0) * 86400000)
        .toISOString().slice(0, 10);
      const enCours = ev.actif && joursRestants <= ev.jours_avant && selection.length > 0;
      return { ...ev, date, joursRestants, debut, selection, enCours };
    })
    .sort((a, b) => a.joursRestants - b.joursRestants);

  // Aperçu en direct de la sélection du formulaire
  const apercu = formulaire ? actives.filter((c) => dansSelection(formulaire, c)) : [];
  const marquesFiltrees = catalogue.filter(
    (c) => !rechercheMarque || c.nom.toLowerCase().includes(rechercheMarque.toLowerCase())
  );

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <div className="flex flex-wrap items-center justify-between gap-4 mt-2 mb-3">
        <h1 className="text-3xl font-semibold text-ivory">Événements annuels</h1>
        {!formulaire && (
          <button onClick={() => ouvrir(null)} className="bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-gold/90">
            + Nouvel événement
          </button>
        )}
      </div>
      <p className="text-sm text-ivory/50 mb-8 max-w-[720px]">
        L&apos;événement le plus proche s&apos;affiche automatiquement en bandeau sur l&apos;accueil et en onglet dans la boutique,
        pendant sa période d&apos;affichage (jusqu&apos;au jour J inclus), à condition d&apos;avoir au moins une marque active.
      </p>

      {formulaire && (
        <form onSubmit={enregistrer} className="border border-gold/30 rounded-xl p-6 mb-10">
          <p className="text-ivory font-medium mb-4">{idEnEdition === "nouveau" ? "Nouvel événement" : `Modifier « ${formulaire.nom} »`}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required value={formulaire.nom} onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
              placeholder="Nom (ex. Fête des mères)" className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm" />
            <input value={formulaire.accroche} onChange={(e) => setFormulaire({ ...formulaire, accroche: e.target.value })}
              placeholder="Phrase du bandeau d'accueil" maxLength={120}
              className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm" />
            <input value={formulaire.description} onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })}
              placeholder="Texte en haut de la sélection dans la boutique" maxLength={200}
              className="sm:col-span-2 bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm" />
          </div>

          <p className="text-sm text-ivory/70 mt-6 mb-2">Date</p>
          <div className="flex flex-wrap items-center gap-3">
            <select value={formulaire.regle} onChange={(e) => setFormulaire({ ...formulaire, regle: e.target.value })}
              className="bg-ink border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm max-w-full">
              {REGLES_DATE.map((r) => <option key={r.valeur} value={r.valeur}>{r.label}</option>)}
            </select>
            {formulaire.regle === "fixe" && (
              <>
                <input type="number" min={1} max={31} value={formulaire.jour}
                  onChange={(e) => setFormulaire({ ...formulaire, jour: e.target.value })}
                  className="w-20 bg-transparent border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm" />
                <select value={formulaire.mois} onChange={(e) => setFormulaire({ ...formulaire, mois: e.target.value })}
                  className="bg-ink border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm">
                  {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </>
            )}
            <label className="flex items-center gap-2 text-sm text-ivory/70">
              Affiché
              <input type="number" min={1} max={90} value={formulaire.jours_avant}
                onChange={(e) => setFormulaire({ ...formulaire, jours_avant: e.target.value })}
                className="w-20 bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm" />
              jours avant
            </label>
          </div>
          <p className="text-xs text-gold/70 mt-2">
            Prochaine date : {dateLongue(prochaineOccurrence(formulaire, aujourdhui).date)}
          </p>

          <p className="text-sm text-ivory/70 mt-6 mb-2">Marques mises en avant</p>
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm text-ivory/80">
              <input type="checkbox" checked={formulaire.fabrique_en_france}
                onChange={(e) => setFormulaire({ ...formulaire, fabrique_en_france: e.target.checked })} />
              🇫🇷 Toutes les marques fabriquées en France
            </label>

            <div>
              <label className="block text-xs text-ivory/50 mb-1.5">
                Étiquette : toutes les marques qui ont cette étiquette dans le catalogue
              </label>
              <input value={formulaire.etiquette} onChange={(e) => setFormulaire({ ...formulaire, etiquette: e.target.value })}
                placeholder="ex. fete-des-meres" list="etiquettes-connues"
                className="w-full sm:w-80 bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm" />
              <datalist id="etiquettes-connues">
                {etiquettesConnues.map((x) => <option key={x} value={x} />)}
              </datalist>
            </div>

            <div>
              <p className="text-xs text-ivory/50 mb-2">Catégories entières</p>
              <div className="flex flex-wrap gap-2">
                {toutesCategories.map((cat) => {
                  const coche = formulaire.categories.includes(cat);
                  return (
                    <button key={cat} type="button" onClick={() => basculer("categories", cat)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                        coche ? "border-gold bg-gold/15 text-gold" : "border-ivory/20 text-ivory/60 hover:border-ivory/40"
                      }`}>
                      {coche ? "✓ " : ""}{cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-ivory/50 mb-2">Marques précises ({formulaire.marques.length} cochée{formulaire.marques.length > 1 ? "s" : ""})</p>
              <input value={rechercheMarque} onChange={(e) => setRechercheMarque(e.target.value)} placeholder="Rechercher une marque…"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm mb-2" />
              <div className="max-h-56 overflow-y-auto border border-ivory/10 rounded-lg divide-y divide-ivory/5">
                {marquesFiltrees.map((c) => (
                  <label key={c.slug} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-ivory/[0.03]">
                    <input type="checkbox" checked={formulaire.marques.includes(c.slug)} onChange={() => basculer("marques", c.slug)} />
                    <span className={`flex-1 ${c.actif ? "text-ivory" : "text-ivory/40"}`}>
                      {c.nom}{!c.actif && <span className="text-[11px] ml-1">(inactive)</span>}
                    </span>
                    <span className="text-[11px] text-ivory/40">{c.categorie}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 border border-ivory/10 rounded-lg p-4">
            <p className="text-xs text-ivory/50 mb-2">
              Aperçu : {apercu.length} marque{apercu.length > 1 ? "s" : ""} active{apercu.length > 1 ? "s" : ""} dans la sélection
              {apercu.length === 0 && " — l'événement ne s'affichera pas tant qu'il n'y en a aucune"}
            </p>
            <p className="text-sm text-ivory/80">
              {apercu.slice(0, 30).map((c) => c.nom).join(", ")}{apercu.length > 30 ? ` + ${apercu.length - 30} autres` : ""}
            </p>
          </div>

          <label className="flex items-center gap-2 text-sm text-ivory/70 mt-5">
            <input type="checkbox" checked={formulaire.actif} onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })} />
            Activé
          </label>

          <div className="flex gap-3 mt-5">
            <button type="submit" className="bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-gold/90">Enregistrer</button>
            <button type="button" onClick={fermer} className="text-sm text-ivory/60 hover:text-ivory underline">Annuler</button>
          </div>
          {message && <p className="mt-3 text-sm text-gold">{message}</p>}
        </form>
      )}

      <div className="space-y-3">
        {liste.length === 0 && <p className="text-sm text-ivory/50">Aucun événement. Lance le fichier SQL pour créer les événements de base.</p>}
        {liste.map((ev) => (
          <div key={ev.id} className="border border-ivory/10 rounded-xl p-5 flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-ivory font-medium">
                {ev.nom}
                {ev.enCours ? <span className="ml-2 text-xs text-green-400">● affiché en ce moment</span>
                  : !ev.actif ? <span className="ml-2 text-xs text-corail">désactivé</span>
                  : ev.selection.length === 0 ? <span className="ml-2 text-xs text-corail">aucune marque active</span>
                  : null}
              </p>
              <p className="text-xs text-gold/70 mt-1">
                {dateLongue(ev.date)} · dans {ev.joursRestants} jour{ev.joursRestants > 1 ? "s" : ""} · affiché à partir du{" "}
                {new Date(`${ev.debut}T12:00:00Z`).toLocaleDateString("fr-FR", { timeZone: "UTC" })}
              </p>
              <p className="text-xs text-ivory/50 mt-1">
                {ev.selection.length} marque{ev.selection.length > 1 ? "s" : ""} active{ev.selection.length > 1 ? "s" : ""}
                {ev.selection.length > 0 && ` : ${ev.selection.slice(0, 6).map((c) => c.nom).join(", ")}${ev.selection.length > 6 ? "…" : ""}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`/fr/boutique?evenement=${ev.slug}`} target="_blank" rel="noreferrer"
                className="text-xs text-ivory/70 border border-ivory/20 rounded-md px-3 py-1.5 hover:border-gold/40">Voir</a>
              <button onClick={() => ouvrir(ev)} className="text-xs text-gold border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10">Modifier</button>
              <button onClick={() => basculerActif(ev)} className="text-xs text-ivory/50 border border-ivory/10 rounded-md px-3 py-1.5 hover:text-ivory">
                {ev.actif ? "Désactiver" : "Activer"}
              </button>
              <button onClick={() => supprimer(ev)} className="text-xs text-corail/80 border border-ivory/10 rounded-md px-3 py-1.5 hover:text-corail">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
