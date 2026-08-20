"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

export default function AdminStatistiques() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [marquesSelectionnees, setMarquesSelectionnees] = useState(new Set());
  const [periode, setPeriode] = useState("total");

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);

      const { data } = await supabase
        .from("commandes")
        .select("*")
        .eq("statut", "payee")
        .order("created_at", { ascending: true });

      setCommandes(data || []);
      const toutesMarques = new Set((data || []).map((c) => c.marque));
      setMarquesSelectionnees(toutesMarques);
      setChargement(false);
    };
    verifier();
  }, []);

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const toutesMarques = Array.from(new Set(commandes.map((c) => c.marque))).sort();

  const basculerMarque = (marque) => {
    setMarquesSelectionnees((prev) => {
      const nouveau = new Set(prev);
      if (nouveau.has(marque)) {
        nouveau.delete(marque);
      } else {
        nouveau.add(marque);
      }
      return nouveau;
    });
  };

  const dansLaPeriode = (dateStr) => {
    if (periode === "total") return true;
    const date = new Date(dateStr);
    const maintenant = new Date();

    if (periode === "jour") {
      return date.toDateString() === maintenant.toDateString();
    }
    if (periode === "semaine") {
      const debutSemaine = new Date(maintenant);
      debutSemaine.setDate(maintenant.getDate() - 7);
      return date >= debutSemaine;
    }
    if (periode === "mois") {
      return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
    }
    if (periode === "annee") {
      return date.getFullYear() === maintenant.getFullYear();
    }
    return true;
  };

  const commandesFiltrees = commandes.filter(
    (c) => marquesSelectionnees.has(c.marque) && dansLaPeriode(c.created_at)
  );

  // Ventes par jour pour le graphique
  const parJour = {};
  commandesFiltrees.forEach((c) => {
    const jour = new Date(c.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
    parJour[jour] = (parJour[jour] || 0) + c.montant;
  });
  const donneesGraphique = Object.entries(parJour).map(([jour, montant]) => ({ jour, montant }));

  const totalCA = commandesFiltrees.reduce((s, c) => s + c.montant, 0);
  const nombreCommandes = commandesFiltrees.length;
  const panierMoyen = nombreCommandes > 0 ? (totalCA / nombreCommandes).toFixed(2) : 0;

  // Top marques
  const parMarque = {};
  commandesFiltrees.forEach((c) => {
    if (!parMarque[c.marque]) parMarque[c.marque] = { montant: 0, nombre: 0 };
    parMarque[c.marque].montant += c.montant;
    parMarque[c.marque].nombre += 1;
  });
  const topMarques = Object.entries(parMarque)
    .sort((a, b) => b[1].montant - a[1].montant)
    .slice(0, 5);

  // Top clients (par email acheteur)
  const parClient = {};
  commandesFiltrees.forEach((c) => {
    if (!c.email_acheteur) return;
    if (!parClient[c.email_acheteur]) parClient[c.email_acheteur] = { montant: 0, nombre: 0 };
    parClient[c.email_acheteur].montant += c.montant;
    parClient[c.email_acheteur].nombre += 1;
  });
  const topClients = Object.entries(parClient)
    .sort((a, b) => b[1].montant - a[1].montant)
    .slice(0, 5);

  const periodes = [
    { id: "jour", label: "Jour" },
    { id: "semaine", label: "Semaine" },
    { id: "mois", label: "Mois" },
    { id: "annee", label: "Année" },
    { id: "total", label: "Total" },
  ];

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Statistiques</h1>

      <div className="flex gap-2 border border-ivory/10 rounded-lg p-1 mb-8 w-fit">
        {periodes.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriode(p.id)}
            className={`text-sm px-4 py-1.5 rounded-md transition-colors ${
              periode === p.id ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mb-8">
        <p className="text-sm text-ivory/70 mb-3">Filtrer par enseigne</p>
        <div className="flex flex-wrap gap-2">
          {toutesMarques.map((marque) => (
            <button
              key={marque}
              onClick={() => basculerMarque(marque)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                marquesSelectionnees.has(marque)
                  ? "border-gold bg-gold/10 text-gold"
                  : "border-ivory/20 text-ivory/50"
              }`}
            >
              {marque}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Chiffre d'affaires</p>
          <p className="text-2xl font-semibold text-gold mt-1">{totalCA} €</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Commandes</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{nombreCommandes}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Panier moyen</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{panierMoyen} €</p>
        </div>
      </div>

      <div className="border border-ivory/10 rounded-xl p-5 mb-10">
        <p className="text-sm text-ivory/70 mb-4">Évolution des ventes</p>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={donneesGraphique}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(246,242,233,0.1)" />
              <XAxis dataKey="jour" stroke="rgba(246,242,233,0.4)" fontSize={12} />
              <YAxis stroke="rgba(246,242,233,0.4)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#1A2039", border: "1px solid rgba(201,162,39,0.3)", borderRadius: 8 }}
                labelStyle={{ color: "#F6F2E9" }}
              />
              <Line type="monotone" dataKey="montant" stroke="#C9A227" strokeWidth={2} dot={{ fill: "#C9A227" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <p className="text-sm text-ivory/70 mb-4">Top enseignes</p>
          {topMarques.length === 0 ? (
            <p className="text-sm text-ivory/40">Aucune donnée sur cette période.</p>
          ) : (
            <div className="space-y-2">
              {topMarques.map(([marque, data]) => (
                <div key={marque} className="flex justify-between text-sm border-b border-ivory/5 pb-2">
                  <span className="text-ivory">{marque} <span className="text-ivory/40">({data.nombre})</span></span>
                  <span className="text-gold">{data.montant} €</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm text-ivory/70 mb-4">Top clients</p>
          {topClients.length === 0 ? (
            <p className="text-sm text-ivory/40">Aucune donnée sur cette période.</p>
          ) : (
            <div className="space-y-2">
              {topClients.map(([email, data]) => (
                <div key={email} className="flex justify-between text-sm border-b border-ivory/5 pb-2">
                  <span className="text-ivory truncate max-w-[200px]">{email} <span className="text-ivory/40">({data.nombre}x)</span></span>
                  <span className="text-gold">{data.montant} €</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}