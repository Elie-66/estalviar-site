"use client";

import { useState } from "react";
import { usePanier } from "../context/PanierContext";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Paiement() {
  const { articles, total } = usePanier();
  const [emailAcheteur, setEmailAcheteur] = useState("");
  const [emailsBeneficiaires, setEmailsBeneficiaires] = useState({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const handlePaiement = async () => {
    setChargement(true);
    setErreur("");
    try {
      localStorage.setItem("estalviar-emails-beneficiaires", JSON.stringify(emailsBeneficiaires));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles,
          emailAcheteur,
          locale: "fr",
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setErreur(data.error || "Erreur inconnue.");
      }
    } catch (e) {
      setErreur("Erreur réseau : " + e.message);
    } finally {
      setChargement(false);
    }
  };

  if (articles.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">Paiement</h1>
        <p className="mt-4 text-ivory/60">Votre panier est vide.</p>
        <a
          href="/fr/boutique"
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
        >
          Découvrir la boutique
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

      <div>
        <h1 className="text-3xl font-semibold text-ivory mb-8">Finaliser la commande</h1>

        <div className="mb-6">
          <div className="flex gap-2 border border-ivory/10 rounded-lg p-1">
            <button
              disabled
              className="flex-1 text-xs py-2 rounded-md text-ivory/30 cursor-not-allowed"
              title="Bientôt disponible"
            >
              Créer un compte
            </button>
            <button
              disabled
              className="flex-1 text-xs py-2 rounded-md text-ivory/30 cursor-not-allowed"
              title="Bientôt disponible"
            >
              Se connecter
            </button>
            <button className="flex-1 text-xs py-2 rounded-md bg-gold text-ink font-medium">
              Continuer avec mon email
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-ivory/70 mb-2">Votre email</label>
          <input
            type="email"
            value={emailAcheteur}
            onChange={(e) => setEmailAcheteur(e.target.value)}
            placeholder="vous@exemple.com"
            required
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />
          <p className="mt-1 text-xs text-ivory/40">Pour recevoir votre reçu de commande.</p>
        </div>

        <button
          onClick={handlePaiement}
          disabled={!emailAcheteur || chargement}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {chargement ? "Redirection..." : `Payer ${total} €`}
        </button>

        {erreur && (
          <p className="mt-3 text-sm text-corail">{erreur}</p>
        )}
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-ivory/50 mb-4">Récapitulatif</h2>
        <div className="space-y-4">
          {articles.map((a) => (
            <div key={a.id} className="border-b border-ivory/10 pb-4">
              <div className="flex justify-between text-sm text-ivory/80">
                <span>{a.marque} {a.beneficiaire && `— ${a.beneficiaire}`}</span>
                <span>{a.montant} €</span>
              </div>
              {a.dateEnvoi && (
                <p className="text-xs text-gold/70 mt-1">
                  Envoi le {new Date(a.dateEnvoi).toLocaleDateString("fr-FR")} à {a.heureEnvoi}
                </p>
              )}
              <div className="mt-2">
                <input
                  type="email"
                  value={emailsBeneficiaires[a.id] || ""}
                  onChange={(e) =>
                    setEmailsBeneficiaires((prev) => ({ ...prev, [a.id]: e.target.value }))
                  }
                  placeholder="Email du destinataire (facultatif)"
                  className="w-full bg-transparent border border-ivory/10 rounded-lg px-3 py-2 text-xs text-ivory placeholder:text-ivory/30"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ivory/40">
          Si un email est renseigné, cette carte est envoyée directement au destinataire. Sinon, vous la recevrez pour la transmettre vous-même.
        </p>
        <div className="mt-4 flex justify-between text-ivory font-semibold text-lg">
          <span>Total</span>
          <span>{total} €</span>
        </div>
      </div>

    </div>
  );
}