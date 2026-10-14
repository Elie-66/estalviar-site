"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { fetchSession } from "../../../lib/fetchSession";

const STYLES = {
  gain: { signe: "+", couleur: "text-vert" },
  utilisation: { signe: "−", couleur: "text-ivory/70" },
  expiration: { signe: "−", couleur: "text-corail" },
  annulation: { signe: "−", couleur: "text-corail" },
};

export default function SoldeCashback() {
  const t = useTranslations("soldeCashback");
  const locale = useLocale();
  const [infos, setInfos] = useState(null);
  const [chargement, setChargement] = useState(true);
  const date = (d) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(n) || 0);

  useEffect(() => {
    fetchSession("/api/cashback")
      .then((r) => r.json())
      .then((data) => setInfos(data.connecte ? data : null))
      .catch(() => setInfos(null))
      .finally(() => setChargement(false));
  }, []);

  if (chargement) return <p className="text-ivory/50 text-sm">{t("chargement")}</p>;
  if (!infos) return <p className="text-ivory/50 text-sm">{t("indisponible")}</p>;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-gold/30 rounded-xl p-5">
          <p className="text-xs text-ivory/55">{t("disponible")}</p>
          <p className="text-3xl font-semibold text-gold mt-1">{euros(infos.disponible)}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/55">{t("enAttente")}</p>
          <p className="text-3xl font-semibold text-ivory mt-1">{euros(infos.enAttente)}</p>
        </div>
      </div>

      <p className="mt-4 text-xs text-ivory/55 leading-relaxed">
        {t("regles", {
          jours: infos.regles.joursAttente,
          min: infos.regles.commandeMinimum,
          max: infos.regles.plafondPourcent,
        })}{" "}
        <a href={`/${locale}/fidelite`} className="text-gold underline underline-offset-2">{t("enSavoirPlus")}</a>
      </p>

      {infos.prochainesExpirations.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-ivory mb-2">{t("expirations")}</h3>
          {infos.prochainesExpirations.map((e, i) => (
            <p key={i} className="text-sm text-ivory/80">
              {t.rich("expireLe", { montant: euros(e.montant), date: date(e.expire_le), m: (c) => <span className="text-gold">{c}</span> })}
            </p>
          ))}
        </div>
      )}

      {infos.prochainsDeblocages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-ivory mb-2">{t("bientot")}</h3>
          {infos.prochainsDeblocages.map((e, i) => (
            <p key={i} className="text-sm text-ivory/80">
              {t("utilisableLe", { montant: euros(e.montant), date: date(e.disponible_le) })}
            </p>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-medium text-ivory mb-3">{t("historique")}</h3>
        {infos.historique.length === 0 ? (
          <p className="text-sm text-ivory/55">{t("aucun")}</p>
        ) : (
          <div className="space-y-2">
            {infos.historique.map((m, i) => {
              const s = STYLES[m.type] || STYLES.gain;
              return (
                <div key={i} className="flex justify-between gap-4 text-sm border-b border-ivory/5 pb-2">
                  <div className="min-w-0">
                    <span className="text-ivory">{t.has(`type_${m.type}`) ? t(`type_${m.type}`) : m.type}</span>
                    {m.description && <span className="text-ivory/45"> · {m.description}</span>}
                    <p className="text-xs text-ivory/45">{date(m.date)}</p>
                  </div>
                  <span className={`${s.couleur} whitespace-nowrap`}>{s.signe}{euros(m.montant)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
