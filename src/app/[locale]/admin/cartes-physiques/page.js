"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

export default function AdminCartesPhysiques() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [cartes, setCartes] = useState([]);
  const [nombreACreer, setNombreACreer] = useState(1);
  const [creation, setCreation] = useState(false);
  const [nouveauxCodes, setNouveauxCodes] = useState([]);

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
    const res = await fetch("/api/admin-cartes-physiques");
    const data = await res.json();
    setCartes(data.cartes || []);
  };

  const creerCartes = async () => {
    setCreation(true);
    setNouveauxCodes([]);
    const res = await fetch("/api/admin-cartes-physiques", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: nombreACreer }),
    });
    const data = await res.json();
    setNouveauxCodes(data.codes || []);
    await charger();
    setCreation(false);
  };

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const statutLabel = { inactive: "Non liée", active: "Liée" };

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Cartes physiques</h1>

      <div className="border border-gold/30 rounded-xl p-6 mb-10">
        <h2 className="text-lg font-semibold text-ivory mb-4">Générer des codes</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="100"
            value={nombreACreer}
            onChange={(e) => setNombreACreer(e.target.value)}
            className="w-24 bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
          />
          <button
            onClick={creerCartes}
            disabled={creation}
            className="bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {creation ? "Génération..." : "Générer"}
          </button>
        </div>

        {nouveauxCodes.length > 0 && (
          <div className="mt-4 bg-vert/10 border border-vert/30 rounded-lg p-4">
            <p className="text-xs text-vert mb-2">
              {nouveauxCodes.length} code(s) généré(s) — notez-les avant de fermer, ils ne seront plus affichés en clair ensuite :
            </p>
            <div className="space-y-1 font-mono text-sm text-ivory">
              {nouveauxCodes.map((code, i) => (
                <p key={i}>{code}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-sm text-ivory/50 mb-4">{cartes.length} carte(s) au total</p>

      <div className="space-y-3">
        {cartes.map((c) => (
          <div key={c.id} className="border border-ivory/10 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-ivory font-medium">{c.solde} €</p>
              <p className="text-xs text-ivory/50">{c.email_lie || "Aucun compte lié"}</p>
            </div>
            <span className={`text-xs rounded-full px-2.5 py-1 ${c.statut === "active" ? "bg-vert/20 text-vert" : "bg-ivory/10 text-ivory/50"}`}>
              {statutLabel[c.statut]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}