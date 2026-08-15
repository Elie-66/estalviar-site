"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "../../../../../lib/supabase";
import SelecteurCarte from "../../../components/SelecteurCarte";

const cartes = {
  amazon: { nom: "Amazon", image: "/logos/amazon.svg", couleur: "#1b3a5c" },
  fnac: { nom: "Fnac", image: "/logos/fnac.svg", couleur: "#1b3a5c" },
  steam: { nom: "Steam", image: "/logos/steam.svg", couleur: "#1b3a5c" },
};

const designs = [
  { id: "marque", nom: "Marque", background: (couleur = "#1b3a5c") => `linear-gradient(150deg, ${couleur} 0%, #0d1022 100%)` },
  { id: "or", nom: "Or", background: () => "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)" },
  { id: "ivoire", nom: "Ivoire", background: () => "linear-gradient(150deg, #F6F2E9 0%, #d9cdae 100%)", texteFonce: true },
  { id: "corail", nom: "Corail", background: () => "linear-gradient(150deg, #E5604D 0%, #5B3A5C 100%)" },
  { id: "ambre", nom: "Ambre", background: () => "linear-gradient(150deg, #C9A227 0%, #E5604D 100%)" },
  { id: "vert", nom: "Vert", background: () => "linear-gradient(150deg, #1f5c45 0%, #0d1022 100%)" },
  { id: "rouge", nom: "Rouge", background: () => "linear-gradient(150deg, #9c2b2b 0%, #0d1022 100%)" },
  { id: "rose", nom: "Rose", background: () => "linear-gradient(150deg, #e8a4c4 0%, #6b2f4d 100%)" },
];

export default function ChoisirCarte({ params }) {
  const { slug } = use(params);
  const [cagnotte, setCagnotte] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  const [selections, setSelections] = useState([{ slugCarte: "amazon", designId: "marque", montant: "" }]);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase.from("cagnottes").select("*").eq("slug", slug).single();
      setCagnotte(data);
      setChargement(false);
    };
    charger();
  }, [slug]);

  const totalAlloue = selections.reduce((s, sel) => s + (parseInt(sel.montant) || 0), 0);
  const restant = cagnotte ? cagnotte.montant_collecte - totalAlloue : 0;

  const ajouterLigne = () => {
    setSelections((prev) => [...prev, { slugCarte: "amazon", designId: "marque", montant: "" }]);
  };

  const retirerLigne = (index) => {
    setSelections((prev) => prev.filter((_, i) => i !== index));
  };

  const modifierLigne = (index, champ, valeur) => {
    setSelections((prev) =>
      prev.map((sel, i) => (i === index ? { ...sel, [champ]: valeur } : sel))
    );
  };

  const handleChoisir = async () => {
    setErreur("");

    if (totalAlloue !== cagnotte.montant_collecte) {
      setErreur(`Le total doit être exactement ${cagnotte.montant_collecte} € (actuellement ${totalAlloue} €).`);
      return;
    }

    setEnvoi(true);

    const cartesAEnvoyer = selections.map((sel) => {
      const c = cartes[sel.slugCarte];
      const design = designs.find((d) => d.id === sel.designId);
      return {
        marque: c.nom,
        image: c.image,
        background: design.background(c.couleur),
        texteFonce: !!design.texteFonce,
        montant: parseInt(sel.montant),
      };
    });

    const res = await fetch("/api/finaliser-choix-cagnotte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cagnotteId: cagnotte.id,
        cartes: cartesAEnvoyer,
        origin: window.location.origin,
      }),
    });

    setEnvoi(false);
    if (res.ok) {
      setSucces(true);
    } else {
      setErreur("Une erreur est survenue, réessayez.");
    }
  };

  if (chargement) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  if (!cagnotte || cagnotte.statut !== "attente_choix") {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">Cette page n'est plus disponible</h1>
      </div>
    );
  }

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-semibold text-ivory">Vos cartes arrivent !</h1>
        <p className="mt-4 text-ivory/60">Vous allez les recevoir par email dans quelques instants.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[650px] mx-auto px-6 pt-32 pb-20">
      <div className="text-center">
        <p className="text-sm uppercase tracking-wide text-gold mb-2">Cagnotte clôturée</p>
        <h1 className="text-3xl font-semibold text-ivory mb-2">
          {cagnotte.montant_collecte} € vous attendent
        </h1>
        <p className="text-ivory/60 mb-4">
          Répartissez la somme sur une ou plusieurs cartes cadeaux, et choisissez leur design.
        </p>
        <p className={`text-sm font-medium ${restant === 0 ? "text-vert" : "text-gold"}`}>
          {restant === 0 ? "Montant réparti en entier ✓" : `Reste à répartir : ${restant} €`}
        </p>
      </div>

      <div className="mt-8 space-y-6">
        {selections.map((sel, index) => {
          const carteActuelle = cartes[sel.slugCarte];
          const designActuel = designs.find((d) => d.id === sel.designId);

          return (
            <div key={index} className="border border-ivory/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-ivory/50">Carte {index + 1}</span>
                {selections.length > 1 && (
                  <button
                    onClick={() => retirerLigne(index)}
                    className="text-xs text-ivory/40 hover:text-corail transition-colors"
                  >
                    Retirer
                  </button>
                )}
              </div>

              <div
                className="rounded-xl p-5 aspect-[1.6/1] flex flex-col justify-between mb-4 border border-gold/20"
                style={{ background: designActuel.background(carteActuelle.couleur) }}
              >
                <img
                  src={carteActuelle.image}
                  alt={carteActuelle.nom}
                  className="h-6 object-contain drop-shadow-md"
                />
                <p className={`text-2xl font-semibold ${designActuel.texteFonce ? "text-ink" : "text-white"}`}>
                  {sel.montant || 0} <span className="text-gold text-sm">€</span>
                </p>
              </div>

              <label className="block text-sm text-ivory/70 mb-2">Enseigne</label>
              <SelecteurCarte
                cartes={cartes}
                valeur={sel.slugCarte}
                onChange={(slug) => modifierLigne(index, "slugCarte", slug)}
              />

              <label className="block text-sm text-ivory/70 mb-2 mt-4">Design</label>
              <div className="grid grid-cols-4 gap-2">
                {designs.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => modifierLigne(index, "designId", d.id)}
                    title={d.nom}
                    className={`h-9 rounded-lg border-2 transition-all ${
                      sel.designId === d.id ? "border-gold scale-105" : "border-transparent opacity-70"
                    }`}
                    style={{ background: d.background(carteActuelle.couleur) }}
                  />
                ))}
              </div>

              <label className="block text-sm text-ivory/70 mb-2 mt-4">Montant pour cette carte (€)</label>
              <input
                type="number"
                min="1"
                value={sel.montant}
                onChange={(e) => modifierLigne(index, "montant", e.target.value)}
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={ajouterLigne}
        className="mt-4 text-sm text-gold hover:underline"
      >
        + Ajouter une autre carte
      </button>

      <button
        onClick={handleChoisir}
        disabled={envoi || restant !== 0}
        className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
      >
        {envoi ? "Envoi..." : "Recevoir mes cartes"}
      </button>

      {erreur && <p className="mt-3 text-sm text-corail text-center">{erreur}</p>}
    </div>
  );
}