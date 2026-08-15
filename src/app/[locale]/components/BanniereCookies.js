"use client";

import { useState, useEffect } from "react";

export default function BanniereCookies() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consentement = localStorage.getItem("estalviar-cookies-consentement");
    if (!consentement) {
      setVisible(true);
    }
  }, []);

  const accepter = () => {
    localStorage.setItem("estalviar-cookies-consentement", "accepte");
    setVisible(false);
  };

  const refuser = () => {
    localStorage.setItem("estalviar-cookies-consentement", "refuse");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-ink-secondary border-t border-gold/20 px-6 py-5">
      <div className="max-w-[1240px] mx-auto flex flex-col sm:flex-row items-center gap-4 justify-between">
        <p className="text-sm text-ivory/70">
          Nous utilisons des cookies nécessaires au fonctionnement du site (connexion, panier) et de préférence
          (langue). Consultez notre{" "}
          <a href="/fr/cookies" className="text-gold hover:underline">
            politique de cookies
          </a>{" "}
          pour en savoir plus.
        </p>
        <div className="flex gap-3 flex-shrink-0">
          <button
            onClick={refuser}
            className="text-sm text-ivory/60 hover:text-ivory border border-ivory/20 rounded-lg px-4 py-2 transition-colors"
          >
            Refuser
          </button>
          <button
            onClick={accepter}
            className="text-sm bg-gold text-ink font-semibold rounded-lg px-4 py-2 hover:bg-gold/90 transition-colors"
          >
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
