"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

export default function AdminCommandes() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState("toutes");
  const [filtreType, setFiltreType] = useState("toutes");
  const [recherche, setRecherche] = useState("");
  const [modificationEnCours, setModificationEnCours] = useState(null);
  const [codesDechiffres, setCodesDechiffres] = useState({});

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
        .order("created_at", { ascending: false });

      setCommandes(data || []);

      const items = (data || [])
        .filter((c) => c.code)
        .map((c) => ({ id: c.id, code: c.code }));

      if (items.length > 0) {
        const res = await fetch("/api/dechiffrer-commandes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const { resultats } = await res.json();
        const map = {};
        resultats.forEach((r) => { map[r.id] = r.code; });
        setCodesDechiffres(map);
      }

      setChargement(false);
    };
    verifier();
  }, []);

  const changerStatut = async (commandeId, nouveauStatut) => {
    setModificationEnCours(commandeId);
    const { error } = await supabase
      .from("commandes")
      .update({ statut: nouveauStatut })
      .eq("id", commandeId);

    if (!error) {
      setCommandes((prev) =>
        prev.map((c) => (c.id === commandeId ? { ...c, statut: nouveauStatut } : c))
      );
    }
    setModificationEnCours(null);
  };

  const statutLabel = {
    payee: "Payée",
    a_programmer: "Programmée",
    annulee: "Annulée",
    remboursee: "Remboursée",
    litige: "En litige",
  };

  const statutCouleur = {
    payee: "text-vert",
    a_programmer: "text-gold",
    annulee: "text-ivory/40",
    remboursee: "text-corail",
    litige: "text-corail",
  };

  const commandesFiltrees = commandes.filter((c) => {
    const matchStatut = filtreStatut === "toutes" || c.statut === filtreStatut;
    const matchRecherche =
      !recherche ||
      c.email_acheteur?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email_beneficiaire?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.email_destinataire?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.marque?.toLowerCase().includes(recherche.toLowerCase());

    const estCagnotte = c.marque?.startsWith("Cagnotte");
    const matchType =
      filtreType === "toutes" ||
      (filtreType === "cagnotte" && estCagnotte) ||
      (filtreType === "avec_beneficiaire" && !estCagnotte && !!c.beneficiaire) ||
      (filtreType === "sans_beneficiaire" && !estCagnotte && !c.beneficiaire);

    return matchStatut && matchRecherche && matchType;
  });

  const exporterCSV = () => {
    const entetes = ["Date", "Marque", "Montant", "Email acheteur", "Email destinataire", "Bénéficiaire", "Statut", "Code"];
    const lignes = commandesFiltrees.map((c) => [
      new Date(c.created_at).toLocaleDateString("fr-FR"),
      c.marque,
      c.montant,
      c.email_acheteur,
      c.email_destinataire || "",
      c.beneficiaire || "",
      statutLabel[c.statut] || c.statut,
      codesDechiffres[c.id] || "",
    ]);

    const contenu = [entetes, ...lignes]
      .map((ligne) => ligne.map((valeur) => `"${String(valeur).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + contenu], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
    lien.href = url;
    lien.download = `commandes-estalviar-${new Date().toISOString().split("T")[0]}.csv`;
    lien.click();
    URL.revokeObjectURL(url);
  };

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Commandes</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher (email, marque)..."
          className="flex-1 bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        />
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        >
          <option value="toutes" className="bg-ink">Tous les statuts</option>
          <option value="payee" className="bg-ink">Payée</option>
          <option value="a_programmer" className="bg-ink">Programmée</option>
          <option value="annulee" className="bg-ink">Annulée</option>
          <option value="remboursee" className="bg-ink">Remboursée</option>
          <option value="litige" className="bg-ink">En litige</option>
        </select>
        <select
          value={filtreType}
          onChange={(e) => setFiltreType(e.target.value)}
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        >
          <option value="toutes" className="bg-ink">Tous les types</option>
          <option value="avec_beneficiaire" className="bg-ink">Avec bénéficiaire</option>
          <option value="sans_beneficiaire" className="bg-ink">Sans bénéficiaire</option>
          <option value="cagnotte" className="bg-ink">Cagnotte</option>
        </select>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-ivory/50">{commandesFiltrees.length} commande(s)</p>
        <button
          onClick={exporterCSV}
          disabled={commandesFiltrees.length === 0}
          className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors disabled:opacity-30"
        >
          Exporter en CSV
        </button>
      </div>

      <div className="space-y-3">
        {commandesFiltrees.map((c) => (
          <div key={c.id} className="border border-ivory/10 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-ivory font-medium">{c.marque} — {c.montant} €</p>
                <p className="text-sm text-ivory/50">{c.email_acheteur}</p>
                {c.email_destinataire && c.email_destinataire !== c.email_acheteur && (
                  <p className="text-xs text-ivory/40">Destinataire : {c.email_destinataire}</p>
                )}
                {c.beneficiaire && (
                  <p className="text-sm text-ivory/50">Pour {c.beneficiaire}</p>
                )}
                {c.code && (
                  <p className="text-xs text-gold/70 mt-1 font-mono">{codesDechiffres[c.id] || "..."}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <select
                  value={c.statut}
                  onChange={(e) => changerStatut(c.id, e.target.value)}
                  disabled={modificationEnCours === c.id}
                  className={`text-xs bg-transparent border border-ivory/20 rounded px-2 py-1 ${statutCouleur[c.statut] || "text-ivory/70"}`}
                >
                  {Object.entries(statutLabel).map(([val, label]) => (
                    <option key={val} value={val} className="bg-ink text-ivory">
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-ivory/40 mt-1">
                  {new Date(c.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}