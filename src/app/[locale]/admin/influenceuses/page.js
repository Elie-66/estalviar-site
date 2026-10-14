"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { estAdmin } from "../../../../lib/admin";
import { adminLire, adminAjouter, adminModifier } from "../../../../lib/adminDb";
import { fetchAdmin } from "../../../../lib/fetchAdmin";

const JOURS_ATTENTE = 14; // commission payable 14 jours après la livraison de la carte (comme le cashback)
const euros = (n) =>
  `${Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
const somme = (liste, champ) => liste.reduce((s, x) => s + Number(x[champ] || 0), 0);
// Date fixée au paiement (livraison + 14 jours) ; anciennes ventes : date de commande + 14 jours
const payableLe = (u) =>
  u.payable_le ? new Date(u.payable_le) : new Date(new Date(u.created_at).getTime() + JOURS_ATTENTE * 86400000);

const FORMULAIRE_VIDE = {
  code: "", influenceuse: "", email: "", reseau: "", notes: "",
  parClient: "1", nbParClient: "2", valideDu: "", valideJusquau: "", maxTotal: "",
  portee: "toutes", categories: [], marques: [],
};
const MARGE_MINIMUM_CODE = 3; // en dessous, le code ne rapporte rien (voir lib/codeInfluence.js)

// Dates : le formulaire travaille en jours (AAAA-MM-JJ), la base en date + heure
const pad = (n) => String(n).padStart(2, "0");
const versChampDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const debutJour = (jour) => (jour ? new Date(`${jour}T00:00:00`).toISOString() : null);
const finJour = (jour) => (jour ? new Date(`${jour}T23:59:59`).toISOString() : null);
const dateFr = (iso) => new Date(iso).toLocaleDateString("fr-FR");

// Résumé lisible des conditions d'un code
function resumeConditions(c) {
  const parties = [];
  if (c.max_par_compte == null) parties.push("illimité par client");
  else parties.push(c.max_par_compte === 1 ? "1 fois par client" : `${c.max_par_compte} fois par client`);
  if (c.valide_du && c.valide_jusqu_au) parties.push(`du ${dateFr(c.valide_du)} au ${dateFr(c.valide_jusqu_au)}`);
  else if (c.valide_du) parties.push(`à partir du ${dateFr(c.valide_du)}`);
  else if (c.valide_jusqu_au) parties.push(`jusqu'au ${dateFr(c.valide_jusqu_au)}`);
  else parties.push("sans limite de date");
  parties.push(c.max_utilisations ? `${c.max_utilisations} utilisations max au total` : "quantité illimitée");
  return parties.join(" · ");
}

function resumeCartes(c, nomParSlug) {
  const categories = c.categories || [];
  const marques = c.marques || [];
  if (categories.length === 0 && marques.length === 0) return "Toutes les cartes";
  const parties = [];
  if (categories.length) parties.push(`Catégories : ${categories.join(", ")}`);
  if (marques.length) {
    const noms = marques.map((m) => nomParSlug[m] || m);
    parties.push(`Marques : ${noms.slice(0, 8).join(", ")}${noms.length > 8 ? ` + ${noms.length - 8} autres` : ""}`);
  }
  return parties.join(" · ");
}

// État du code aujourd'hui
function etatCode(c, nbUtilisations, maintenant) {
  if (!c.actif) return { texte: "désactivé", couleur: "text-corail" };
  if (c.valide_du && maintenant < new Date(c.valide_du)) return { texte: "à venir", couleur: "text-ivory/50" };
  if (c.valide_jusqu_au && maintenant > new Date(c.valide_jusqu_au)) return { texte: "expiré", couleur: "text-corail" };
  if (c.max_utilisations && nbUtilisations >= c.max_utilisations) return { texte: "épuisé", couleur: "text-corail" };
  return { texte: "actif", couleur: "text-green-400" };
}

export default function AdminInfluenceuses() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [codes, setCodes] = useState([]);
  const [utilisations, setUtilisations] = useState([]);
  const [emails, setEmails] = useState({});
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [message, setMessage] = useState("");
  const [ouvert, setOuvert] = useState(null);
  const [enEdition, setEnEdition] = useState(null); // code en cours de modification
  const [catalogue, setCatalogue] = useState([]);
  const [marges, setMarges] = useState({});
  const [rechercheMarque, setRechercheMarque] = useState("");

  const charger = async () => {
    const [{ data: c }, { data: u }, { data: p }, { data: cat }, reponseMarges] = await Promise.all([
      adminLire("codes_influence", "created_at", false),
      adminLire("utilisations_code", "created_at", false),
      adminLire("profils"),
      adminLire("catalogue", "nom", true),
      fetchAdmin("/api/admin-marges").then((r) => r.json()).catch(() => ({})),
    ]);
    setCatalogue(cat || []);
    const m = {};
    (reponseMarges.marges || []).forEach((x) => { m[x.slug] = Number(x.marge); });
    setMarges(m);
    setCodes(c || []);
    // Commission réellement due = commission − part annulée (cartes remboursées)
    setUtilisations((u || []).map((x) => ({
      ...x,
      commission_brute: Number(x.commission) || 0,
      commission: Math.max(0, (Number(x.commission) || 0) - (Number(x.commission_annulee) || 0)),
    })));
    const parId = {};
    (p || []).forEach((x) => { parId[x.id] = x.email; });
    setEmails(parId);
  };

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }
      setAutorise(true);
      await charger();
      setChargement(false);
    };
    verifier();
  }, []);

  // Conditions du formulaire → colonnes de la base (ou message d'erreur)
  const lireConditions = () => {
    let maxParCompte = 1;
    if (formulaire.parClient === "illimite") maxParCompte = null;
    if (formulaire.parClient === "n") {
      maxParCompte = parseInt(formulaire.nbParClient, 10);
      if (!(maxParCompte >= 1)) return { erreur: "Indique combien de fois un client peut utiliser le code." };
    }
    let maxTotal = null;
    if (String(formulaire.maxTotal).trim()) {
      maxTotal = parseInt(formulaire.maxTotal, 10);
      if (!(maxTotal >= 1)) return { erreur: "La quantité totale doit être un nombre supérieur à 0." };
    }
    if (formulaire.valideDu && formulaire.valideJusquau && formulaire.valideDu > formulaire.valideJusquau) {
      return { erreur: "La date de fin doit être après la date de début." };
    }
    const restreint = formulaire.portee === "certaines";
    if (restreint && formulaire.categories.length === 0 && formulaire.marques.length === 0) {
      return { erreur: "Coche au moins une catégorie ou une marque (ou choisis « Toutes les cartes »)." };
    }
    return {
      conditions: {
        categories: restreint && formulaire.categories.length ? formulaire.categories : null,
        marques: restreint && formulaire.marques.length ? formulaire.marques : null,
        max_par_compte: maxParCompte,
        max_utilisations: maxTotal,
        valide_du: debutJour(formulaire.valideDu),
        valide_jusqu_au: finJour(formulaire.valideJusquau),
      },
    };
  };

  const enregistrerCode = async (e) => {
    e.preventDefault();
    setMessage("");
    const { erreur, conditions } = lireConditions();
    if (erreur) {
      setMessage(erreur);
      return;
    }
    const infos = {
      influenceuse: formulaire.influenceuse.trim(),
      email: formulaire.email.trim() || null,
      reseau: formulaire.reseau.trim() || null,
      notes: formulaire.notes.trim() || null,
      ...conditions,
    };

    if (enEdition) {
      const { error } = await adminModifier("codes_influence", enEdition.id, infos);
      if (error) {
        setMessage("Erreur : " + error.message);
        return;
      }
      setMessage(`Code ${enEdition.code} modifié.`);
    } else {
      const code = formulaire.code.trim().toUpperCase().replace(/\s+/g, "");
      if (!/^[A-Z0-9_-]{3,20}$/.test(code)) {
        setMessage("Le code doit faire 3 à 20 caractères : lettres, chiffres, - ou _ (sans accents ni espaces).");
        return;
      }
      if (codes.some((c) => c.code === code)) {
        setMessage("Ce code existe déjà.");
        return;
      }
      const { error } = await adminAjouter("codes_influence", { code, ...infos });
      if (error) {
        setMessage("Erreur : " + error.message);
        return;
      }
      setMessage(`Code ${code} créé.`);
    }
    setFormulaire(FORMULAIRE_VIDE);
    setEnEdition(null);
    await charger();
  };

  const commencerEdition = (c) => {
    setEnEdition(c);
    setMessage("");
    setFormulaire({
      code: c.code,
      influenceuse: c.influenceuse || "",
      email: c.email || "",
      reseau: c.reseau || "",
      notes: c.notes || "",
      parClient: c.max_par_compte == null ? "illimite" : c.max_par_compte === 1 ? "1" : "n",
      nbParClient: c.max_par_compte > 1 ? String(c.max_par_compte) : "2",
      valideDu: versChampDate(c.valide_du),
      valideJusquau: versChampDate(c.valide_jusqu_au),
      maxTotal: c.max_utilisations ? String(c.max_utilisations) : "",
      portee: (c.categories?.length || c.marques?.length) ? "certaines" : "toutes",
      categories: c.categories || [],
      marques: c.marques || [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerEdition = () => {
    setEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
    setMessage("");
  };

  const basculerActif = async (c) => {
    await adminModifier("codes_influence", c.id, { actif: !c.actif });
    await charger();
  };

  const marquerPayee = async (liste) => {
    const aPayer = liste.filter((u) => u.statut === "due");
    if (aPayer.length === 0) return;
    const total = somme(aPayer, "commission");
    if (!window.confirm(`Marquer ${aPayer.length} commission(s) comme payée(s), soit ${euros(total)} ?`)) return;
    const maintenant = new Date().toISOString();
    for (const u of aPayer) {
      await adminModifier("utilisations_code", u.id, { statut: "payee", payee_le: maintenant });
    }
    await charger();
  };

  const basculerDansListe = (champ, valeur) => {
    const liste = formulaire[champ];
    setFormulaire({
      ...formulaire,
      [champ]: liste.includes(valeur) ? liste.filter((x) => x !== valeur) : [...liste, valeur],
    });
  };

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const nomParSlug = {};
  catalogue.forEach((c) => { nomParSlug[c.slug] = c.nom; });
  const toutesCategories = [...new Set(catalogue.map((c) => c.categorie).filter(Boolean))].sort();
  const marquesFiltrees = catalogue.filter(
    (c) => !rechercheMarque || c.nom.toLowerCase().includes(rechercheMarque.toLowerCase())
  );

  const maintenant = new Date();
  const actives = utilisations.filter((u) => u.statut !== "annulee");
  const totalDue = somme(actives.filter((u) => u.statut === "due"), "commission");
  const totalPayable = somme(
    actives.filter((u) => u.statut === "due" && payableLe(u) <= maintenant),
    "commission"
  );

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2 mb-8">Influenceuses</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Ventes avec code</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{actives.length}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Chiffre d&apos;affaires</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{euros(somme(actives, "montant_commande"))}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Commissions dues</p>
          <p className="text-2xl font-semibold text-gold mt-1">{euros(totalDue)}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Dont payables</p>
          <p className="text-2xl font-semibold text-gold mt-1">{euros(totalPayable)}</p>
          <p className="text-[11px] text-ivory/40 mt-1">cartes livrées depuis plus de {JOURS_ATTENTE} jours</p>
        </div>
      </div>

      <form onSubmit={enregistrerCode} className="border border-ivory/10 rounded-xl p-6 mb-10">
        <p className="text-ivory font-medium mb-4">
          {enEdition ? <>Modifier le code <span className="text-gold">{enEdition.code}</span></> : "Nouveau code"}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            required
            disabled={!!enEdition}
            value={formulaire.code}
            onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value.toUpperCase() })}
            placeholder="Code (ex. JULIE10)"
            maxLength={20}
            className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm uppercase disabled:opacity-40"
          />
          <input
            required
            value={formulaire.influenceuse}
            onChange={(e) => setFormulaire({ ...formulaire, influenceuse: e.target.value })}
            placeholder="Nom de l'influenceuse"
            className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />
          <input
            type="email"
            value={formulaire.email}
            onChange={(e) => setFormulaire({ ...formulaire, email: e.target.value })}
            placeholder="Email (facultatif)"
            className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />
          <input
            value={formulaire.reseau}
            onChange={(e) => setFormulaire({ ...formulaire, reseau: e.target.value })}
            placeholder="Réseau / compte (ex. Instagram @julie)"
            className="bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />
          <input
            value={formulaire.notes}
            onChange={(e) => setFormulaire({ ...formulaire, notes: e.target.value })}
            placeholder="Notes (IBAN reçu, accord signé…)"
            className="sm:col-span-2 bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
          />
        </div>

        <p className="text-sm text-ivory/70 mt-6 mb-3">Conditions d&apos;utilisation</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-ivory/50 mb-1.5">Par client</label>
            <select
              value={formulaire.parClient}
              onChange={(e) => setFormulaire({ ...formulaire, parClient: e.target.value })}
              className="w-full bg-ink border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm"
            >
              <option value="1">1 seule fois</option>
              <option value="n">Nombre de fois limité…</option>
              <option value="illimite">Illimité</option>
            </select>
            {formulaire.parClient === "n" && (
              <input
                type="number"
                min={1}
                value={formulaire.nbParClient}
                onChange={(e) => setFormulaire({ ...formulaire, nbParClient: e.target.value })}
                placeholder="Nombre de fois"
                className="mt-2 w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm"
              />
            )}
          </div>
          <div>
            <label className="block text-xs text-ivory/50 mb-1.5">Période (facultatif)</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={formulaire.valideDu}
                onChange={(e) => setFormulaire({ ...formulaire, valideDu: e.target.value })}
                className="w-full min-w-0 bg-transparent border border-ivory/20 rounded-lg px-2 py-2 text-ivory text-xs [color-scheme:dark]"
              />
              <span className="text-ivory/40 text-xs">au</span>
              <input
                type="date"
                value={formulaire.valideJusquau}
                onChange={(e) => setFormulaire({ ...formulaire, valideJusquau: e.target.value })}
                className="w-full min-w-0 bg-transparent border border-ivory/20 rounded-lg px-2 py-2 text-ivory text-xs [color-scheme:dark]"
              />
            </div>
            <p className="text-[11px] text-ivory/40 mt-1">Vide = sans limite de date. Le dernier jour est inclus.</p>
          </div>
          <div>
            <label className="block text-xs text-ivory/50 mb-1.5">Quantité totale (facultatif)</label>
            <input
              type="number"
              min={1}
              value={formulaire.maxTotal}
              onChange={(e) => setFormulaire({ ...formulaire, maxTotal: e.target.value })}
              placeholder="Ex. 100 premières commandes"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm"
            />
            <p className="text-[11px] text-ivory/40 mt-1">Tous clients confondus. Vide = illimité.</p>
          </div>
        </div>

        <p className="text-sm text-ivory/70 mt-6 mb-3">Cartes concernées</p>
        <div className="flex gap-2 border border-ivory/10 rounded-lg p-1 w-fit">
          {[["toutes", "Toutes les cartes"], ["certaines", "Seulement certaines"]].map(([valeur, libelle]) => (
            <button
              key={valeur}
              type="button"
              onClick={() => setFormulaire({ ...formulaire, portee: valeur })}
              className={`text-xs px-4 py-2 rounded-md transition-colors ${
                formulaire.portee === valeur ? "bg-gold text-ink font-medium" : "text-ivory/60"
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        {formulaire.portee === "certaines" && (
          <div className="mt-4 space-y-5">
            <div>
              <p className="text-xs text-ivory/50 mb-2">Catégories entières (les marques ajoutées plus tard au catalogue seront incluses)</p>
              <div className="flex flex-wrap gap-2">
                {toutesCategories.map((cat) => {
                  const coche = formulaire.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => basculerDansListe("categories", cat)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                        coche ? "border-gold bg-gold/15 text-gold" : "border-ivory/20 text-ivory/60 hover:border-ivory/40"
                      }`}
                    >
                      {coche ? "✓ " : ""}{cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-ivory/50 mb-2">
                Et / ou des marques précises ({formulaire.marques.length} cochée{formulaire.marques.length > 1 ? "s" : ""})
              </p>
              <input
                value={rechercheMarque}
                onChange={(e) => setRechercheMarque(e.target.value)}
                placeholder="Rechercher une marque…"
                className="w-full bg-transparent border border-ivory/20 rounded-lg px-3 py-2 text-ivory text-sm mb-2"
              />
              <div className="max-h-64 overflow-y-auto border border-ivory/10 rounded-lg divide-y divide-ivory/5">
                {marquesFiltrees.map((c) => {
                  const coche = formulaire.marques.includes(c.slug);
                  const viaCategorie = formulaire.categories.includes(c.categorie);
                  const marge = marges[c.slug];
                  const tropFaible = marge != null && marge < MARGE_MINIMUM_CODE;
                  return (
                    <label key={c.slug} className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-ivory/[0.03]">
                      <input
                        type="checkbox"
                        checked={coche || viaCategorie}
                        disabled={viaCategorie}
                        onChange={() => basculerDansListe("marques", c.slug)}
                      />
                      <span className={`flex-1 ${c.actif ? "text-ivory" : "text-ivory/40"}`}>
                        {c.nom}
                        {!c.actif && <span className="text-[11px] ml-1">(inactive)</span>}
                      </span>
                      <span className="text-[11px] text-ivory/40">{c.categorie}</span>
                      <span className={`text-[11px] w-24 text-right ${tropFaible ? "text-corail" : "text-ivory/40"}`}>
                        {marge == null ? "marge ?" : tropFaible ? `${marge} % · rien` : `marge ${marge} %`}
                      </span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-ivory/40 mt-1">
                Les marques à moins de {MARGE_MINIMUM_CODE} % de marge ne donnent ni cashback ni commission, même cochées.
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button
            type="submit"
            className="bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-gold/90 transition-colors"
          >
            {enEdition ? "Enregistrer les modifications" : "Créer le code"}
          </button>
          {enEdition && (
            <button type="button" onClick={annulerEdition} className="text-sm text-ivory/60 hover:text-ivory underline">
              Annuler
            </button>
          )}
        </div>
        {message && <p className="mt-3 text-sm text-gold">{message}</p>}
        <p className="mt-3 text-xs text-ivory/40">
          Le cashback de l&apos;abonné et la commission sont calculés automatiquement, marque par marque, selon ta marge
          (même grille que ton fichier Excel). Les marques à moins de 3 % de marge ne donnent rien.
        </p>
      </form>

      <div className="space-y-4">
        {codes.length === 0 && <p className="text-sm text-ivory/50">Aucun code pour l&apos;instant.</p>}
        {codes.map((c) => {
          const liste = actives.filter((u) => u.code_id === c.id);
          const dues = liste.filter((u) => u.statut === "due");
          const estOuvert = ouvert === c.id;
          const etat = etatCode(c, liste.length, maintenant);
          return (
            <div key={c.id} className="border border-ivory/10 rounded-xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-ivory font-medium">
                    <span className="text-gold">{c.code}</span> — {c.influenceuse}
                    <span className={`ml-2 text-xs ${etat.couleur}`}>{etat.texte}</span>
                  </p>
                  <p className="text-xs text-ivory/50 mt-1">
                    {[c.reseau, c.email].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="text-xs text-gold/70 mt-1">
                    {resumeConditions(c)}
                    {c.max_utilisations ? ` (reste ${Math.max(0, c.max_utilisations - liste.length)})` : ""}
                  </p>
                  <p className="text-xs text-ivory/50 mt-1">{resumeCartes(c, nomParSlug)}</p>
                  {c.notes && <p className="text-xs text-ivory/40 mt-1">{c.notes}</p>}
                </div>
                <div className="text-right text-sm">
                  <p className="text-ivory/70">
                    {liste.length} vente(s) · {euros(somme(liste, "montant_commande"))}
                  </p>
                  <p className="text-ivory/50 text-xs mt-1">
                    Cashback offert {euros(somme(liste, "cashback_abonne"))} · Commission payée{" "}
                    {euros(somme(liste.filter((u) => u.statut === "payee"), "commission"))}
                  </p>
                  <p className="text-gold text-sm mt-1">À payer : {euros(somme(dues, "commission"))}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => setOuvert(estOuvert ? null : c.id)}
                  className="text-xs text-ivory/70 border border-ivory/20 rounded-md px-3 py-1.5 hover:border-gold/40"
                >
                  {estOuvert ? "Masquer les ventes" : "Voir les ventes"}
                </button>
                <button
                  onClick={() => marquerPayee(dues)}
                  disabled={dues.length === 0}
                  className="text-xs text-gold border border-gold/40 rounded-md px-3 py-1.5 hover:bg-gold/10 disabled:opacity-30"
                >
                  Tout marquer payé
                </button>
                <button
                  onClick={() => commencerEdition(c)}
                  className="text-xs text-ivory/70 border border-ivory/20 rounded-md px-3 py-1.5 hover:border-gold/40"
                >
                  Modifier
                </button>
                <button
                  onClick={() => basculerActif(c)}
                  className="text-xs text-ivory/50 border border-ivory/10 rounded-md px-3 py-1.5 hover:text-ivory"
                >
                  {c.actif ? "Désactiver" : "Réactiver"}
                </button>
              </div>

              {estOuvert && (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs text-ivory/70">
                    <thead>
                      <tr className="text-ivory/40 text-left">
                        <th className="py-2 pr-3 font-normal">Date</th>
                        <th className="py-2 pr-3 font-normal">Client</th>
                        <th className="py-2 pr-3 font-normal text-right">Commande</th>
                        <th className="py-2 pr-3 font-normal text-right">Cashback abonné</th>
                        <th className="py-2 pr-3 font-normal text-right">Commission</th>
                        <th className="py-2 font-normal">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liste.length === 0 && (
                        <tr><td colSpan={6} className="py-3 text-ivory/40">Aucune vente.</td></tr>
                      )}
                      {liste.map((u) => (
                        <tr key={u.id} className="border-t border-ivory/5">
                          <td className="py-2 pr-3">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                          <td className="py-2 pr-3">{emails[u.profil_id] || "—"}</td>
                          <td className="py-2 pr-3 text-right">{euros(u.montant_commande)}</td>
                          <td className="py-2 pr-3 text-right">{euros(u.cashback_abonne)}</td>
                          <td className="py-2 pr-3 text-right text-gold">
                            {euros(u.commission)}
                            {u.commission_brute > u.commission && (
                              <span className="block text-[10px] text-corail">
                                −{euros(u.commission_brute - u.commission)} (remboursement)
                              </span>
                            )}
                          </td>
                          <td className="py-2">
                            {u.statut === "payee" ? (
                              <span className="text-ivory/50">
                                Payée le {new Date(u.payee_le).toLocaleDateString("fr-FR")}
                              </span>
                            ) : payableLe(u) <= maintenant ? (
                              <button onClick={() => marquerPayee([u])} className="text-gold underline">
                                Payable · marquer payée
                              </button>
                            ) : (
                              <span>Payable dès le {payableLe(u).toLocaleDateString("fr-FR")}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
