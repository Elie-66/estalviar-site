"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function PageCagnotte({ params }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const contributionId = searchParams.get("contribution");

  const [cagnotte, setCagnotte] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [nomContributeur, setNomContributeur] = useState("");
  const [emailContributeur, setEmailContributeur] = useState("");
  const [montant, setMontant] = useState("");
  const [messageContribution, setMessageContribution] = useState("");
  const [envoiContribution, setEnvoiContribution] = useState(false);
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
  const [commandesCagnotte, setCommandesCagnotte] = useState([]);
  const [messageRenvoi, setMessageRenvoi] = useState({});
  const [lienCopie, setLienCopie] = useState(false);
  const [merci, setMerci] = useState(null); // retour de paiement : remerciement + invitation

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailContributeur(user.email);

        const { data: profil } = await supabase
          .from("profils")
          .select("pseudo, prenom")
          .eq("id", user.id)
          .single();

        setNomContributeur(profil?.pseudo || profil?.prenom || user.email.split("@")[0]);
      }

      if (sessionId && contributionId) {
        const reponse = await fetch("/api/confirmer-contribution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, contributionId }),
        });
        const confirmation = await reponse.json().catch(() => ({}));
        if (confirmation.merci) setMerci(confirmation.merci);
      }

      // Infos publiques de la cagnotte (sans emails) via le serveur
      const lirePublique = async () => {
        const res = await fetch(`/api/cagnotte-publique?slug=${encodeURIComponent(slug)}`);
        return res.ok ? res.json() : { cagnotte: null, contributions: [], commandes: [] };
      };

      let infos = await lirePublique();
      const cagnotteData = infos.cagnotte;

      if (
        cagnotteData &&
        cagnotteData.date_fin &&
        new Date(cagnotteData.date_fin) <= new Date() &&
        cagnotteData.statut === "ouverte"
      ) {
        await fetch("/api/cloturer-cagnotte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cagnotteId: cagnotteData.id, origin: window.location.origin }),
        });
        infos = await lirePublique();
      }

      setCagnotte(infos.cagnotte);
      setContributions(infos.contributions || []);
      setCommandesCagnotte(infos.commandes || []);

      setChargement(false);
    };

    charger();
  }, [slug, sessionId, contributionId]);

  const handleContribuer = async () => {
    setEnvoiContribution(true);
    const res = await fetch("/api/contribuer-cagnotte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cagnotteId: cagnotte.id,
        slug,
        nomContributeur,
        emailContributeur,
        montant: parseInt(montant),
        messageContribution,
        locale: "fr",
      }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setEnvoiContribution(false);
    }
  };

  // cible : "createur" ou "beneficiaire" (le serveur retrouve l'adresse lui-même)
  const handleRenvoyer = async (commandeId, cible) => {
    setMessageRenvoi((prev) => ({ ...prev, [commandeId]: "Envoi..." }));
    const res = await fetch("/api/renvoyer-carte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId, cible }),
    });
    setMessageRenvoi((prev) => ({
      ...prev,
      [commandeId]: res.ok ? "Envoyée !" : "Erreur lors de l'envoi.",
    }));
  };

  const copierLien = () => {
    navigator.clipboard.writeText(window.location.href);
    setLienCopie(true);
    setTimeout(() => setLienCopie(false), 2000);
  };

  if (chargement) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  if (!cagnotte) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">Cagnotte introuvable</h1>
      </div>
    );
  }

  const pourcentage = cagnotte.montant_libre
    ? 100
    : Math.min(100, Math.round((cagnotte.montant_collecte / cagnotte.montant_objectif) * 100));
  const complete = cagnotte.statut === "cloturee" || cagnotte.statut === "attente_choix";

  return (
    <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20">

      <div
        className="relative overflow-hidden rounded-2xl p-8 aspect-[1.6/1] flex flex-col justify-between border border-gold/30 mb-10"
        style={{
          background: cagnotte.background,
          boxShadow: "0 25px 60px -15px #00000066",
        }}
      >
        <div className="flex items-center justify-between">
          <img src={cagnotte.image} alt={cagnotte.marque} className="h-8 object-contain drop-shadow-md" />
          <span className="text-gold/70 text-[10px] uppercase tracking-[0.2em]">Estalviar</span>
        </div>
        <div>
          <p className={`text-sm font-medium ${cagnotte.texte_fonce ? "text-ink" : "text-white"}`}>
            Pour {cagnotte.beneficiaire}
          </p>
          {cagnotte.message && (
            <p className={`text-sm italic mt-0.5 ${cagnotte.texte_fonce ? "text-ink/60" : "text-white/60"}`}>
              "{cagnotte.message}"
            </p>
          )}
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-ivory">
          Cagnotte pour {cagnotte.beneficiaire}
        </h1>
        <p className="mt-2 text-ivory/60">
          {cagnotte.montant_libre
            ? `${cagnotte.montant_collecte} € collectés`
            : `${cagnotte.montant_collecte} € collectés sur ${cagnotte.montant_objectif} €`}
        </p>
        {cagnotte.date_fin && cagnotte.statut === "ouverte" && (
          <p className="text-sm text-ivory/40 mt-1">
            Clôture le {new Date(cagnotte.date_fin).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      <div className="mt-4 h-3 bg-ivory/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-all"
          style={{ width: `${pourcentage}%` }}
        />
      </div>
      <p className="text-center text-sm text-gold mt-2">{pourcentage}%</p>

      {merci && (
        <div className="mt-8 border border-gold/30 bg-gold/5 rounded-xl p-6 text-center">
          <p className="text-ivory font-medium">Merci pour votre participation de {merci.montant} € !</p>
          {utilisateurConnecte || merci.compteExiste ? (
            <p className="text-sm text-ivory/60 mt-2">
              Elle vous rapporte {Math.floor(merci.montant)} point{Math.floor(merci.montant) > 1 ? "s" : ""} de fidélité.
            </p>
          ) : merci.email ? (
            <>
              <p className="text-sm text-ivory/60 mt-2">
                Créez votre compte avec <span className="text-gold">{merci.email}</span> : cette participation comptera
                aussitôt pour votre palier fidélité ({Math.floor(merci.montant)} points), et vos prochains achats vous
                rapporteront du cashback.
              </p>
              <a
                href={`/fr/inscription?email=${encodeURIComponent(merci.email)}`}
                className="inline-block mt-4 bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-gold/90 transition-colors"
              >
                Créer mon compte
              </a>
            </>
          ) : (
            <p className="text-sm text-ivory/60 mt-2">
              La prochaine fois, indiquez votre email : avec un compte Estalviar, vos participations comptent pour votre palier fidélité.
            </p>
          )}
        </div>
      )}

      {complete ? (
        <div className="mt-10">
          <div className="text-center border border-vert/30 bg-vert/10 rounded-lg p-6">
            <p className="text-vert font-medium">Cagnotte clôturée 🎉</p>
            <p className="text-sm text-ivory/60 mt-1">
              {cagnotte.statut === "attente_choix"
                ? "Un email a été envoyé au bénéficiaire pour choisir sa carte."
                : "La carte a été envoyée."}
            </p>
          </div>

          {cagnotte.statut === "cloturee" && commandesCagnotte.length > 0 && (
            <div className="mt-6 space-y-4">
              {commandesCagnotte.map((cmd) => (
                <div key={cmd.id} className="border border-ivory/10 rounded-lg p-4">
                  <p className="text-ivory font-medium">{cmd.marque} — {cmd.montant} €</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <button
                      onClick={() => handleRenvoyer(cmd.id, "createur")}
                      className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors"
                    >
                      Renvoyer à moi-même
                    </button>
                    {cagnotte.a_email_beneficiaire && (
                      <button
                        onClick={() => handleRenvoyer(cmd.id, "beneficiaire")}
                        className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors"
                      >
                        Renvoyer au bénéficiaire
                      </button>
                    )}
                  </div>
                  {messageRenvoi[cmd.id] && (
                    <p className="text-xs text-ivory/50 mt-2">{messageRenvoi[cmd.id]}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 border border-ivory/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-ivory mb-4">Contribuer</h2>

          {utilisateurConnecte ? (
            <p className="text-sm text-ivory/60 mb-4">
              Connecté en tant que <span className="text-gold">{nomContributeur}</span> ({emailContributeur})
            </p>
          ) : (
            <>
              <label className="block text-sm text-ivory/70 mb-2">Votre nom</label>
              <input
                type="text"
                value={nomContributeur}
                onChange={(e) => setNomContributeur(e.target.value)}
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
              />

              <label className="block text-sm text-ivory/70 mb-2 mt-4">Email (facultatif)</label>
              <input
                type="email"
                value={emailContributeur}
                onChange={(e) => setEmailContributeur(e.target.value)}
                placeholder="Pour cumuler des points et voir cet achat dans votre historique"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
              />
              <p className="mt-1 text-xs text-ivory/40">
                Avec un compte Estalviar (même créé plus tard avec cet email), votre participation compte pour votre
                palier fidélité. Les cagnottes ne rapportent pas de cashback.
              </p>
            </>
          )}

          <label className="block text-sm text-ivory/70 mb-2 mt-4">Montant (€)</label>
          <input
            type="number"
            min="1"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />

          <label className="block text-sm text-ivory/70 mb-2 mt-4">Message (facultatif)</label>
          <input
            type="text"
            value={messageContribution}
            onChange={(e) => setMessageContribution(e.target.value)}
            maxLength={60}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />

          <button
            onClick={handleContribuer}
            disabled={!nomContributeur || !montant || envoiContribution}
            className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {envoiContribution ? "Redirection..." : `Contribuer ${montant ? `${montant} €` : ""}`}
          </button>
        </div>
      )}

      {!complete && (
        <div className="mt-6 text-center">
          <button
            onClick={copierLien}
            className="text-sm text-ivory/50 hover:text-gold underline transition-colors"
          >
            {lienCopie ? "Lien copié !" : "Copier le lien de la cagnotte"}
          </button>
        </div>
      )}

      {contributions.length > 0 && (
        <div className="mt-10">
          <h2 className="text-sm uppercase tracking-wide text-ivory/50 mb-4">Contributeurs</h2>
          <div className="space-y-2">
            {contributions.map((c) => (
              <div key={c.id} className="flex justify-between text-sm border-b border-ivory/5 pb-2">
                <div>
                  <span className="text-ivory">{c.nom_contributeur}</span>
                  {c.message && <span className="text-ivory/40 italic"> — "{c.message}"</span>}
                </div>
                <span className="text-gold">{c.montant} €</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}