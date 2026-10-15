"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";
import { fetchAdmin } from "../../../../lib/fetchAdmin";
import { telechargerFacture } from "../../../../lib/telechargerFacture";

const euros = (n) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(n) || 0);
const dateFr = (d) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });
const moisDe = (d) => new Date(d).toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }).slice(0, 7); // 2026-10

/** Livre des recettes (obligatoire en micro-entreprise) au format CSV, lisible par Excel */
function exporterCsv(factures, mois) {
  const lignes = factures
    .filter((f) => !mois || moisDe(f.emise_le) === mois)
    .slice()
    .reverse()
    .map((f) => [
      dateFr(f.emise_le),
      f.numero,
      f.client?.societe || f.email_client,
      f.type === "contribution" ? "Participation cagnotte" : `Cartes cadeaux (${(f.lignes || []).length})`,
      Number(f.total).toFixed(2).replace(".", ","),
      Number(f.paye_carte).toFixed(2).replace(".", ","),
      Number(f.paye_cashback).toFixed(2).replace(".", ","),
      "Carte bancaire (Stripe)",
    ]);
  const entete = ["Date", "Facture", "Client", "Nature", "Montant total", "Encaissé par carte", "Réglé en cashback", "Mode de règlement"];
  const csv = [entete, ...lignes]
    .map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    .join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `livre-des-recettes-${mois || "complet"}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export default function AdminFactures() {
  const [chargement, setChargement] = useState(true);
  const [factures, setFactures] = useState([]);
  const [erreur, setErreur] = useState("");
  const [mois, setMois] = useState("");
  const [recherche, setRecherche] = useState("");

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      const res = await fetchAdmin("/api/factures?admin=1");
      const json = await res.json().catch(() => ({}));
      if (!res.ok) setErreur(json.error || "Erreur de chargement");
      setFactures(json.factures || []);
      setChargement(false);
    };
    charger();
  }, []);

  const listeMois = useMemo(() => [...new Set(factures.map((f) => moisDe(f.emise_le)))], [factures]);
  const visibles = factures.filter((f) => {
    if (mois && moisDe(f.emise_le) !== mois) return false;
    const q = recherche.trim().toLowerCase();
    return !q || f.numero.toLowerCase().includes(q) || f.email_client.toLowerCase().includes(q) || (f.client?.societe || "").toLowerCase().includes(q);
  });
  const encaisse = visibles.reduce((s, f) => s + Number(f.paye_carte), 0);
  const total = visibles.reduce((s, f) => s + Number(f.total), 0);

  if (chargement) {
    return <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">Chargement...</div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2">Factures</h1>
      <p className="mt-2 mb-8 text-sm text-ivory/55 max-w-[680px]">
        Une facture est créée et envoyée automatiquement à chaque paiement. Elle ne se modifie jamais : pour corriger
        ou rembourser, fais un avoir. L&apos;export CSV sert de livre des recettes (à garder 10 ans).
      </p>
      {erreur && <p className="mb-4 text-sm text-corail">{erreur}</p>}

      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label htmlFor="f-mois" className="block text-xs text-ivory/55 mb-1.5">Mois</label>
          <select id="f-mois" value={mois} onChange={(e) => setMois(e.target.value)}
            className="bg-ink border border-ivory/20 rounded-lg px-3 py-2 text-sm text-ivory">
            <option value="">Tous</option>
            {listeMois.map((m) => (
              <option key={m} value={m}>
                {new Date(`${m}-15T12:00:00Z`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label htmlFor="f-recherche" className="block text-xs text-ivory/55 mb-1.5">Rechercher</label>
          <input id="f-recherche" type="search" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Numéro, email ou société"
            className="w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-3 py-2 text-sm text-ivory placeholder:text-ivory/35" />
        </div>
        <button type="button" onClick={() => exporterCsv(factures, mois)} disabled={factures.length === 0}
          className="bg-gold text-ink text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-gold/90 disabled:opacity-40">
          Exporter le livre des recettes
        </button>
      </div>

      <p className="text-sm text-ivory/60 mb-3">
        {visibles.length} facture{visibles.length > 1 ? "s" : ""}, {euros(total)} au total dont <span className="text-ivory">{euros(encaisse)} encaissés par carte</span>
      </p>

      <div className="overflow-x-auto border border-ivory/10 rounded-lg">
        <table className="w-full text-sm">
          <thead className="text-left text-ivory/55 border-b border-ivory/10">
            <tr>
              <th className="font-medium px-4 py-3">Numéro</th>
              <th className="font-medium px-4 py-3">Date</th>
              <th className="font-medium px-4 py-3">Client</th>
              <th className="font-medium px-4 py-3 text-right">Total</th>
              <th className="font-medium px-4 py-3 text-right">Cashback</th>
              <th className="px-4 py-3"><span className="sr-only">PDF</span></th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={f.numero} className="border-b border-ivory/5 last:border-0">
                <td className="px-4 py-3 text-ivory whitespace-nowrap">{f.numero}</td>
                <td className="px-4 py-3 text-ivory/70 whitespace-nowrap">{dateFr(f.emise_le)}</td>
                <td className="px-4 py-3 text-ivory/70">
                  {f.client?.societe && <span className="block text-ivory">{f.client.societe}</span>}
                  <span className="break-all">{f.email_client}</span>
                  {f.type === "contribution" && <span className="block text-xs text-ivory/45">Participation cagnotte</span>}
                </td>
                <td className="px-4 py-3 text-right text-ivory whitespace-nowrap">{euros(f.total)}</td>
                <td className="px-4 py-3 text-right text-ivory/55 whitespace-nowrap">{Number(f.paye_cashback) > 0 ? `- ${euros(f.paye_cashback)}` : ""}</td>
                <td className="px-4 py-3 text-right">
                  <button type="button" onClick={() => telechargerFacture(f.numero, fetchAdmin).catch(() => setErreur("Téléchargement impossible"))}
                    className="text-gold hover:underline whitespace-nowrap">PDF</button>
                </td>
              </tr>
            ))}
            {visibles.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-ivory/50">Aucune facture pour l&apos;instant.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
