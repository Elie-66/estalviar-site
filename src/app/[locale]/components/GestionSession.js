"use client";

import { useEffect, useRef } from "react";
import { supabase } from "../../../lib/supabase";

const DUREE_INACTIVITE_MS = 30 * 60 * 1000; // 30 minutes

export default function GestionSession() {
  const minuteurRef = useRef(null);

  useEffect(() => {
    const reinitialiserMinuteur = () => {
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
      minuteurRef.current = setTimeout(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.signOut();
          window.location.href = "/fr/connexion";
        }
      }, DUREE_INACTIVITE_MS);
    };

    const evenements = ["mousedown", "keydown", "scroll", "touchstart"];
    evenements.forEach((ev) => window.addEventListener(ev, reinitialiserMinuteur));

    reinitialiserMinuteur();

    return () => {
      evenements.forEach((ev) => window.removeEventListener(ev, reinitialiserMinuteur));
      if (minuteurRef.current) clearTimeout(minuteurRef.current);
    };
  }, []);

  return null;
}