"use client";

import { useState, useEffect } from "react";
import { usePanier } from "../context/PanierContext";
import { loadStripe } from "@stripe/stripe-js";
import { supabase } from "../../../lib/supabase";
import { fetchSession } from "../../../lib/fetchSession";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Paiement() {
  const { articles, total } = usePanier();
  const [emailAcheteur, setEmailAcheteur] = useState("");
  const [emailsBeneficiaires, setEmailsBeneficiaires] = useState({});
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [cashback, setCashback] = useState(null);
  const [utiliserCashback, setUtiliserCashback] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const [codeApplique, setCodeApplique] = useState(null);
  const [erreurCode, setErreurCode] = useState("");
  const [verificationCode, setVerificationCode] = useState(false);

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

  // Cashback disponible pour ce panier (calculé par le serveur)
  useEffect(() => {
    if (!utilisateurConnecte || !total) return;
    fetchSession(`/api/cashback?total=${total}`)
      .then((r) => r.json())
      .then((data) => setCashback(data.connecte ? data : null))
      .catch(() => setCashback(null));
  }, [utilisateurConnecte, total]);

  const cashbackAffiche = utilisateurConnecte && total ? cashback : null;
  // Le code reste appliqué tant que le panier ne change pas (sinon il faut le revalider)
  const codeAffiche = codeApplique && utilisateurConnecte && codeApplique.total === total ? codeApplique : null;
  const reductionCashback = !codeAffiche && utiliserCashback && cashbackAffiche ? cashbackAffiche.utilisable : 0;
  const totalAPayer = Math.round((total - reductionCashback) * 100) / 100;
  const euros = (n) => `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  const handleAppliquerCode = async (e) => {
    e.preventDefault();
    if (!codeSaisi.trim()) return;
    setVerificationCode(true);
    setErreurCode("");
    try {
      const res = await fetchSession("/api/code-influence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeSaisi,
          articles: articles.map((a) => ({ marque: a.marque, montant: a.montant })),
        }),
      });
      const data = await res.json();
      if (data.valide) {
        setCodeApplique({ ...data, total });
        setUtiliserCashback(false);
      } else {
        setCodeApplique(null);
        setErreurCode(data.error || "Code invalide.");
      }
    } catch {
      setErreurCode("Erreur réseau, réessayez.");
    } finally {
      setVerificationCode(false);
    }
  };

  const handleRetirerCode = () => {
    setCodeApplique(null);
    setCodeSaisi("");
    setErreurCode("");
  };

  const handleCreerCompte = async (e) => {
    e.preventDefault();
    setChargementAuth(true);
    setErreurAuth("");

    // Le profil est créé automatiquement par la base de données à l'inscription.
    const { error } = await supabase.auth.signUp({
      email: emailAcheteur,
      password: motDePasse,
    });

    if (error) {
      setErreurAuth(error.message);
    } else {
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
      const res = await fetchSession("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles,
          emailAcheteur,
          emailsBeneficiaires,
          utiliserCashback: reductionCashback > 0,
          codeInfluence: codeAffiche ? codeAffiche.code : null,
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

        {!codeAffiche && cashbackAffiche && (cashbackAffiche.disponible > 0 || cashbackAffiche.enAttente > 0) && (
          <div className="mt-8 border border-gold/30 rounded-lg p-4">
            {cashbackAffiche.utilisable > 0 ? (
              <label className="flex items-start gap-3 text-sm text-ivory cursor-pointer">
                <input
                  type="checkbox"
                  checked={utiliserCashback}
                  onChange={(e) => setUtiliserCashback(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Utiliser mon cashback : <span className="text-gold font-semibold">−{euros(cashbackAffiche.utilisable)}</span>
                  <span className="block text-xs text-ivory/50 mt-0.5">
                    {euros(cashbackAffiche.disponible)} disponibles · jusqu&apos;à {cashbackAffiche.regles.plafondPourcent} % de la commande
                  </span>
                  <span className="block text-xs text-ivory/40 mt-0.5">
                    Une commande réglée avec du cashback ne rapporte pas de nouveau cashback.
                  </span>
                </span>
              </label>
            ) : (
              <p className="text-sm text-ivory/60">
                {cashbackAffiche.disponible > 0
                  ? `Vous avez ${euros(cashbackAffiche.disponible)} de cashback, utilisable dès ${cashbackAffiche.regles.commandeMinimum} € de commande.`
                  : `${euros(cashbackAffiche.enAttente)} de cashback en attente, bientôt utilisable.`}
              </p>
            )}
          </div>
        )}

        <div className="mt-8">
          {codeAffiche ? (
            <div className="border border-gold/30 bg-gold/5 rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-ivory">
                  Code <span className="text-gold font-semibold">{codeAffiche.code}</span> appliqué
                  {codeAffiche.influenceuse ? ` (${codeAffiche.influenceuse})` : ""} : vous recevrez{" "}
                  <span className="text-gold font-semibold">{euros(codeAffiche.cashbackAbonne)}</span> de cashback sur votre compte
                  {codeAffiche.cartesConcernees ? ` (sur ${codeAffiche.cartesConcernees.join(", ")})` : ""}.
                </p>
                <button onClick={handleRetirerCode} className="text-xs text-ivory/50 hover:text-ivory underline shrink-0">
                  Retirer
                </button>
              </div>
              <p className="text-xs text-ivory/50 mt-2">
                Ce cashback remplace le cashback fidélité sur cette commande. La commande compte bien pour votre palier.
                Il sera utilisable {cashbackAffiche?.regles?.joursAttente || 14} jours après la livraison de la carte.
              </p>
            </div>
          ) : (
            <form onSubmit={handleAppliquerCode}>
              <label className="block text-sm text-ivory/70 mb-2">Code partenaire</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeSaisi}
                  onChange={(e) => setCodeSaisi(e.target.value.toUpperCase())}
                  placeholder="Ex. : JULIE10"
                  maxLength={20}
                  className="flex-1 min-w-0 bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm uppercase"
                />
                <button
                  type="submit"
                  disabled={!codeSaisi.trim() || verificationCode}
                  className="border border-gold text-gold text-sm font-medium rounded-lg px-4 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40"
                >
                  {verificationCode ? "..." : "Appliquer"}
                </button>
              </div>
              {erreurCode && <p className="mt-2 text-xs text-corail">{erreurCode}</p>}
              {codeApplique && !codeAffiche && utilisateurConnecte && (
                <p className="mt-2 text-xs text-ivory/50">Votre panier a changé : appliquez à nouveau votre code.</p>
              )}
              {!utilisateurConnecte && (
                <p className="mt-1 text-xs text-ivory/40">Un compte est nécessaire : le cashback du code est crédité sur votre compte.</p>
              )}
            </form>
          )}
        </div>

        <button
          onClick={handlePaiement}
          disabled={!emailAcheteur || chargement}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {chargement ? "Redirection..." : `Payer ${euros(totalAPayer)}`}
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
        {reductionCashback > 0 && (
          <div className="mt-4 flex justify-between text-gold text-sm">
            <span>Cashback utilisé</span>
            <span>−{euros(reductionCashback)}</span>
          </div>
        )}
        <div className="mt-4 flex justify-between text-ivory font-semibold text-lg">
          <span>Total</span>
          <span>{euros(totalAPayer)}</span>
        </div>
      </div>

    </div>
  );
}