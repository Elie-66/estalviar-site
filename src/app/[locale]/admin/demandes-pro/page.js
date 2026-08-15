"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";

export default function AdminDemandesPro() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [demandes, setDemandes] = useState([]);
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);

      const { data } = await supabase
        .from("demandes_pro")
        .select("*")
        .order("created_at", { ascending: false });

      setDemandes(data || []);
      setChargement(false);
    };
    verifier();
  }, []);

  const demandesFiltrees = demandes.filter(
    (d) =>
      !recherche ||
      d.entreprise?.toLowerCase().includes(recherche.toLowerCase()) ||
      d.email?.toLowerCase().includes(recherche.toLowerCase()) ||
      d.contact?.toLowerCase().includes(recherche.toLowerCase())
  );

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Demandes professionnelles</h1>

      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher (entreprise, email, contact)..."
        className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm mb-6"
      />

      <p className="text-sm text-ivory/50 mb-4">{demandesFiltrees.length} demande(s)</p>

      <div className="space-y-4">
        {demandesFiltrees.map((d) => (
          <div key={d.id} className="border border-ivory/10 rounded-lg p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-ivory font-medium">{d.entreprise}</p>
                <p className="text-sm text-ivory/60">{d.contact} — {d.email}</p>
                {d.telephone && <p className="text-sm text-ivory/50">{d.telephone}</p>}
              </div>
              <p className="text-xs text-ivory/40">
                {new Date(d.created_at).toLocaleDateString("fr-FR")}
              </p>
            </div>

            {d.quantite && (
              <p className="text-sm text-gold/70 mt-3">Quantité estimée : {d.quantite}</p>
            )}

            {d.message && (
              <p className="text-sm text-ivory/60 mt-2 border-t border-ivory/10 pt-2">{d.message}</p>
            )}

            {d.destinataires && d.destinataires.length > 0 && (
              <details className="mt-3">
                <summary className="text-xs text-gold cursor-pointer">
                  {d.destinataires.length} destinataire(s) fourni(s)
                </summary>
                <ul className="mt-2 text-xs text-ivory/50 space-y-1 pl-4 list-disc">
                  {d.destinataires.map((dest, i) => (
                    <li key={i}>{dest.nom} — {dest.email}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}