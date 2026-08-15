"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

export default function AdminClients() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [clients, setClients] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [clientOuvert, setClientOuvert] = useState(null);
  const [commandesClient, setCommandesClient] = useState([]);
  const [messageAction, setMessageAction] = useState({});

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);

      const { data } = await supabase
        .from("profils")
        .select("*")
        .order("created_at", { ascending: false });

      setClients(data || []);
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

    const { data } = await supabase
      .from("commandes")
      .select("*")
      .eq("email_acheteur", client.email)
      .order("created_at", { ascending: false });

    setCommandesClient(data || []);
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
    const res = await fetch("/api/renvoyer-carte", {
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

  const clientsFiltres = clients.filter(
    (c) =>
      !recherche ||
      c.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.prenom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.pseudo?.toLowerCase().includes(recherche.toLowerCase())
  );

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

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher (email, pseudo, nom, prénom)..."
        className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm mb-6"
      />

      <p className="text-sm text-ivory/50 mb-4">{clientsFiltres.length} client(s)</p>

      <div className="space-y-3">
        {clientsFiltres.map((c) => {
          const palier = palierDe(c.points || 0);
          const nomAffiche = c.pseudo || [c.prenom, c.nom].filter(Boolean).join(" ") || "—";

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