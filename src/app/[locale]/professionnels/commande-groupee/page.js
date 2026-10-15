"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../../lib/supabase";
import { fetchSession } from "../../../../lib/fetchSession";
import { DESIGNS } from "../../../../lib/designs";
import { MAX_CARTES_GROUPEES, normaliser, lignesDepuisTableau } from "../../../../lib/commandeGroupee";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const champ = "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-3 text-ivory placeholder:text-ivory/35 outline-none focus:border-gold/60 transition-colors";
const libelle = "block text-sm text-ivory/70 mb-2";
const cellule = "w-full bg-transparent border border-transparent hover:border-ivory/15 focus:border-gold/50 rounded px-2 py-1.5 text-sm text-ivory outline-none";

export default function PageCommandeGroupee() {
  return (
    <Suspense fallback={null}>
      <CommandeGroupee />
    </Suspense>
  );
}

function CommandeGroupee() {
  const sessionId = useSearchParams().get("session_id");
  return sessionId ? <Confirmation sessionId={sessionId} /> : <Formulaire />;
}

/** Retour du paiement Stripe : le serveur livre les cartes et envoie la facture */
function Confirmation({ sessionId }) {
  const t = useTranslations("commandeGroupee");
  const locale = useLocale();
  const [statut, setStatut] = useState("chargement");
  const envoye = useRef(false);

  useEffect(() => {
    if (envoye.current) return;
    envoye.current = true;
    fetch("/api/enregistrer-commande", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((r) => setStatut(r.ok ? "succes" : "erreur"))
      .catch(() => setStatut("erreur"));
  }, [sessionId]);

  return (
    <div className="max-w-[640px] mx-auto px-6 pt-32 pb-24">
      {statut === "chargement" && <p className="text-ivory/60">{t("confirmationAttente")}</p>}
      {statut === "succes" && (
        <>
          <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("confirmationTitre")}</h1>
          <p className="mt-4 text-ivory/75 leading-relaxed">{t("confirmationTexte")}</p>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a href={`/${locale}/profil?onglet=commandes`} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90">{t("confirmationCompte")}</a>
            <a href={`/${locale}/professionnels/commande-groupee`} className="text-sm text-gold underline underline-offset-4">{t("confirmationNouvelle")}</a>
          </div>
        </>
      )}
      {statut === "erreur" && (
        <>
          <h1 className="text-3xl font-semibold text-ivory">{t("confirmationErreurTitre")}</h1>
          <p className="mt-4 text-ivory/75 leading-relaxed">{t("confirmationErreurTexte")}</p>
        </>
      )}
    </div>
  );
}

function Formulaire() {
  const t = useTranslations("commandeGroupee");
  const tDesign = useTranslations("designs");
  const locale = useLocale();
  const annule = useSearchParams().get("annule");
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(Number(n) || 0);

  const [catalogue, setCatalogue] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [fichier, setFichier] = useState("");
  const [erreurFichier, setErreurFichier] = useState("");
  const [parDefaut, setParDefaut] = useState({ marque: "", montant: "", message: "", design: "Marque" });
  const [programmee, setProgrammee] = useState(false);
  const [envoi, setEnvoi] = useState({ date: "", heure: "09:00" });
  const [societe, setSociete] = useState({ societe: "", adresse: "", siren: "", tva: "" });
  const [emailContact, setEmailContact] = useState("");
  const [accepteCgv, setAccepteCgv] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const [demain, setDemain] = useState("");
  const prochainId = useRef(1);

  useEffect(() => {
    supabase.from("catalogue").select("nom, slug, montant_min, montant_max").eq("actif", true).order("nom")
      .then(({ data }) => {
        setCatalogue(data || []);
        setDemain(new Date(Date.now() + 86400000).toLocaleDateString("fr-CA"));
      });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email) setEmailContact((e) => e || data.session.user.email);
    });
  }, []);

  const parNom = useMemo(() => {
    const m = new Map();
    for (const c of catalogue) {
      m.set(normaliser(c.nom), c);
      m.set(normaliser(c.slug), c);
    }
    return m;
  }, [catalogue]);

  // Chaque ligne, complétée par les valeurs par défaut et vérifiée
  const verifiees = lignes.map((l) => {
    const nomMarque = l.marque || parDefaut.marque;
    const carte = parNom.get(normaliser(nomMarque));
    const montant = Number(String(l.montant || parDefaut.montant).replace(",", "."));
    let probleme = "";
    if (!nomMarque) probleme = t("errSansMarque");
    else if (!carte) probleme = t("errMarque", { marque: nomMarque });
    else if (!Number.isInteger(montant) || montant < carte.montant_min || montant > carte.montant_max) {
      probleme = t("errMontant", { min: carte.montant_min, max: carte.montant_max });
    } else if (l.email && !EMAIL_VALIDE.test(l.email)) probleme = t("errEmail");
    return { ...l, carte, montantFinal: montant, probleme };
  });
  const enErreur = verifiees.filter((l) => l.probleme).length;
  const total = verifiees.filter((l) => !l.probleme).reduce((s, l) => s + l.montantFinal, 0);
  const emails = verifiees.map((l) => l.email.toLowerCase()).filter(Boolean);
  const doublons = emails.length - new Set(emails).size;
  const sansEmail = verifiees.filter((l) => !l.email).length;
  const parEnseigne = Object.values(
    verifiees.filter((l) => !l.probleme).reduce((acc, l) => {
      const cle = l.carte.nom;
      acc[cle] = acc[cle] || { nom: cle, n: 0, montant: 0 };
      acc[cle].n += 1;
      acc[cle].montant += l.montantFinal;
      return acc;
    }, {})
  );

  const trop = lignes.length > MAX_CARTES_GROUPEES;
  const societeIncomplete = !societe.societe.trim() || !societe.adresse.trim();
  const dateIncomplete = programmee && !envoi.date;
  const peutPayer = lignes.length > 0 && !enErreur && !trop && !societeIncomplete && !dateIncomplete
    && EMAIL_VALIDE.test(emailContact) && accepteCgv && !chargement;
  const raison = lignes.length === 0 ? t("raisonListe")
    : trop ? t("raisonTrop", { max: MAX_CARTES_GROUPEES })
    : enErreur ? t("raisonErreurs", { n: enErreur })
    : dateIncomplete ? t("raisonDate")
    : societeIncomplete ? t("raisonSociete")
    : !EMAIL_VALIDE.test(emailContact) ? t("raisonEmail")
    : !accepteCgv ? t("raisonCgv") : "";

  async function importer(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setErreurFichier("");
    try {
      const XLSX = await import("xlsx");
      const octets = await f.arrayBuffer();
      let classeur;
      if (/\.csv$/i.test(f.name)) {
        // CSV : texte en UTF-8, ou en Windows-1252 (export « CSV » d'Excel) si les accents sont illisibles
        let texte = new TextDecoder("utf-8").decode(octets);
        if (texte.includes("\uFFFD")) texte = new TextDecoder("windows-1252").decode(octets);
        classeur = XLSX.read(texte.replace(/^\uFEFF/, ""), { type: "string" });
      } else {
        classeur = XLSX.read(octets);
      }
      const feuille = classeur.Sheets[classeur.SheetNames[0]];
      const lues = lignesDepuisTableau(XLSX.utils.sheet_to_json(feuille, { defval: "", raw: false }));
      if (lues.length === 0) {
        setErreurFichier(t("fichierVide"));
        return;
      }
      setLignes(lues.map((l) => ({ ...l, id: prochainId.current++ })));
      setFichier(f.name);
    } catch {
      setErreurFichier(t("fichierIllisible"));
    }
  }

  async function telechargerModele() {
    const XLSX = await import("xlsx");
    const colonnes = [t("colPrenom"), t("colEmail"), t("colEnseigne"), t("colMontant"), t("colMessage")];
    const exemples = [
      ["Léa", "lea.martin@exemple.fr", catalogue[0]?.nom || "Fnac", 50, t("exempleMessage")],
      ["Thomas", "thomas.durand@exemple.fr", catalogue[1]?.nom || "Decathlon", 30, ""],
    ];
    const feuille = XLSX.utils.aoa_to_sheet([colonnes, ...exemples]);
    feuille["!cols"] = [{ wch: 16 }, { wch: 30 }, { wch: 18 }, { wch: 10 }, { wch: 44 }];
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, t("modeleFeuille"));
    XLSX.writeFile(classeur, "modele-commande-groupee-estalviar.xlsx");
  }

  const modifierLigne = (id, champ, valeur) => setLignes((ls) => ls.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)));
  const retirerLigne = (id) => setLignes((ls) => ls.filter((l) => l.id !== id));
  const ajouterLigne = () => setLignes((ls) => [...ls, { id: prochainId.current++, prenom: "", email: "", marque: "", montant: "", message: "" }]);

  async function payer() {
    setChargement(true);
    setErreur("");
    try {
      const res = await fetchSession("/api/commande-groupee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lignes: verifiees.map((l) => ({ prenom: l.prenom, email: l.email, marque: l.carte?.nom, montant: l.montantFinal, message: l.message })),
          options: {
            design: parDefaut.design,
            message: parDefaut.message,
            dateEnvoi: programmee ? envoi.date : null,
            heureEnvoi: programmee ? envoi.heure : null,
          },
          emailAcheteur: emailContact,
          facturation: societe,
          accepteCgv,
          locale,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.url) {
        window.location.assign(json.url);
        return;
      }
      setErreur(json.error || t("erreurInconnue"));
    } catch {
      setErreur(t("erreurReseau"));
    }
    setChargement(false);
  }

  return (
    <div className="max-w-[1180px] mx-auto px-5 sm:px-6 pt-28 md:pt-32 pb-24">
      <a href={`/${locale}/professionnels`} className="text-sm text-ivory/55 hover:text-gold">‹ {t("retour")}</a>
      <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-ivory tracking-tight">{t("titre")}</h1>
      <p className="mt-3 text-ivory/70 max-w-[680px] leading-relaxed">{t("intro", { max: MAX_CARTES_GROUPEES })}</p>
      <p className="mt-2 text-sm text-ivory/50 max-w-[680px]">
        {t.rich("devis", { lien: (m) => <a href={`/${locale}/professionnels#devis`} className="text-gold underline underline-offset-4">{m}</a> })}
      </p>
      {annule && <p className="mt-5 text-sm text-gold/90">{t("annule")}</p>}

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 items-start">
        <div className="min-w-0">
          {/* La liste */}
          <section>
            <h2 className="text-xl font-semibold text-ivory">{t("listeTitre")}</h2>
            <p className="mt-1 text-sm text-ivory/55">{t("listeAide")}</p>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3">
              <label className="cursor-pointer bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-3 hover:bg-gold/90 transition-colors">
                {fichier ? t("autreFichier") : t("importer")}
                <input type="file" accept=".xlsx,.xls,.csv" onChange={importer} className="sr-only" />
              </label>
              <button type="button" onClick={telechargerModele} className="text-sm text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
                {t("modele")}
              </button>
              <button type="button" onClick={ajouterLigne} className="text-sm text-ivory/70 hover:text-ivory underline decoration-ivory/30 underline-offset-4">
                {t("ajouterLigne")}
              </button>
            </div>
            {fichier && <p className="mt-3 text-sm text-ivory/55">{t("fichierCharge", { fichier, n: lignes.length })}</p>}
            {erreurFichier && <p role="alert" className="mt-3 text-sm text-corail">{erreurFichier}</p>}

            {/* Valeurs par défaut */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="d-marque" className={libelle}>{t("marqueDefaut")}</label>
                <select id="d-marque" value={parDefaut.marque} onChange={(e) => setParDefaut((d) => ({ ...d, marque: e.target.value }))} className={`${champ} [color-scheme:dark]`}>
                  <option value="" className="bg-ink">{t("marqueAucune")}</option>
                  {catalogue.map((c) => <option key={c.slug} value={c.nom} className="bg-ink">{c.nom}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="d-montant" className={libelle}>{t("montantDefaut")}</label>
                <input id="d-montant" type="number" min="1" step="1" inputMode="numeric" value={parDefaut.montant}
                  onChange={(e) => setParDefaut((d) => ({ ...d, montant: e.target.value }))} placeholder="50" className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="d-message" className={libelle}>{t("messageDefaut")}</label>
                <input id="d-message" type="text" maxLength={120} value={parDefaut.message}
                  onChange={(e) => setParDefaut((d) => ({ ...d, message: e.target.value }))} placeholder={t("exempleMessage")} className={champ} />
              </div>
              <div>
                <label htmlFor="d-design" className={libelle}>{t("design")}</label>
                <select id="d-design" value={parDefaut.design} onChange={(e) => setParDefaut((d) => ({ ...d, design: e.target.value }))} className={`${champ} [color-scheme:dark]`}>
                  {DESIGNS.map((d) => <option key={d.id} value={d.nom} className="bg-ink">{tDesign(d.nom)}</option>)}
                </select>
              </div>
              <div>
                <span className={libelle}>{t("envoi")}</span>
                <label className="flex items-center gap-2.5 text-sm text-ivory/80 py-1 cursor-pointer">
                  <input type="radio" name="envoi" checked={!programmee} onChange={() => setProgrammee(false)} className="accent-[#C9A227]" />
                  {t("envoiImmediat")}
                </label>
                <label className="flex items-center gap-2.5 text-sm text-ivory/80 py-1 cursor-pointer">
                  <input type="radio" name="envoi" checked={programmee} onChange={() => setProgrammee(true)} className="accent-[#C9A227]" />
                  {t("envoiDate")}
                </label>
                {programmee && (
                  <div className="mt-2 flex gap-2">
                    <input type="date" min={demain || undefined} value={envoi.date} aria-label={t("date")}
                      onChange={(e) => setEnvoi((v) => ({ ...v, date: e.target.value }))} className={`${champ} [color-scheme:dark] py-2.5`} />
                    <input type="time" value={envoi.heure} aria-label={t("heure")}
                      onChange={(e) => setEnvoi((v) => ({ ...v, heure: e.target.value }))} className={`${champ} [color-scheme:dark] py-2.5 w-[120px]`} />
                  </div>
                )}
              </div>
            </div>

            {/* Aperçu de la liste */}
            {lignes.length > 0 && (
              <div className="mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-base font-semibold text-ivory">{t("apercuTitre", { n: lignes.length })}</h3>
                  {enErreur > 0
                    ? <p className="text-sm text-corail">{t("apercuErreurs", { n: enErreur })}</p>
                    : <p className="text-sm text-vert">{t("apercuOk")}</p>}
                </div>
                <div className="mt-3 overflow-x-auto border border-ivory/10 rounded-lg">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead className="text-left text-ivory/55 border-b border-ivory/10">
                      <tr>
                        <th className="font-medium px-3 py-2.5 w-8"><span className="sr-only">N°</span></th>
                        <th className="font-medium px-3 py-2.5">{t("colPrenom")}</th>
                        <th className="font-medium px-3 py-2.5">{t("colEmail")}</th>
                        <th className="font-medium px-3 py-2.5">{t("colEnseigne")}</th>
                        <th className="font-medium px-3 py-2.5 w-24">{t("colMontant")}</th>
                        <th className="px-3 py-2.5 w-10"><span className="sr-only">{t("retirer")}</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {verifiees.map((l, i) => (
                        <tr key={l.id} className={`border-b border-ivory/5 last:border-0 align-top ${l.probleme ? "bg-corail/[0.06]" : ""}`}>
                          <td className="px-3 py-2.5 text-ivory/40 tabular-nums">{i + 1}</td>
                          <td className="px-1 py-1"><input value={l.prenom} maxLength={40} aria-label={t("colPrenom")} onChange={(e) => modifierLigne(l.id, "prenom", e.target.value)} className={cellule} /></td>
                          <td className="px-1 py-1">
                            <input value={l.email} aria-label={t("colEmail")} placeholder={t("versVous")} onChange={(e) => modifierLigne(l.id, "email", e.target.value)} className={`${cellule} placeholder:text-ivory/35`} />
                          </td>
                          <td className="px-1 py-1">
                            <input value={l.marque} aria-label={t("colEnseigne")} placeholder={parDefaut.marque} list="enseignes" onChange={(e) => modifierLigne(l.id, "marque", e.target.value)} className={`${cellule} placeholder:text-ivory/45`} />
                            {l.probleme && <p className="px-2 pb-1 text-xs text-corail">{l.probleme}</p>}
                          </td>
                          <td className="px-1 py-1"><input value={l.montant} inputMode="numeric" aria-label={t("colMontant")} placeholder={parDefaut.montant} onChange={(e) => modifierLigne(l.id, "montant", e.target.value)} className={`${cellule} placeholder:text-ivory/45 tabular-nums`} /></td>
                          <td className="px-2 py-2 text-right">
                            <button type="button" onClick={() => retirerLigne(l.id)} aria-label={t("retirerLigne", { n: i + 1 })} className="text-ivory/40 hover:text-corail text-lg leading-none">×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <datalist id="enseignes">{catalogue.map((c) => <option key={c.slug} value={c.nom} />)}</datalist>
                </div>
                {(doublons > 0 || sansEmail > 0) && (
                  <p className="mt-3 text-xs text-ivory/50">
                    {doublons > 0 && t("noteDoublons", { n: doublons })} {sansEmail > 0 && t("noteSansEmail", { n: sansEmail })}
                  </p>
                )}
              </div>
            )}
          </section>

          {/* La société */}
          <section className="mt-14">
            <h2 className="text-xl font-semibold text-ivory">{t("societeTitre")}</h2>
            <p className="mt-1 text-sm text-ivory/55">{t("societeAide")}</p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="s-nom" className={libelle}>{t("raisonSociale")}</label>
                <input id="s-nom" type="text" maxLength={120} autoComplete="organization" value={societe.societe}
                  onChange={(e) => setSociete((s) => ({ ...s, societe: e.target.value }))} className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="s-adresse" className={libelle}>{t("adresse")}</label>
                <textarea id="s-adresse" rows={2} maxLength={300} autoComplete="street-address" value={societe.adresse}
                  onChange={(e) => setSociete((s) => ({ ...s, adresse: e.target.value }))} className={`${champ} resize-none`} />
              </div>
              <div>
                <label htmlFor="s-siren" className={libelle}>{t("siren")}</label>
                <input id="s-siren" type="text" inputMode="numeric" maxLength={20} value={societe.siren}
                  onChange={(e) => setSociete((s) => ({ ...s, siren: e.target.value }))} className={champ} />
              </div>
              <div>
                <label htmlFor="s-tva" className={libelle}>{t("tva")}</label>
                <input id="s-tva" type="text" maxLength={20} value={societe.tva}
                  onChange={(e) => setSociete((s) => ({ ...s, tva: e.target.value }))} className={champ} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="s-email" className={libelle}>{t("emailContact")}</label>
                <input id="s-email" type="email" autoComplete="email" value={emailContact}
                  onChange={(e) => setEmailContact(e.target.value)} className={champ} />
                <p className="mt-1.5 text-xs text-ivory/45">{t("emailContactAide")}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Récapitulatif */}
        <aside className="lg:sticky lg:top-28 border border-ivory/15 rounded-2xl p-6 bg-ivory/[0.02]">
          <h2 className="text-lg font-semibold text-ivory">{t("recapTitre")}</h2>
          {parEnseigne.length === 0 ? (
            <p className="mt-3 text-sm text-ivory/50">{t("recapVide")}</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {parEnseigne.map((g) => (
                <li key={g.nom} className="flex justify-between gap-3">
                  <span className="text-ivory/75">{t("recapLigne", { n: g.n, marque: g.nom })}</span>
                  <span className="text-ivory tabular-nums">{euros(g.montant)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-ivory/10 flex items-baseline justify-between">
            <span className="text-ivory font-medium">{t("total")}</span>
            <span className="text-2xl font-semibold text-ivory tabular-nums">{euros(total)}</span>
          </div>
          <p className="mt-1 text-xs text-ivory/45">{programmee && envoi.date
            ? t("recapEnvoiDate", { date: new Date(`${envoi.date}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", timeZone: "UTC" }), heure: envoi.heure })
            : t("recapEnvoiImmediat")}</p>

          <label className="mt-6 flex items-start gap-3 text-xs text-ivory/70 leading-relaxed cursor-pointer">
            <input type="checkbox" checked={accepteCgv} onChange={(e) => setAccepteCgv(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0 accent-[#C9A227]" />
            <span>{t.rich("cgv", { lien: (m) => <a href={`/${locale}/cgv`} target="_blank" className="text-gold underline">{m}</a> })}</span>
          </label>

          <button type="button" onClick={payer} disabled={!peutPayer}
            className="mt-5 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {chargement ? t("redirection") : t("payer", { total: euros(total) })}
          </button>
          {raison && <p className="mt-2 text-xs text-ivory/50 text-center">{raison}</p>}
          {erreur && <p role="alert" className="mt-3 text-sm text-corail">{erreur}</p>}
          <p className="mt-4 text-xs text-ivory/45 text-center">{t("securise")}</p>
        </aside>
      </div>
    </div>
  );
}
