"use client";

import { use, useState, useEffect } from "react";
import { usePanier } from "../../context/PanierContext";
import { supabase } from "../../../../lib/supabase";
import SelecteurCarte from "../../components/SelecteurCarte";

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

export default function FicheCarte({ params }) {
  const { slug } = use(params);
  const { ajouterArticle } = usePanier();

  const [carte, setCarte] = useState(null);
  const [autresCartes, setAutresCartes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [montant, setMontant] = useState(0);
  const [beneficiaire, setBeneficiaire] = useState("");
  const [message, setMessage] = useState("");
  const [designId, setDesignId] = useState("marque");
  const [jourEnvoi, setJourEnvoi] = useState("");
  const [moisEnvoi, setMoisEnvoi] = useState("");
  const [anneeEnvoi, setAnneeEnvoi] = useState("");
  const [heureEnvoi, setHeureEnvoi] = useState("");
  const [minuteEnvoi, setMinuteEnvoi] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .eq("slug", slug)
        .eq("actif", true)
        .single();

      setCarte(data);
      if (data) setMontant(data.montant_min);

      const { data: autres } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .neq("slug", slug)
        .order("ordre", { ascending: true })
        .limit(2);

      setAutresCartes(autres || []);
      setChargement(false);
    };
    charger();
  }, [slug]);

  if (chargement) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  if (!carte) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory">
        Carte introuvable.
      </div>
    );
  }

  const design = designs.find((d) => d.id === designId) ?? designs[0];
  const texteFonce = !!design.texteFonce;
  const couleurTexte = texteFonce ? "text-ink" : "text-white";
  const couleurTexteAtt = texteFonce ? "text-ink/60" : "text-white/60";
  const couleurTexteAtt2 = texteFonce ? "text-ink/40" : "text-white/40";
  const backgroundActuel = design.background(carte.couleur);

  const aujourdHui = new Date();
  const annees = [aujourdHui.getFullYear(), aujourdHui.getFullYear() + 1];
  const mois = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
  ];
  const jours = Array.from({ length: 31 }, (_, i) => i + 1);
  const heures = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const dateEnvoiComplete =
    jourEnvoi && moisEnvoi && anneeEnvoi
      ? `${anneeEnvoi}-${String(Number(moisEnvoi) + 1).padStart(2, "0")}-${String(jourEnvoi).padStart(2, "0")}`
      : null;
  const heureEnvoiComplete =
    dateEnvoiComplete ? `${heureEnvoi || "09"}:${minuteEnvoi || "00"}` : null;

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

      <div className="sticky top-28">
        <div
          className="relative overflow-hidden rounded-2xl p-8 aspect-[1.6/1] flex flex-col justify-between border border-gold/30"
          style={{
            background: backgroundActuel,
            boxShadow: `0 25px 60px -15px #00000066, 0 0 0 1px rgba(255,255,255,0.03)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)",
            }}
          />

          <div className="relative flex items-center justify-between">
            <img
              src={carte.image}
              alt={carte.nom}
              className="h-10 object-contain opacity-95 drop-shadow-md"
            />
            <span className={`text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-space-mono)] ${texteFonce ? "text-ink/50" : "text-gold/70"}`}>
              Estalviar
            </span>
          </div>

          <div className="relative">
            {(beneficiaire || message) && (
              <div className="mb-4">
                {beneficiaire && (
                  <p className={`text-sm font-medium ${couleurTexte}`}>Pour {beneficiaire}</p>
                )}
                {message && (
                  <p className={`text-sm italic line-clamp-2 max-w-[85%] mt-0.5 ${couleurTexteAtt}`}>"{message}"</p>
                )}
              </div>
            )}

            <div className={`h-px mb-4 ${texteFonce ? "bg-ink/20" : "bg-gradient-to-r from-gold/40 via-gold/10 to-transparent"}`} />

            <div className="flex items-end justify-between">
              <p className={`text-5xl font-semibold tracking-tight font-[family-name:var(--font-fraunces)] ${couleurTexte}`}>
                {montant || 0}<span className="text-2xl text-gold ml-1">€</span>
              </p>
              <span className={`text-[10px] font-[family-name:var(--font-space-mono)] tracking-wider ${couleurTexteAtt2}`}>
                •••• •••• ••••
              </span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ivory/30 font-[family-name:var(--font-space-mono)] uppercase tracking-wide">
          Aperçu — le rendu final peut légèrement varier
        </p>

        <div className="mt-6">
          <label className="block text-sm text-ivory/70 mb-3">Choisissez un design</label>
          <div className="grid grid-cols-4 gap-3">
            {designs.map((d) => (
              <button
                key={d.id}
                onClick={() => setDesignId(d.id)}
                title={d.nom}
                className={`h-12 rounded-lg border-2 transition-all ${
                  designId === d.id ? "border-gold scale-105" : "border-transparent opacity-70 hover:opacity-100"
                }`}
                style={{ background: d.background(carte.couleur) }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 bg-ink-secondary/50 border border-ivory/10 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wide text-gold mb-2">Comment ça marche</p>
          <ol className="text-sm text-ivory/60 space-y-1 list-decimal list-inside">
            <li>Choisissez le montant et personnalisez votre carte</li>
            <li>Payez en ligne de façon sécurisée</li>
            <li>Recevez le code par email, immédiatement ou à la date choisie</li>
          </ol>
        </div>

        {autresCartes.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm text-ivory/70 mb-3">Vous pourriez aussi aimer</label>
            <div className="grid grid-cols-2 gap-3">
              {autresCartes.map((c) => (
                <a
                  key={c.slug}
                  href={`/fr/boutique/${c.slug}`}
                  className="border border-ivory/10 rounded-lg p-3 flex items-center gap-3 hover:border-gold/40 transition-colors"
                >
                  <div className="bg-white rounded-md p-1.5 flex-shrink-0">
                    <img src={c.image} alt={c.nom} className="h-4 object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-ivory text-sm font-medium truncate">{c.nom}</p>
                    <p className="text-ivory/40 text-xs">dès {c.montant_min} €</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <p className="text-sm uppercase tracking-wide text-gold mb-2">Carte cadeau</p>
        <h1 className="text-4xl font-semibold text-ivory">{carte.nom}</h1>
        <p className="mt-4 text-ivory/70 leading-relaxed">{carte.description}</p>

        <div className="mt-10">
          <label className="block text-sm text-ivory/70 mb-3">Choisissez un montant</label>
          <div className="grid grid-cols-4 gap-3">
            {carte.suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setMontant(s)}
                className={`border rounded-lg py-3 transition-colors ${
                  montant === s
                    ? "border-gold text-gold"
                    : "border-ivory/20 text-ivory hover:border-gold hover:text-gold"
                }`}
              >
                {s} €
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-ivory/40">
            Montant libre entre {carte.montant_min} € et {carte.montant_max} €
          </p>
          <input
            type="number"
            min={carte.montant_min}
            max={carte.montant_max}
            value={montant}
            onChange={(e) => setMontant(Number(e.target.value))}
            className="mt-2 w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />
        </div>

        <div className="mt-8">
          <label className="block text-sm text-ivory/70 mb-2">Nom du bénéficiaire (facultatif)</label>
          <input
            type="text"
            value={beneficiaire}
            onChange={(e) => setBeneficiaire(e.target.value)}
            placeholder="Ex : Camille"
            maxLength={30}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm text-ivory/70">Message (facultatif)</label>
            <span className="text-xs text-ivory/40">{message.length}/40</span>
          </div>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Joyeux anniversaire !"
            maxLength={40}
            rows={3}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory resize-none"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm text-ivory/70 mb-2">Date et heure d'envoi (facultatif)</label>

          <div className="grid grid-cols-3 gap-3">
            <select
              value={jourEnvoi}
              onChange={(e) => setJourEnvoi(e.target.value)}
              className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
            >
              <option value="" className="bg-ink">Jour</option>
              {jours.map((j) => (
                <option key={j} value={j} className="bg-ink">{j}</option>
              ))}
            </select>

            <select
              value={moisEnvoi}
              onChange={(e) => setMoisEnvoi(e.target.value)}
              className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
            >
              <option value="" className="bg-ink">Mois</option>
              {mois.map((m, i) => (
                <option key={m} value={i} className="bg-ink">{m}</option>
              ))}
            </select>

            <select
              value={anneeEnvoi}
              onChange={(e) => setAnneeEnvoi(e.target.value)}
              className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
            >
              <option value="" className="bg-ink">Année</option>
              {annees.map((a) => (
                <option key={a} value={a} className="bg-ink">{a}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <select
              value={heureEnvoi}
              onChange={(e) => setHeureEnvoi(e.target.value)}
              disabled={!dateEnvoiComplete}
              className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm disabled:opacity-30"
            >
              <option value="" className="bg-ink">Heure</option>
              {heures.map((h) => (
                <option key={h} value={h} className="bg-ink">{h} h</option>
              ))}
            </select>

            <select
              value={minuteEnvoi}
              onChange={(e) => setMinuteEnvoi(e.target.value)}
              disabled={!dateEnvoiComplete}
              className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm disabled:opacity-30"
            >
              <option value="" className="bg-ink">Minutes</option>
              {minutes.map((m) => (
                <option key={m} value={m} className="bg-ink">{m} min</option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs text-ivory/40">
            Laissez vide pour un envoi immédiat après paiement.
          </p>
        </div>

        <button
          onClick={() => {
            ajouterArticle({
              marque: carte.nom,
              montant,
              beneficiaire,
              message,
              design: design.nom,
              image: carte.image,
              background: backgroundActuel,
              texteFonce,
              dateEnvoi: dateEnvoiComplete,
              heureEnvoi: heureEnvoiComplete,
            });
            setConfirmationVisible(true);
            setTimeout(() => setConfirmationVisible(false), 2500);
          }}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors"
        >
          Ajouter au panier
        </button>

        {confirmationVisible && (
          <div className="mt-3 flex items-center gap-2 text-sm text-vert bg-vert/10 border border-vert/30 rounded-lg px-4 py-3">
            <span>✓</span>
            <span>Ajoutée au panier !</span>
          </div>
        )}
      </div>

    </div>
  );
}