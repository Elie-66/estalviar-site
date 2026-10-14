"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";
import { adminLire, adminModifier } from "../../../../lib/adminDb";
import { fetchAdmin } from "../../../../lib/fetchAdmin";

const euros = (n) =>
  `${Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const dateFr = (d) => new Date(d).toLocaleDateString("fr-FR");

const LIBELLES_MOUVEMENT = { gain: "Gagné", utilisation: "Utilisé", expiration: "Expiré", annulation: "Annulé (remboursement)" };

export default function AdminClients() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [clientOuvert, setClientOuvert] = useState(null);
  const [commandesClient, setCommandesClient] = useState([]);
  const [messageAction, setMessageAction] = useState({});
  const [cashback, setCashback] = useState({ parClient: {}, totaux: null });
  const [historiqueCashback, setHistoriqueCashback] = useState([]);
  const [tri, setTri] = useState("recents"); // recents | cashback | points

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);

      const [{ data }, reponseCashback] = await Promise.all([
        adminLire("profils", "created_at", false),
        fetchAdmin("/api/admin-cashback").then((r) => r.json()).catch(() => ({})),
      ]);

      setClients(data || []);
      setCashback({ parClient: reponseCashback.parClient || {}, totaux: reponseCashback.totaux || null });
      setChargement(false);
    };
    verifier();
  }, []);

  const ouvrirClient = async (client) => {
    if (clientOuvert === client.id) {
      setClientOuvert(null);
      return;
    }
    setClientOuvert(client.id);
    setHistoriqueCashback([]);

    const [{ data }, reponseHistorique] = await Promise.all([
      adminLire("commandes", "created_at", false, { email_acheteur: client.email }),
      fetchAdmin(`/api/admin-cashback?profil=${client.id}`).then((r) => r.json()).catch(() => ({})),
    ]);

    setCommandesClient(data || []);
    setHistoriqueCashback(reponseHistorique.historique || []);
  };

  const handleReinitialiserMdp = async (email) => {
    setMessageAction((prev) => ({ ...prev, [email]: "Envoi..." }));
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/fr/connexion`,
    });
    setMessageAction((prev) => ({
      ...prev,
      [email]: error ? "Erreur lors de l'envoi." : "Email envoyé !",
    }));
  };

  const handleRenvoyerCarte = async (commande) => {
    setMessageAction((prev) => ({ ...prev, [commande.id]: "Envoi..." }));
    const res = await fetchAdmin("/api/renvoyer-carte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId: commande.id, origin: window.location.origin }),
    });
    setMessageAction((prev) => ({
      ...prev,
      [commande.id]: res.ok ? "Carte renvoyée !" : "Erreur lors de l'envoi.",
    }));
  };

  const paliers = [
    { nom: "Bronze", seuil: 0, couleur: "#B08D57" },
    { nom: "Argent", seuil: 100, couleur: "#C0C0C0" },
    { nom: "Or", seuil: 300, couleur: "#C9A227" },
    { nom: "Platine", seuil: 700, couleur: "#E5E4E2" },
  ];
  const palierDe = (points) => [...paliers].reverse().find((p) => points >= p.seuil) || paliers[0];

  const soldeDe = (id) => cashback.parClient[id] || { disponible: 0, enAttente: 0, gagne: 0, utilise: 0, expire: 0 };

  const clientsFiltres = clients
    .filter(
      (c) =>
        !recherche ||
        c.email?.toLowerCase().includes(recherche.toLowerCase()) ||
        c.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
        c.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
        c.pseudo?.toLowerCase().includes(recherche.toLowerCase())
    )
    .sort((a, b) => {
      if (tri === "cashback") {
        const sa = soldeDe(a.id), sb = soldeDe(b.id);
        return sb.disponible + sb.enAttente - (sa.disponible + sa.enAttente);
      }
      if (tri === "points") return (b.points || 0) - (a.points || 0);
      return 0; // déjà triés du plus récent au plus ancien
    });
  const totaux = cashback.totaux;

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
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Comptes clients</h1>

      {totaux && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="border border-ivory/10 rounded-xl p-5">
            <p className="text-xs text-ivory/50 uppercase tracking-wide">Cashback disponible</p>
            <p className="text-2xl font-semibold text-gold mt-1">{euros(totaux.disponible)}</p>
            <p className="text-[11px] text-ivory/40 mt-1">ce que tes clients peuvent dépenser aujourd&apos;hui</p>
          </div>
          <div className="border border-ivory/10 rounded-xl p-5">
            <p className="text-xs text-ivory/50 uppercase tracking-wide">En attente</p>
            <p className="text-2xl font-semibold text-ivory mt-1">{euros(totaux.enAttente)}</p>
            <p className="text-[11px] text-ivory/40 mt-1">débloqué 14 jours après la livraison</p>
          </div>
          <div className="border border-ivory/10 rounded-xl p-5">
            <p className="text-xs text-ivory/50 uppercase tracking-wide">Expire sous 30 jours</p>
            <p className="text-2xl font-semibold text-corail mt-1">{euros(totaux.expire30Jours)}</p>
            <p className="text-[11px] text-ivory/40 mt-1">les clients reçoivent un rappel</p>
          </div>
          <div className="border border-ivory/10 rounded-xl p-5">
            <p className="text-xs text-ivory/50 uppercase tracking-wide">Depuis le début</p>
            <p className="text-sm text-ivory/80 mt-2">Gagné {euros(totaux.gagne)}</p>
            <p className="text-sm text-ivory/80">Utilisé {euros(totaux.utilise)}</p>
            <p className="text-sm text-ivory/50">Expiré {euros(totaux.expire)}</p>
            {totaux.annule > 0 && <p className="text-sm text-ivory/50">Annulé {euros(totaux.annule)}</p>}
          </div>
        </div>
      )}

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher (email, pseudo, nom, prénom)..."
        className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm mb-6"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <p className="text-sm text-ivory/50">{clientsFiltres.length} client(s)</p>
        <div className="flex items-center gap-2 text-xs text-ivory/50">
          Trier par
          <select
            value={tri}
            onChange={(e) => setTri(e.target.value)}
            className="bg-ink border border-ivory/20 rounded-md px-2 py-1 text-ivory"
          >
            <option value="recents">plus récents</option>
            <option value="cashback">cashback</option>
            <option value="points">points</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {clientsFiltres.map((c) => {
          const palier = palierDe(c.points || 0);
          const nomAffiche = c.pseudo || [c.prenom, c.nom].filter(Boolean).join(" ") || "—";
          const solde = soldeDe(c.id);

          return (
            <div key={c.id} className="border border-ivory/10 rounded-lg overflow-hidden">
              <button
                onClick={() => ouvrirClient(c)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-ivory/5 transition-colors"
              >
                <div>
                  <p className="text-ivory font-medium">{nomAffiche}</p>
                  <p className="text-sm text-ivory/50">{c.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className="text-xs uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full"
                    style={{ backgroundColor: `${palier.couleur}20`, color: palier.couleur }}
                  >
                    {palier.nom}
                  </span>
                  <p className="text-sm text-gold mt-1">{c.points || 0} pts</p>
                  {(solde.disponible > 0 || solde.enAttente > 0) && (
                    <p className="text-xs text-ivory/60 mt-0.5">
                      Cashback {euros(solde.disponible)}
                      {solde.enAttente > 0 && <span className="text-ivory/40"> + {euros(solde.enAttente)} en attente</span>}
                    </p>
                  )}
                </div>
              </button>

              {clientOuvert === c.id && (
                <div className="border-t border-ivory/10 p-4 bg-ink-secondary/30">
                  {c.telephone && (
                    <p className="text-sm text-ivory/60 mb-3">Téléphone : {c.telephone}</p>
                  )}

                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={() => handleReinitialiserMdp(c.email)}
                      className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors"
                    >
                      Réinitialiser le mot de passe
                    </button>
                    {messageAction[c.email] && (
                      <span className="text-xs text-ivory/50">{messageAction[c.email]}</span>
                    )}
                  </div>

                  <p className="text-xs uppercase tracking-wide text-ivory/50 mb-2">Cashback</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3 text-sm">
                    <div><p className="text-[11px] text-ivory/40">Disponible</p><p className="text-gold">{euros(solde.disponible)}</p></div>
                    <div><p className="text-[11px] text-ivory/40">En attente</p><p className="text-ivory/80">{euros(solde.enAttente)}</p></div>
                    <div><p className="text-[11px] text-ivory/40">Gagné</p><p className="text-ivory/80">{euros(solde.gagne)}</p></div>
                    <div><p className="text-[11px] text-ivory/40">Utilisé</p><p className="text-ivory/80">{euros(solde.utilise)}</p></div>
                    <div><p className="text-[11px] text-ivory/40">Expiré</p><p className="text-ivory/50">{euros(solde.expire)}</p></div>
                  </div>
                  {solde.prochaineExpiration && (
                    <p className="text-xs text-corail/80 mb-3">
                      {euros(solde.prochaineExpiration.montant)} expirent le {dateFr(solde.prochaineExpiration.date)}
                    </p>
                  )}
                  {historiqueCashback.length > 0 && (
                    <div className="max-h-48 overflow-y-auto mb-5 space-y-1">
                      {historiqueCashback.map((m, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-ivory/60">
                            {dateFr(m.created_at)} · {LIBELLES_MOUVEMENT[m.type] || m.type}
                            {m.statut === "reserve" && " (paiement en cours)"}
                            {m.description ? ` — ${m.description}` : ""}
                            {m.type === "gain" && new Date(m.disponible_le) > new Date() && ` · utilisable le ${dateFr(m.disponible_le)}`}
                          </span>
                          <span className={m.type === "gain" ? "text-gold" : "text-ivory/50"}>
                            {m.type === "gain" ? "+" : "−"}{euros(m.montant)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {historiqueCashback.length === 0 && <p className="text-sm text-ivory/40 mb-5">Aucun mouvement de cashback.</p>}

                  <p className="text-xs uppercase tracking-wide text-ivory/50 mb-2">
                    Commandes ({commandesClient.length})
                  </p>
                  {commandesClient.length === 0 ? (
                    <p className="text-sm text-ivory/40">Aucune commande.</p>
                  ) : (
                    <div className="space-y-2">
                      {commandesClient.map((cmd) => (
                        <div key={cmd.id} className="flex justify-between items-center text-sm">
                          <span className="text-ivory/70">
                            {cmd.marque} {cmd.beneficiaire && `— pour ${cmd.beneficiaire}`}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-gold">{cmd.montant} €</span>
                            <button
                              onClick={() => handleRenvoyerCarte(cmd)}
                              className="text-xs text-ivory/40 hover:text-gold underline transition-colors"
                            >
                              Renvoyer
                            </button>
                          </div>
                        </div>
                      ))}
                      {commandesClient.map((cmd) =>
                        messageAction[cmd.id] ? (
                          <p key={`msg-${cmd.id}`} className="text-xs text-ivory/50 text-right">
                            {messageAction[cmd.id]}
                          </p>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}