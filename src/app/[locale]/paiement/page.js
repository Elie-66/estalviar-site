"use client";

import { useState, useEffect } from "react";
import { usePanier } from "../context/PanierContext";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "../../../lib/supabase";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Paiement() {
  const { articles, total } = usePanier();
  const [emailAcheteur, setEmailAcheteur] = useState("");
  const [emailsBeneficiaires, setEmailsBeneficiaires] = useState({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
  const [modeAuth, setModeAuth] = useState("invite"); // "invite" | "creer" | "connexion"
  const [motDePasse, setMotDePasse] = useState("");
  const [chargementAuth, setChargementAuth] = useState(false);
  const [erreurAuth, setErreurAuth] = useState("");

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailAcheteur(user.email);
      }
    };
    charger();
  }, []);

  const handleCreerCompte = async (e) => {
    e.preventDefault();
    setChargementAuth(true);
    setErreurAuth("");

    const { data, error } = await supabase.auth.signUp({
      email: emailAcheteur,
      password: motDePasse,
    });

    if (error) {
      setErreurAuth(error.message);
    } else {
      if (data.user) {
        await supabase.from("profils").insert({ id: data.user.id, email: emailAcheteur });
      }
      setErreurAuth("Compte créé ! Vérifiez votre email pour le confirmer, puis continuez votre commande.");
    }
    setChargementAuth(false);
  };

  const handleConnexion = async (e) => {
    e.preventDefault();
    setChargementAuth(true);
    setErreurAuth("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailAcheteur,
      password: motDePasse,
    });

    if (error) {
      setErreurAuth(error.message);
    } else {
      setUtilisateurConnecte(data.user);
      setModeAuth("invite");
    }
    setChargementAuth(false);
  };

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    setUtilisateurConnecte(null);
    setEmailAcheteur("");
  };

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
              onClick={() => setModeAuth("creer")}
              disabled={!!utilisateurConnecte}
              className={`flex-1 text-xs py-2 rounded-md transition-colors disabled:opacity-30 ${
                modeAuth === "creer" ? "bg-gold text-ink font-medium" : "text-ivory/60"
              }`}
            >
              Créer un compte
            </button>
            <button
              onClick={() => setModeAuth("connexion")}
              disabled={!!utilisateurConnecte}
              className={`flex-1 text-xs py-2 rounded-md transition-colors disabled:opacity-30 ${
                modeAuth === "connexion" ? "bg-gold text-ink font-medium" : "text-ivory/60"
              }`}
            >
              Se connecter
            </button>
            <button
              onClick={() => setModeAuth("invite")}
              disabled={!!utilisateurConnecte}
              className={`flex-1 text-xs py-2 rounded-md transition-colors disabled:opacity-30 ${
                modeAuth === "invite" ? "bg-gold text-ink font-medium" : "text-ivory/60"
              }`}
            >
              Continuer avec mon email
            </button>
          </div>
        </div>

        {utilisateurConnecte ? (
          <div className="border border-gold/20 bg-gold/5 rounded-lg p-4 flex items-center justify-between">
            <p className="text-sm text-ivory/80">
              Connecté en tant que <span className="text-gold">{utilisateurConnecte.email}</span>
            </p>
            <button onClick={handleDeconnexion} className="text-xs text-ivory/50 hover:text-ivory underline">
              Se déconnecter
            </button>
          </div>
        ) : modeAuth === "invite" ? (
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
        ) : (
          <form onSubmit={modeAuth === "creer" ? handleCreerCompte : handleConnexion}>
            <label className="block text-sm text-ivory/70 mb-2">Email</label>
            <input
              type="email"
              value={emailAcheteur}
              onChange={(e) => setEmailAcheteur(e.target.value)}
              required
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />

            <label className="block text-sm text-ivory/70 mb-2 mt-4">Mot de passe</label>
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              minLength={6}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />

            <button
              type="submit"
              disabled={chargementAuth}
              className="mt-4 bg-transparent border border-gold text-gold text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40"
            >
              {chargementAuth
                ? "Chargement..."
                : modeAuth === "creer"
                ? "Créer mon compte"
                : "Se connecter"}
            </button>

            {erreurAuth && <p className="mt-3 text-sm text-gold">{erreurAuth}</p>}
          </form>
        )}

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