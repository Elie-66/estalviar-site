"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

const paliers = [
  { nom: "Bronze", seuil: 0, couleur: "#B08D57", avantage: "Accès au programme dès votre première commande" },
  { nom: "Argent", seuil: 100, couleur: "#C0C0C0", avantage: "Avantages exclusifs à venir" },
  { nom: "Or", seuil: 300, couleur: "#C9A227", avantage: "Avantages exclusifs à venir" },
  { nom: "Platine", seuil: 700, couleur: "#E5E4E2", avantage: "Avantages exclusifs à venir" },
];

export default function Fidelite() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [points, setPoints] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUtilisateur(user);

      if (user) {
        const { data: profil } = await supabase
          .from("profils")
          .select("points")
          .eq("id", user.id)
          .single();

        setPoints(profil?.points || 0);
      }
      setChargement(false);
    };

    charger();
  }, []);

  const palierActuel = utilisateur
    ? [...paliers].reverse().find((p) => points >= p.seuil) || paliers[0]
    : null;

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Programme de fidélité</p>
      <h1 className="text-4xl font-semibold text-ivory leading-tight">
        Plus vous offrez, plus vous êtes récompensé.
      </h1>
      <p className="mt-6 text-ivory/70 leading-relaxed max-w-xl">
        Chaque euro dépensé sur Estalviar vous rapporte 1 point de fidélité. Cumulez les points pour grimper les paliers et débloquer des avantages exclusifs.
      </p>

      {!chargement && utilisateur && (
        <div className="mt-8 border border-gold/30 bg-gold/5 rounded-xl p-5 inline-block">
          <p className="text-sm text-ivory/60">Votre statut actuel</p>
          <div className="flex items-center gap-3 mt-1">
            <span
              className="text-xs uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${palierActuel.couleur}20`, color: palierActuel.couleur }}
            >
              {palierActuel.nom}
            </span>
            <span className="text-ivory font-semibold">{points} points</span>
          </div>
        </div>
      )}

      {!chargement && !utilisateur && (
        <a
          href="/fr/inscription"
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
        >
          Créer un compte pour commencer
        </a>
      )}

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {paliers.map((p) => (
          <div
            key={p.nom}
            className="border rounded-xl p-5"
            style={{
              borderColor: palierActuel?.nom === p.nom ? p.couleur : "rgba(246,242,233,0.1)",
            }}
          >
            <span
              className="text-xs uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${p.couleur}20`, color: p.couleur }}
            >
              {p.nom}
            </span>
            <p className="mt-3 text-ivory text-sm">
              {p.seuil === 0 ? "Dès le départ" : `À partir de ${p.seuil} points`}
            </p>
            <p className="mt-2 text-xs text-ivory/50">{p.avantage}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 border-t border-ivory/10 pt-8">
        <h2 className="text-lg font-semibold text-ivory mb-4">Comment ça marche</h2>
        <ol className="space-y-2 text-sm text-ivory/60 list-decimal list-inside">
          <li>Créez un compte gratuitement</li>
          <li>Chaque commande payée vous rapporte 1 point par euro dépensé</li>
          <li>Vos points s'accumulent automatiquement et débloquent les paliers</li>
        </ol>
      </div>
    </div>
  );
}