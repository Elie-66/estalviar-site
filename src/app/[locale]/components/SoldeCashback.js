"use client";

import { useEffect, useState } from "react";
import { fetchSession } from "../../../lib/fetchSession";

const date = (d) => new Date(d).toLocaleDateString("fr-FR");
const euros = (n) =>
  `${Number(n).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

const LIBELLES = {
  gain: { texte: "Gagné", signe: "+", couleur: "text-vert" },
  utilisation: { texte: "Utilisé", signe: "−", couleur: "text-ivory/70" },
  expiration: { texte: "Expiré", signe: "−", couleur: "text-corail" },
};

export default function SoldeCashback() {
  const [infos, setInfos] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    fetchSession("/api/cashback")
      .then((r) => r.json())
      .then((data) => setInfos(data.connecte ? data : null))
      .catch(() => setInfos(null))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <p className="text-ivory/50 text-sm">Chargement du cashback...</p>;
  if (!infos) return <p className="text-ivory/50 text-sm">Cashback indisponible pour le moment.</p>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gold/30 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ivory/50">Disponible</p>
          <p className="text-3xl font-semibold text-gold mt-1">{euros(infos.disponible)}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-ivory/50">En attente</p>
          <p className="text-3xl font-semibold text-ivory mt-1">{euros(infos.enAttente)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-ivory/50 leading-relaxed">
        Le cashback devient utilisable {infos.regles.joursAttente} jours après votre achat. Il s&apos;utilise dès{" "}
        {infos.regles.commandeMinimum} € de commande, dans la limite de {infos.regles.plafondPourcent} % du montant,
        et reste valable 12 mois. Une commande réglée avec du cashback ne rapporte pas de nouveau cashback.
      </p>

      {infos.prochainesExpirations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm uppercase tracking-wide text-ivory/50 mb-2">Prochaines expirations</h3>
          {infos.prochainesExpirations.map((e, i) => (
            <p key={i} className="text-sm text-ivory/80">
              <span className="text-gold">{euros(e.montant)}</span> expirent le {date(e.expire_le)}
            </p>
          ))}
        </div>
      )}

      {infos.prochainsDeblocages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm uppercase tracking-wide text-ivory/50 mb-2">Bientôt disponible</h3>
          {infos.prochainsDeblocages.map((e, i) => (
            <p key={i} className="text-sm text-ivory/80">
              {euros(e.montant)} utilisables à partir du {date(e.disponible_le)}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm uppercase tracking-wide text-ivory/50 mb-3">Historique</h3>
        {infos.historique.length === 0 ? (
          <p className="text-sm text-ivory/50">
            Pas encore de cashback. Montez en palier Argent pour commencer à en gagner sur vos achats.
          </p>
        ) : (
          <div className="space-y-2">
            {infos.historique.map((m, i) => {
              const l = LIBELLES[m.type] || LIBELLES.gain;
              return (
                <div key={i} className="flex justify-between text-sm border-b border-ivory/5 pb-2">
                  <div>
                    <span className="text-ivory">{l.texte}</span>
                    {m.description && <span className="text-ivory/40"> — {m.description}</span>}
                    <p className="text-xs text-ivory/40">{date(m.date)}</p>
                  </div>
                  <span className={l.couleur}>
                    {l.signe}
                    {euros(m.montant)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
