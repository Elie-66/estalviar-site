"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";

const remises = [
  { min: 1, max: 9, reduction: 0 },
  { min: 10, max: 49, reduction: 0 },
  { min: 50, max: 199, reduction: 0 },
  { min: 200, max: Infinity, reduction: 0 },
];

function trouverRemise(quantite) {
  return remises.find((r) => quantite >= r.min && quantite <= r.max) || remises[0];
}

export default function Professionnels() {
  const [entreprise, setEntreprise] = useState("");
  const [contact, setContact] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [quantite, setQuantite] = useState("");
  const [montantParCarte, setMontantParCarte] = useState("");
  const [message, setMessage] = useState("");
  const [listeDestinataires, setListeDestinataires] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const fichierInputRef = useRef(null);

  const quantiteNum = parseInt(quantite) || 0;
  const montantNum = parseFloat(montantParCarte) || 0;
  const remise = trouverRemise(quantiteNum || 1);
  const sousTotal = quantiteNum * montantNum;
  const total = sousTotal * (1 - remise.reduction);

  const destinatairesParsés = listeDestinataires
    .split("\n")
    .map((ligne) => ligne.trim())
    .filter(Boolean)
    .map((ligne) => {
      const [nom, email] = ligne.split(",").map((v) => v.trim());
      return { nom, email };
    });

  const handleImportExcel = (e) => {
    const fichier = e.target.files[0];
    if (!fichier) return;

    const lecteur = new FileReader();
    lecteur.onload = (evt) => {
      const classeur = XLSX.read(evt.target.result, { type: "binary" });
      const feuille = classeur.Sheets[classeur.SheetNames[0]];
      const lignes = XLSX.utils.sheet_to_json(feuille, { header: 1 });

      const texte = lignes
        .filter((ligne) => ligne.length >= 2 && ligne[0] && ligne[1])
        .map((ligne) => `${ligne[0]}, ${ligne[1]}`)
        .join("\n");

      setListeDestinataires(texte);
    };
    lecteur.readAsBinaryString(fichier);

    e.target.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);

    const res = await fetch('/api/demande-pro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entreprise,
        contact,
        email,
        telephone,
        quantite,
        message: `${message}${montantParCarte ? ` | Montant estimé par carte : ${montantParCarte} €` : ''}`,
        destinataires: destinatairesParsés,
      }),
    });

    setEnvoi(false);
    if (res.ok) {
      setSucces(true);
    }
  };

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-semibold text-ivory">Demande envoyée</h1>
        <p className="mt-4 text-ivory/60">
          Notre équipe revient vers vous sous 48h avec un devis personnalisé.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

      <div>
        <p className="text-sm uppercase tracking-wide text-gold mb-2">Espace professionnel</p>
        <h1 className="text-4xl font-semibold text-ivory leading-tight">
          Des cartes cadeaux pour vos équipes et vos clients.
        </h1>
        <p className="mt-6 text-ivory/70 leading-relaxed">
          Commandez en volume, personnalisez chaque carte, et simplifiez votre gestion administrative avec une facturation unique.
        </p>

        <div className="mt-10 space-y-4">
          <div className="flex gap-3">
            <span className="text-gold">✓</span>
            <p className="text-sm text-ivory/70">Commande groupée, une seule facture</p>
          </div>
          <div className="flex gap-3">
            <span className="text-gold">✓</span>
            <p className="text-sm text-ivory/70">Tarifs dégressifs selon le volume</p>
          </div>
          <div className="flex gap-3">
            <span className="text-gold">✓</span>
            <p className="text-sm text-ivory/70">Import de listes de destinataires</p>
          </div>
        </div>

        <div className="mt-10 border border-ivory/10 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ivory/10 text-ivory/50 text-xs uppercase">
                <th className="text-left px-4 py-2 font-medium">Quantité</th>
                <th className="text-right px-4 py-2 font-medium">Réduction</th>
              </tr>
            </thead>
            <tbody>
              {remises.map((r, i) => (
                <tr key={i} className="border-b border-ivory/5 last:border-0">
                  <td className="px-4 py-2 text-ivory/70">
                    {r.max === Infinity ? `${r.min}+` : `${r.min} à ${r.max}`}
                  </td>
                  <td className="px-4 py-2 text-right text-gold">
                    {r.reduction > 0 ? `${r.reduction * 100}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="border border-ivory/10 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-ivory mb-6">Demander un devis</h2>

        <label className="block text-sm text-ivory/70 mb-2">Entreprise</label>
        <input
          type="text"
          value={entreprise}
          onChange={(e) => setEntreprise(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Nom du contact</label>
        <input
          type="text"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
        />

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-ivory/70 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-ivory/70 mb-2">Téléphone</label>
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-ivory/70 mb-2">Quantité estimée</label>
            <input
              type="number"
              min="1"
              value={quantite}
              onChange={(e) => setQuantite(e.target.value)}
              placeholder="Ex : 50"
              required
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-ivory/70 mb-2">Montant par carte (€)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={montantParCarte}
              onChange={(e) => setMontantParCarte(e.target.value)}
              placeholder="Ex : 30"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
          </div>
        </div>

        {quantiteNum > 0 && montantNum > 0 && (
          <div className="mt-4 border border-gold/20 bg-gold/5 rounded-lg p-4 text-sm">
            <div className="flex justify-between text-ivory/70">
              <span>Sous-total</span>
              <span>{sousTotal.toFixed(2)} €</span>
            </div>
            {remise.reduction > 0 && (
              <div className="flex justify-between text-gold mt-1">
                <span>Réduction ({remise.reduction * 100}%)</span>
                <span>-{(sousTotal - total).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-ivory font-semibold mt-2 pt-2 border-t border-gold/20">
              <span>Estimation</span>
              <span>{total.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-ivory/40 mt-2">
              Ceci est une simulation. Les tarifs exacts vous seront communiqués par email après étude de votre besoin.
            </p>
          </div>
        )}

        <label className="block text-sm text-ivory/70 mb-2 mt-4">
          Liste des destinataires (facultatif)
        </label>
        <textarea
          value={listeDestinataires}
          onChange={(e) => setListeDestinataires(e.target.value)}
          rows={4}
          placeholder={"Un destinataire par ligne, au format :\nNom, email@exemple.com"}
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm resize-none font-mono"
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-gold/70">
            {destinatairesParsés.length > 0
              ? `${destinatairesParsés.length} destinataire${destinatairesParsés.length > 1 ? "s" : ""} détecté${destinatairesParsés.length > 1 ? "s" : ""}`
              : ""}
          </p>
          <div>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fichierInputRef}
              onChange={handleImportExcel}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fichierInputRef.current?.click()}
              className="text-xs text-ivory/50 hover:text-gold underline transition-colors"
            >
              Importer un Excel
            </button>
          </div>
        </div>

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Votre besoin</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Décrivez votre besoin (occasion, budget, délai...)"
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm resize-none"
        />

        <button
          type="submit"
          disabled={envoi}
          className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {envoi ? "Envoi..." : "Envoyer ma demande"}
        </button>
      </form>

    </div>
  );
}