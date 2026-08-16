"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function DefilementLogos() {
  const [logos, setLogos] = useState([]);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("catalogue")
        .select("nom, image")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      setLogos(data || []);
    };
    charger();
  }, []);

  if (logos.length === 0) return null;

  const logosDoubles = [...logos, ...logos];

  return (
    <div className="overflow-hidden border-t border-ivory/10 py-10 bg-ivory/[0.03]">
      <div className="flex gap-16 w-max animate-defilement">
       {logosDoubles.map((logo, i) => (
          <div key={i} className="flex items-center justify-center h-14 w-28 flex-shrink-0 bg-white rounded-lg opacity-80 hover:opacity-100 transition-opacity">
            <img
              src={logo.image}
              alt={logo.nom}
              className="h-6 w-20 object-contain"
            />
          </div>
        ))}
      </div>
    </div>
  );
}