"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Compte les pages vues (statistiques de l'admin), sans cookie ni stockage sur l'appareil.
 * À la première page, on transmet le site d'origine ; ensuite, la navigation reste « interne ».
 */
export default function MesureAudience() {
  const chemin = usePathname();
  const premiere = useRef(true);

  useEffect(() => {
    if (!chemin || chemin.includes("/admin")) return;
    // Le visiteur a demandé à ne pas être suivi
    if (navigator.doNotTrack === "1" || navigator.globalPrivacyControl) return;
    const params = new URLSearchParams(window.location.search);
    const utm = {
      source: params.get("utm_source"),
      medium: params.get("utm_medium"),
      campaign: params.get("utm_campaign"),
    };
    const corps = JSON.stringify({
      chemin,
      referent: premiere.current ? document.referrer : window.location.origin,
      utm: premiere.current ? utm : {},
    });
    premiere.current = false;
    try {
      const envoye = navigator.sendBeacon?.("/api/visite", new Blob([corps], { type: "application/json" }));
      if (!envoye) fetch("/api/visite", { method: "POST", body: corps, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    } catch {}
  }, [chemin]);

  return null;
}
