"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

export default function AdminCagnottes() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [cagnottes, setCagnottes] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState("toutes");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);

      const { data } = await supabase
        .from("cagnottes")
        .select("*")
        .order("created_at", { ascending: false });

      setCagnottes(data || []);
      setChargement(false);
    };
    verifier();
  }, []);

  const statutLabel = {
    ouverte: "Ouverte",
    complete: "Objectif atteint",
    attente_choix: "En attente de choix",
    cloturee: "Clôturée",
  };

  const cagnottesFiltrees = cagnottes.filter((c) => {
    const matchStatut = filtreStatut === "toutes" || c.statut === filtreStatut;
    const matchRecherche =
      !recherche ||
      c.beneficiaire?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email_createur?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.marque?.toLowerCase().includes(recherche.toLowerCase());
    return matchStatut && matchRecherche;
  });

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Cagnottes</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (bénéficiaire, email, marque)..."
          className="flex-1 bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        >
          <option value="toutes" className="bg-ink">Tous les statuts</option>
          <option value="ouverte" className="bg-ink">Ouverte</option>
          <option value="attente_choix" className="bg-ink">En attente de choix</option>
          <option value="cloturee" className="bg-ink">Clôturée</option>
        </select>
      </div>

      <p className="text-sm text-ivory/50 mb-4">{cagnottesFiltrees.length} cagnotte(s)</p>

      <div className="space-y-3">
        {cagnottesFiltrees.map((c) => (
          <a
            key={c.id}
            href={`/fr/cagnotte/${c.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-ivory/10 rounded-lg p-4 hover:border-gold/30 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-ivory font-medium">Pour {c.beneficiaire}</p>
                <p className="text-sm text-ivory/50">{c.email_createur}</p>
                <p className="text-xs text-ivory/40 mt-1">
                  {c.marque} {c.carte_choisie ? "" : "(à choisir)"}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-ivory font-semibold">
                  {c.montant_collecte} € {!c.montant_libre && `/ ${c.montant_objectif} €`}
                </p>
                <span className="text-xs text-gold/70">{statutLabel[c.statut] || c.statut}</span>
                {c.date_fin && (
                  <p className="text-xs text-ivory/40 mt-1">
                    Clôture {new Date(c.date_fin).toLocaleDateString("fr-FR")}
                  </p>
                )}
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}