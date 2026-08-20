"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

const vide = {
  nom: "",
  date_jour: "",
  date_mois: "",
  sujet: "",
  titre: "",
  message: "",
  actif: true,
};

export default function AdminOccasions() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [occasions, setOccasions] = useState([]);
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
      .from("occasions")
      .select("*")
      .order("date_mois", { ascending: true })
      .order("date_jour", { ascending: true });
    setOccasions(data || []);
  };

  const ouvrirEdition = (occ) => {
    setIdEnEdition(occ.id);
    setFormulaire(occ);
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

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnregistrement(true);
    setErreur("");

    const donnees = {
      nom: formulaire.nom.trim(),
      date_jour: parseInt(formulaire.date_jour),
      date_mois: parseInt(formulaire.date_mois),
      sujet: formulaire.sujet.trim(),
      titre: formulaire.titre.trim(),
      message: formulaire.message.trim(),
      actif: formulaire.actif,
    };

    let resultat;
    if (idEnEdition === "nouveau") {
      resultat = await supabase.from("occasions").insert(donnees);
    } else {
      resultat = await supabase.from("occasions").update(donnees).eq("id", idEnEdition);
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
    await supabase.from("occasions").delete().eq("id", id);
    await charger();
  };

  const basculerActif = async (occ) => {
    await supabase.from("occasions").update({ actif: !occ.actif }).eq("id", occ.id);
    await charger();
  };

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const mois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Occasions & emails automatiques</h1>

      {idEnEdition && (
        <form onSubmit={enregistrer} className="border border-gold/30 rounded-xl p-6 mb-10">
          <h2 className="text-lg font-semibold text-ivory mb-4">
            {idEnEdition === "nouveau" ? "Ajouter une occasion" : "Modifier l'occasion"}
          </h2>

          <label className="block text-xs text-ivory/60 mb-1">Nom (usage interne)</label>
          <input
            type="text"
            value={formulaire.nom}
            onChange={(e) => setFormulaire({ ...formulaire, nom: e.target.value })}
            required
            placeholder="ex: Noël"
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Jour</label>
              <input
                type="number"
                min="1"
                max="31"
                value={formulaire.date_jour}
                onChange={(e) => setFormulaire({ ...formulaire, date_jour: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-ivory/60 mb-1">Mois</label>
              <select
                value={formulaire.date_mois}
                onChange={(e) => setFormulaire({ ...formulaire, date_mois: e.target.value })}
                required
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              >
                <option value="" className="bg-ink">Choisir</option>
                {mois.map((m, i) => (
                  <option key={m} value={i + 1} className="bg-ink">{m}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="block text-xs text-ivory/60 mb-1 mt-4">Sujet de l'email</label>
          <input
            type="text"
            value={formulaire.sujet}
            onChange={(e) => setFormulaire({ ...formulaire, sujet: e.target.value })}
            required
            placeholder="ex: 🎄 Le cadeau parfait pour Noël"
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />

          <label className="block text-xs text-ivory/60 mb-1 mt-4">Titre affiché</label>
          <input
            type="text"
            value={formulaire.titre}
            onChange={(e) => setFormulaire({ ...formulaire, titre: e.target.value })}
            required
            placeholder="ex: Joyeux Noël !"
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />

          <label className="block text-xs text-ivory/60 mb-1 mt-4">Message</label>
          <textarea
            value={formulaire.message}
            onChange={(e) => setFormulaire({ ...formulaire, message: e.target.value })}
            required
            rows={3}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm resize-none"
          />

          <label className="flex items-center gap-2 text-sm text-ivory/70 mt-4">
            <input
              type="checkbox"
              checked={formulaire.actif}
              onChange={(e) => setFormulaire({ ...formulaire, actif: e.target.checked })}
            />
            Active
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
          + Ajouter une occasion
        </button>
      )}

      <div className="space-y-3">
        {occasions.map((occ) => (
          <div
            key={occ.id}
            className={`border rounded-lg p-4 flex items-center justify-between ${
              occ.actif ? "border-ivory/10" : "border-ivory/5 opacity-50"
            }`}
          >
            <div>
              <p className="text-ivory font-medium">{occ.nom}</p>
              <p className="text-xs text-ivory/50">
                {occ.date_jour} {mois[occ.date_mois - 1]}
                {occ.derniere_execution && ` — envoyé le ${new Date(occ.derniere_execution).toLocaleDateString("fr-FR")}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => basculerActif(occ)}
                className={`text-xs rounded-full px-2.5 py-1 ${
                  occ.actif ? "bg-vert/20 text-vert" : "bg-ivory/10 text-ivory/50"
                }`}
              >
                {occ.actif ? "Active" : "Inactive"}
              </button>
              <button
                onClick={() => ouvrirEdition(occ)}
                className="text-xs text-gold hover:underline"
              >
                Modifier
              </button>
              <button
                onClick={() => supprimer(occ.id)}
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