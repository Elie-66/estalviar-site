"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { peutVoir } from "../../../../lib/accesAdmin";
import { adminLire, adminModifier } from "../../../../lib/adminDb";
import { fetchAdmin } from "../../../../lib/fetchAdmin";

// Suivi de l'email de chaque carte (mis à jour par Resend)
const SUIVI = {
  programme: ["Envoi programmé", "text-gold/80"],
  envoye: ["Envoyé", "text-ivory/55"],
  retarde: ["Livraison retardée", "text-gold"],
  delivre: ["Délivré", "text-vert"],
  ouvert: ["Ouvert", "text-vert"],
  clique: ["Ouvert", "text-vert"],
  rejete: ["Non livré", "text-corail"],
  signale: ["Signalé comme indésirable", "text-corail"],
};
const PROBLEMES = ["rejete", "signale", "retarde"];

export default function AdminCommandes() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [commandes, setCommandes] = useState([]);
  const [filtreStatut, setFiltreStatut] = useState("toutes");
  const [filtreType, setFiltreType] = useState("toutes");
  const [filtreEnvoi, setFiltreEnvoi] = useState("tous");
  const [renvoi, setRenvoi] = useState(null); // { id, email, enCours, erreur }
  const [recherche, setRecherche] = useState("");
  const [modificationEnCours, setModificationEnCours] = useState(null);
  const [codesDechiffres, setCodesDechiffres] = useState({});
  const [codesVisibles, setCodesVisibles] = useState(false);

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !(await peutVoir("commandes"))) {
        window.location.href = user ? "/fr/admin" : "/fr";
        return;
      }
      setAutorise(true);

      const { data } = await adminLire("commandes", "created_at", false);

      setCommandes(data || []);

      const items = (data || [])
        .filter((c) => c.code)
        .map((c) => ({ id: c.id, code: c.code }));

      const voitLesCodes = await peutVoir("codes");
      setCodesVisibles(voitLesCodes);
      if (items.length > 0 && voitLesCodes) {
        const res = await fetchAdmin("/api/dechiffrer-commandes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items }),
        });
        const { resultats = [] } = await res.json().catch(() => ({}));
        const map = {};
        resultats.forEach((r) => { map[r.id] = r.code; });
        setCodesDechiffres(map);
      }

      setChargement(false);
    };
    verifier();
  }, []);

  // Même règle que la base de données (fonction commande_compte_pour_points)
  const comptePourPoints = (statut) => ["payee", "a_programmer", "envoi_en_cours", "litige"].includes(statut);

  // Remboursement : on passe par une petite fenêtre de confirmation (Stripe + avoir)
  const [remboursement, setRemboursement] = useState(null); // { id, infos, enCours, erreur }
  const [message, setMessage] = useState(null);

  const ouvrirRemboursement = async (commandeId) => {
    setRemboursement({ id: commandeId, infos: null, enCours: false, erreur: "" });
    const res = await fetchAdmin(`/api/admin-rembourser?commande=${encodeURIComponent(commandeId)}`);
    const json = await res.json().catch(() => ({}));
    setRemboursement((r) => (r?.id === commandeId ? { ...r, infos: res.ok ? json : null, erreur: res.ok ? "" : json.error || "Erreur" } : r));
  };

  const rembourser = async (viaStripe) => {
    const { id } = remboursement;
    setRemboursement((r) => ({ ...r, enCours: true, erreur: "" }));
    const res = await fetchAdmin("/api/admin-rembourser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: id, viaStripe }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRemboursement((r) => ({ ...r, enCours: false, erreur: json.error || "Erreur" }));
      return;
    }
    setCommandes((prev) => prev.map((c) => (c.id === id ? { ...c, statut: "remboursee" } : c)));
    setRemboursement(null);
    setMessage(`Carte remboursée${json.stripe ? " sur Stripe" : ""}${json.avoir ? `, avoir ${json.avoir} envoyé au client` : ""}.`);
  };

  const renvoyer = async () => {
    const { id, email } = renvoi;
    setRenvoi((r) => ({ ...r, enCours: true, erreur: "" }));
    const res = await fetchAdmin("/api/renvoyer-carte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: id, destinataireOverride: email.trim() }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setRenvoi((r) => ({ ...r, enCours: false, erreur: json.error || "Erreur" }));
    setCommandes((prev) => prev.map((c) => (c.id === id
      ? { ...c, email_destinataire: email.trim(), email_statut: "envoye", email_maj_le: new Date().toISOString(), email_detail: null }
      : c)));
    setRenvoi(null);
    setMessage(`Carte renvoyée à ${email.trim()}.`);
  };

  const changerStatut = async (commandeId, nouveauStatut) => {
    if (nouveauStatut === "remboursee") return ouvrirRemboursement(commandeId);
    const commande = commandes.find((c) => c.id === commandeId);
    const points = Math.floor(Number(commande?.montant) || 0);
    if (commande && !commande.cagnotte_id && points > 0) {
      const avant = comptePourPoints(commande.statut);
      const apres = comptePourPoints(nouveauStatut);
      if (avant && !apres &&
          !window.confirm(`${points} point(s) de fidélité seront retirés à ${commande.email_acheteur}. Continuer ?`)) return;
      if (!avant && apres &&
          !window.confirm(`${points} point(s) de fidélité seront rendus à ${commande.email_acheteur}. Continuer ?`)) return;
    }
    setModificationEnCours(commandeId);
    const { error } = await adminModifier("commandes", commandeId, { statut: nouveauStatut });

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
    envoi_en_cours: "Envoi en cours",
    annulee: "Annulée",
    remboursee: "Remboursée",
    litige: "En litige",
  };

  const statutCouleur = {
    payee: "text-vert",
    a_programmer: "text-gold",
    envoi_en_cours: "text-gold",
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

    const matchEnvoi = filtreEnvoi === "tous" || (filtreEnvoi === "probleme" && PROBLEMES.includes(c.email_statut));

    return matchStatut && matchRecherche && matchType && matchEnvoi;
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
        <select
          value={filtreEnvoi}
          onChange={(e) => setFiltreEnvoi(e.target.value)}
          aria-label="Envoi des emails"
          className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        >
          <option value="tous" className="bg-ink">Tous les envois</option>
          <option value="probleme" className="bg-ink">Non livrées ou retardées</option>
        </select>
      </div>

      {message && <p role="status" className="mb-4 text-sm text-vert">{message}</p>}
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
                  <p className="text-xs text-gold/70 mt-1 font-mono">{codesVisibles ? codesDechiffres[c.id] || "..." : "Code masqué"}</p>
                )}
                {c.email_statut && SUIVI[c.email_statut] && (
                  <p className={`text-xs mt-1 ${SUIVI[c.email_statut][1]}`}>
                    Email : {SUIVI[c.email_statut][0]}
                    {c.email_maj_le && ` le ${new Date(c.email_maj_le).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" })}`}
                    {c.email_detail && <span className="text-ivory/45"> ({c.email_detail})</span>}
                  </p>
                )}
                {c.code && !["annulee", "remboursee"].includes(c.statut) && renvoi?.id !== c.id && (
                  <button type="button" onClick={() => setRenvoi({ id: c.id, email: c.email_destinataire || c.email_acheteur || "", enCours: false, erreur: "" })}
                    className="mt-2 text-xs text-gold hover:underline">
                    Renvoyer la carte
                  </button>
                )}
                {renvoi?.id === c.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input type="email" value={renvoi.email} onChange={(e) => setRenvoi((r) => ({ ...r, email: e.target.value }))}
                      aria-label="Adresse du destinataire"
                      className="bg-transparent border border-ivory/20 rounded-lg px-3 py-1.5 text-ivory text-sm w-[260px] max-w-full" />
                    <button type="button" disabled={renvoi.enCours || !renvoi.email.includes("@")} onClick={renvoyer}
                      className="bg-gold text-ink text-xs font-semibold rounded-lg px-3 py-2 hover:bg-gold/90 disabled:opacity-40">
                      {renvoi.enCours ? "Envoi..." : "Renvoyer"}
                    </button>
                    <button type="button" onClick={() => setRenvoi(null)} className="text-xs text-ivory/50 hover:text-ivory underline">Annuler</button>
                    {renvoi.erreur && <p className="w-full text-xs text-corail">{renvoi.erreur}</p>}
                  </div>
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

            {remboursement?.id === c.id && (
              <div className="mt-4 border-t border-ivory/10 pt-4">
                <p className="text-sm text-ivory font-medium">Rembourser cette carte</p>
                {!remboursement.infos && !remboursement.erreur && <p className="mt-2 text-sm text-ivory/50">Calcul du montant…</p>}
                {remboursement.infos && (
                  <>
                    <p className="mt-1 text-sm text-ivory/60">
                      Montant payé par carte bancaire : <span className="text-ivory">{remboursement.infos.montantCarte.toFixed(2).replace(".", ",")} €</span>
                      {remboursement.infos.partCashback > 0 && (
                        <> (plus {remboursement.infos.partCashback.toFixed(2).replace(".", ",")} € payés en cashback, non remboursés automatiquement)</>
                      )}
                      . Le client reçoit un email avec l&apos;avoir en PDF.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3">
                      {remboursement.infos.stripePossible && (
                        <button type="button" disabled={remboursement.enCours} onClick={() => rembourser(true)}
                          className="bg-gold text-ink text-sm font-semibold rounded-lg px-4 py-2 hover:bg-gold/90 disabled:opacity-40">
                          Rembourser {remboursement.infos.montantCarte.toFixed(2).replace(".", ",")} € via Stripe
                        </button>
                      )}
                      <button type="button" disabled={remboursement.enCours} onClick={() => rembourser(false)}
                        className="text-sm text-ivory/80 border border-ivory/20 rounded-lg px-4 py-2 hover:border-ivory/40 disabled:opacity-40">
                        Déjà remboursé depuis Stripe : créer l&apos;avoir
                      </button>
                      <button type="button" onClick={() => setRemboursement(null)} className="text-sm text-ivory/50 hover:text-ivory underline underline-offset-4">
                        Annuler
                      </button>
                    </div>
                  </>
                )}
                {remboursement.erreur && <p className="mt-2 text-sm text-corail">{remboursement.erreur}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}