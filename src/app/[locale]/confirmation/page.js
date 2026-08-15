"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePanier } from "../context/PanierContext";

export default function Confirmation() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { articles, videPanier, charge } = usePanier();
  const [statut, setStatut] = useState("chargement");
  const [envoye, setEnvoye] = useState(false);

  useEffect(() => {
    if (!sessionId || !charge || envoye) return;
    setEnvoye(true);

    const enregistrerCommande = async () => {
      try {
        const emailsBeneficiaires = JSON.parse(
          localStorage.getItem("estalviar-emails-beneficiaires") || "{}"
        );
        const res = await fetch("/api/enregistrer-commande", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, articles, emailsBeneficiaires }),
        });
        localStorage.removeItem("estalviar-emails-beneficiaires");
        if (res.ok) {
          setStatut("succes");
          videPanier();
        } else {
          setStatut("erreur");
        }
      } catch (e) {
        setStatut("erreur");
      }
    };

    enregistrerCommande();
  }, [sessionId, charge, envoye]);

  return (
    <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
      {statut === "chargement" && (
        <p className="text-ivory/60">Confirmation en cours...</p>
      )}
      {statut === "succes" && (
        <>
          <div className="text-5xl mb-4">✓</div>
          <h1 className="text-3xl font-semibold text-ivory">Merci pour votre commande !</h1>
          <p className="mt-4 text-ivory/60">
            Un email de confirmation vous a été envoyé. Vos cartes cadeaux seront livrées selon les dates choisies.
          </p>
        </>
      )}
      {statut === "erreur" && (
        <>
          <h1 className="text-3xl font-semibold text-ivory">Un problème est survenu</h1>
          <p className="mt-4 text-ivory/60">
            Votre paiement a peut-être été accepté, mais nous n'avons pas pu confirmer votre commande. Contactez-nous.
          </p>
        </>
      )}
      <a
        href="/fr/boutique"
        className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
      >
        Retour à la boutique
      </a>
    </div>
  );
}