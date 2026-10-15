"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { peutVoir } from "../../../../lib/accesAdmin";
import { adminLire, adminModifier } from "../../../../lib/adminDb";

const STATUTS = {
  a_traiter: { label: "À traiter", classe: "text-corail border-corail/40" },
  acceptee: { label: "Acceptée (remboursée)", classe: "text-vert border-vert/40" },
  refusee: { label: "Refusée (carte déjà envoyée)", classe: "text-ivory/50 border-ivory/20" },
};

// Date limite de remboursement : 14 jours après réception
const dateLimite = (creeLe) => new Date(new Date(creeLe).getTime() + 14 * 86400000);

export default function AdminRetractations() {
  const [chargement, setChargement] = useState(true);
  const [demandes, setDemandes] = useState([]);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !(await peutVoir("retractations"))) {
        window.location.href = user ? "/fr/admin" : "/fr";
        return;
      }
      const { data, error } = await adminLire("demandes_retractation", "created_at", false);
      if (error) setErreur(error.message);
      setDemandes(data || []);
      setChargement(false);
    };
    charger();
  }, []);

  const changerStatut = async (id, statut) => {
    setErreur("");
    const { error } = await adminModifier("demandes_retractation", id, { statut });
    if (error) return setErreur(error.message);
    setDemandes((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
  };

  if (chargement) {
    return <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">Chargement...</div>;
  }

  const aTraiter = demandes.filter((d) => d.statut === "a_traiter").length;

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2">Rétractations</h1>
      <p className="mt-2 mb-8 text-sm text-ivory/55 max-w-[640px]">
        Si la carte n&apos;a pas encore été envoyée (carte programmée), choisis « Remboursée » sur la carte dans Commandes :
        le client est remboursé sur Stripe et reçoit son avoir, <strong className="text-ivory">au plus tard 14 jours</strong> après la demande. Si le code a déjà été envoyé,
        la rétractation n&apos;est plus possible (case acceptée au paiement) : réponds au client en l&apos;expliquant.
      </p>
      {erreur && <p className="mb-4 text-sm text-corail">{erreur}</p>}
      <p className="text-sm text-ivory/50 mb-4">{demandes.length} demande(s), dont {aTraiter} à traiter</p>

      <div className="space-y-4">
        {demandes.map((d) => {
          const limite = dateLimite(d.created_at);
          const enRetard = d.statut === "a_traiter" && limite < new Date();
          return (
            <div key={d.id} className="border border-ivory/10 rounded-lg p-5">
              <div className="flex flex-wrap justify-between items-start gap-3">
                <div>
                  <p className="text-ivory font-medium">{d.nom} <span className="text-ivory/40 text-xs ml-1">#{d.id.slice(0, 8).toUpperCase()}</span></p>
                  <p className="text-sm text-ivory/60">{d.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-ivory/40">Reçue le {new Date(d.created_at).toLocaleString("fr-FR")}</p>
                  {d.statut === "a_traiter" && (
                    <p className={`text-xs mt-1 ${enRetard ? "text-corail font-medium" : "text-gold/80"}`}>
                      Rembourser avant le {limite.toLocaleDateString("fr-FR")}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-sm text-ivory/75 mt-3 border-t border-ivory/10 pt-3 whitespace-pre-line">{d.commande}</p>
              {d.message && <p className="text-sm text-ivory/55 mt-2 whitespace-pre-line">{d.message}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {Object.entries(STATUTS).map(([cle, s]) => (
                  <button key={cle} type="button" onClick={() => changerStatut(d.id, cle)} aria-pressed={d.statut === cle}
                    className={`text-xs rounded-full border px-3 py-1.5 transition-colors ${
                      d.statut === cle ? `${s.classe} bg-ivory/[0.06] font-medium` : "text-ivory/45 border-ivory/15 hover:border-ivory/35"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
