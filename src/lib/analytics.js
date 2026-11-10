import posthog from "posthog-js";

/**
 * Statistiques PostHog, en mode SANS COOKIE (rien n'est déposé sur l'appareil du visiteur).
 * Hébergement européen. Pas d'enregistrement de session (il faudrait un consentement).
 *
 * La clé PostHog est publique par nature (elle est visible dans le navigateur),
 * on peut donc la laisser ici. On peut aussi la surcharger avec NEXT_PUBLIC_POSTHOG_KEY.
 */
const CLE = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_kmhixc8fTw95PjJyaE3hrpihdMezvRcCAw4qJnnzCmyf";

// Paramètres d'URL qu'on garde (les autres peuvent contenir des données privées : session Stripe, jetons…)
const PARAMS_AUTORISES = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

/** Nettoie une adresse : masque le lien privé d'une carte et retire les paramètres sensibles */
function nettoyerUrl(adresse) {
  if (!adresse || typeof adresse !== "string") return adresse;
  try {
    const url = new URL(adresse);
    // /fr/carte/<jeton> donne accès à une carte cadeau : on ne l'envoie jamais
    url.pathname = url.pathname.replace(/\/carte\/[^/]+/, "/carte/…");
    // Les liens de remboursement restent privés aussi
    url.pathname = url.pathname.replace(/\/remboursement\/[^/]+/, "/remboursement/…");
    const garde = new URLSearchParams();
    for (const p of PARAMS_AUTORISES) {
      const v = url.searchParams.get(p);
      if (v) garde.set(p, v);
    }
    url.search = garde.toString();
    url.hash = "";
    return url.toString();
  } catch {
    return adresse;
  }
}

function suiviRefuse() {
  if (typeof window === "undefined") return true;
  if (window.location.pathname.includes("/admin")) return true;
  // Le visiteur a demandé à ne pas être suivi
  return navigator.doNotTrack === "1" || !!navigator.globalPrivacyControl;
}

let demarre = false;

export function demarrerAnalytics() {
  if (demarre || typeof window === "undefined" || !CLE) return;
  demarre = true;

  posthog.init(CLE, {
    // Passe par le site lui-même (/ingest), pour ne pas être bloqué par les bloqueurs de pub
    api_host: "/ingest",
    ui_host: "https://eu.posthog.com",
    defaults: "2026-08-29",
    cookieless_mode: "always", // aucun cookie, aucun stockage local
    respect_dnt: true,
    disable_session_recording: true,
    capture_pageview: "history_change",
    capture_pageleave: true,
    // Les clics sont comptés, mais jamais le contenu des champs de formulaire (comportement par défaut)
    autocapture: { capture_copied_text: false },
    before_send: (evenement) => {
      if (!evenement) return null;
      const props = evenement.properties || {};
      // Le back-office n'est jamais mesuré
      const page = props.$pathname || props.$current_url || "";
      if (String(page).includes("/admin")) return null;
      for (const cle of ["$current_url", "$referrer", "$initial_current_url", "$initial_referrer"]) {
        if (props[cle]) props[cle] = nettoyerUrl(props[cle]);
      }
      if (props.$pathname) {
        props.$pathname = props.$pathname
          .replace(/\/carte\/[^/]+/, "/carte/…")
          .replace(/\/remboursement\/[^/]+/, "/remboursement/…");
      }
      return evenement;
    },
  });
}

/**
 * Enregistre une étape importante du parcours (ajout au panier, paiement…).
 * Ne fait jamais planter le site, même si PostHog est bloqué.
 * Ne JAMAIS y mettre d'email, de nom, de message ou de code de carte.
 */
export function suivre(nom, proprietes = {}) {
  try {
    if (suiviRefuse()) return;
    posthog.capture(nom, proprietes);
  } catch {
    // rien : les statistiques ne doivent jamais gêner un achat
  }
}
