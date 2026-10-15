"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { fetchAdmin } from "../../../../../lib/fetchAdmin";

const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
const dateHeure = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" });

export default function PageValidation() {
  return (
    <Suspense fallback={null}>
      <Validation />
    </Suspense>
  );
}

/** Page ouverte depuis l'email « Remboursement à valider » (propriétaire) */
function Validation() {
  const { id } = useParams();
  const jeton = useSearchParams().get("jeton");
  const [infos, setInfos] = useState(null);
  const [erreur, setErreur] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams({ id: String(id) });
    if (jeton) params.set("jeton", jeton);
    fetchAdmin(`/api/valider-remboursement?${params}`)
      .then(async (r) => {
        const json = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(json.error || "Lien invalide ou expiré");
        setInfos(json);
      })
      .catch((e) => setErreur(e.message));
  }, [id, jeton]);

  const decider = async (action) => {
    if (action === "valider" && !window.confirm("Confirmer le remboursement ?")) return;
    setEnvoi(true);
    setErreur("");
    const res = await fetchAdmin("/api/valider-remboursement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, jeton, action }),
    });
    const json = await res.json().catch(() => ({}));
    setEnvoi(false);
    if (!res.ok) return setErreur(json.error || "Erreur");
    setResultat({ action, ...json });
  };

  const d = infos?.demande;
  const c = infos?.commande;
  const marque = String(c?.marque || "").replace(/^Cagnotte\s*/i, "");

  return (
    <div className="max-w-[640px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory">Remboursement à valider</h1>

      {!infos && !erreur && <p className="mt-6 text-ivory/60">Chargement...</p>}
      {erreur && <p role="alert" className="mt-6 text-corail">{erreur}</p>}

      {d && c && (
        <>
          <dl className="mt-8 divide-y divide-ivory/10 border-y border-ivory/10 text-sm">
            {[
              ["Demandé par", d.demande_par],
              ["Le", dateHeure(d.cree_le)],
              ["Carte", `${marque} de ${euros(c.montant)}${c.beneficiaire ? ` pour ${c.beneficiaire}` : ""}`],
              ["Acheteur", c.email_acheteur],
              ["À rembourser", `${euros(d.montant)} ${d.via_stripe ? "sur la carte bancaire du client (Stripe)" : "(déjà remboursé dans Stripe : avoir seulement)"}`],
              d.motif ? ["Motif", d.motif] : null,
            ].filter(Boolean).map(([nom, valeur]) => (
              <div key={nom} className="py-3 grid grid-cols-[130px_1fr] gap-4">
                <dt className="text-ivory/55">{nom}</dt>
                <dd className="text-ivory break-words">{valeur}</dd>
              </div>
            ))}
          </dl>

          {d.malgre_envoi && (
            <p className="mt-5 text-sm text-corail border border-corail/40 rounded-lg p-3">
              Le code de cette carte a déjà été envoyé et reste utilisable chez l&apos;enseigne : ce remboursement est un geste commercial.
            </p>
          )}

          {resultat ? (
            <p role="status" className={`mt-8 ${resultat.action === "valider" ? "text-vert" : "text-ivory/80"}`}>
              {resultat.action === "valider"
                ? `Remboursement effectué${resultat.stripe ? " sur Stripe" : ""}${resultat.avoir ? `, avoir ${resultat.avoir} envoyé au client` : ""}.`
                : "Demande refusée : la carte reprend son cours normal."}
            </p>
          ) : d.statut !== "en_attente" ? (
            <p className="mt-8 text-ivory/70">
              Cette demande a déjà été {d.statut === "validee" ? "validée" : d.statut === "refusee" ? "refusée" : "traitée"}
              {d.traitee_le ? ` le ${dateHeure(d.traitee_le)}` : ""}.
            </p>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" disabled={envoi} onClick={() => decider("valider")}
                  className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 disabled:opacity-40">
                  {envoi ? "..." : `Valider le remboursement de ${euros(d.montant)}`}
                </button>
                <button type="button" disabled={envoi} onClick={() => decider("refuser")}
                  className="border border-ivory/25 text-ivory rounded-lg px-6 py-3 hover:border-ivory/50 disabled:opacity-40">
                  Refuser
                </button>
              </div>
              <p className="mt-4 text-xs text-ivory/45">
                En cas de refus, la carte reprend son cours : son code est envoyé à la date prévue. Lien valable jusqu&apos;au {dateHeure(d.expire_le)}.
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
