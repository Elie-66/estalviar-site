"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";
import { fetchAdmin } from "../../../../lib/fetchAdmin";
import { lireAccesAdmin } from "../../../../lib/accesAdmin";
import { SECTIONS, PROPRIETAIRES } from "../../../../lib/admin";

const NIVEAUX = [
  { cle: "", nom: "Aucun accès" },
  { cle: "voir", nom: "Consultation" },
  { cle: "modifier", nom: "Complet" },
];
const NOM_SECTION = Object.fromEntries(SECTIONS.map((s) => [s.cle, s.nom]));
const dateHeure = (d) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

// Résumé lisible d'une ligne du journal
function detailsJournal(l) {
  const d = l.details || {};
  if (d.membre) return d.membre;
  if (d.commande) return `commande ${String(d.commande).slice(0, 8)}${d.destinataire ? ` vers ${d.destinataire}` : ""}`;
  if (d.commandes) return `${d.commandes} commande(s)`;
  if (d.slug) return `${d.slug} : ${d.marge} %`;
  if (d.id) return `n° ${String(d.id).slice(0, 8)}${d.champs?.length ? ` (${d.champs.join(", ")})` : ""}`;
  if (d.nombre) return `${d.nombre} carte(s)`;
  return "";
}

export default function AdminEquipe() {
  const [pret, setPret] = useState(false);
  const [membres, setMembres] = useState([]);
  const [journal, setJournal] = useState([]);
  const [email, setEmail] = useState("");
  const [sections, setSections] = useState({});
  const [enEdition, setEnEdition] = useState(false);
  const [message, setMessage] = useState(null); // { texte, ok }
  const [envoi, setEnvoi] = useState(false);

  const charger = async () => {
    const res = await fetchAdmin("/api/admin-equipe");
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return setMessage({ texte: json.error || "Erreur de chargement", ok: false });
    setMembres(json.membres || []);
    setJournal(json.journal || []);
  };

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const acces = user ? await lireAccesAdmin() : null;
      if (!acces?.proprietaire) {
        window.location.href = acces ? "/fr/admin" : "/fr";
        return;
      }
      await charger();
      setPret(true);
    };
    verifier();
  }, []);

  const vider = () => {
    setEmail("");
    setSections({});
    setEnEdition(false);
  };

  const modifier = (m) => {
    setEmail(m.email);
    setSections(m.sections || {});
    setEnEdition(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enregistrer = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setMessage(null);
    const choisies = Object.fromEntries(Object.entries(sections).filter(([, n]) => n));
    const res = await fetchAdmin("/api/admin-equipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, sections: choisies }),
    });
    const json = await res.json().catch(() => ({}));
    setEnvoi(false);
    if (!res.ok) return setMessage({ texte: json.error || "Erreur", ok: false });
    setMessage({ texte: `Accès enregistrés pour ${email.trim().toLowerCase()}.`, ok: true });
    vider();
    charger();
  };

  const retirer = async (m) => {
    if (!window.confirm(`Retirer tous les accès de ${m.email} ?`)) return;
    const res = await fetchAdmin(`/api/admin-equipe?email=${encodeURIComponent(m.email)}`, { method: "DELETE" });
    if (!res.ok) return setMessage({ texte: "La suppression n'a pas fonctionné", ok: false });
    setMessage({ texte: `${m.email} n'a plus accès à l'admin.`, ok: true });
    if (email === m.email) vider();
    charger();
  };

  if (!pret) {
    return <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">Chargement...</div>;
  }

  const champ = "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold/60";

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <a href="/fr/admin" className="text-sm text-gold hover:underline">← Retour au tableau de bord</a>
      <h1 className="text-3xl font-semibold text-ivory mt-2">Équipe et accès</h1>
      <p className="mt-2 text-sm text-ivory/55 max-w-[640px]">
        Chaque personne se connecte avec son propre compte Estalviar (même adresse email que ci-dessous) et ne voit
        que les sections que vous lui ouvrez. <span className="text-ivory/75">{PROPRIETAIRES.join(", ")}</span> est propriétaire
        et garde toujours accès à tout.
      </p>

      {message && (
        <p role="status" className={`mt-6 text-sm ${message.ok ? "text-vert" : "text-corail"}`}>{message.texte}</p>
      )}

      {/* Ajouter ou modifier */}
      <form onSubmit={enregistrer} className="mt-8 border border-ivory/10 rounded-xl p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-ivory">{enEdition ? `Accès de ${email}` : "Ajouter une personne"}</h2>
        {!enEdition && (
          <div className="mt-4 max-w-[420px]">
            <label htmlFor="e-email" className="block text-sm text-ivory/70 mb-2">Adresse email</label>
            <input id="e-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom@estalviar.com" className={champ} />
          </div>
        )}

        <ul className="mt-5 divide-y divide-ivory/10 border-y border-ivory/10">
          {SECTIONS.map((s) => (
            <li key={s.cle} className="py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <div className="min-w-0">
                <p className="text-sm text-ivory">{s.nom}</p>
                <p className="text-xs text-ivory/45">{s.description}</p>
              </div>
              <select aria-label={`Accès : ${s.nom}`} value={sections[s.cle] || ""}
                onChange={(e) => setSections((prev) => ({ ...prev, [s.cle]: e.target.value }))}
                className={`bg-ink border rounded-lg px-3 py-2 text-sm ${sections[s.cle] ? "border-gold/50 text-ivory" : "border-ivory/20 text-ivory/55"}`}>
                {NIVEAUX.map((n) => <option key={n.cle} value={n.cle}>{n.nom}</option>)}
              </select>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ivory/45">
          Consultation : voir sans rien changer. Complet : voir et modifier (renvoyer une carte, changer un statut…).
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={envoi}
            className="bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gold/90 disabled:opacity-40">
            {envoi ? "Enregistrement..." : "Enregistrer les accès"}
          </button>
          {enEdition && (
            <button type="button" onClick={vider} className="text-sm text-ivory/60 hover:text-ivory underline underline-offset-4">Annuler</button>
          )}
        </div>
      </form>

      {/* Membres */}
      <h2 className="mt-12 text-lg font-semibold text-ivory">Personnes ayant accès</h2>
      {membres.length === 0 ? (
        <p className="mt-3 text-sm text-ivory/50">Personne d&apos;autre que vous pour l&apos;instant.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {membres.map((m) => {
            const liste = Object.entries(m.sections || {});
            return (
              <li key={m.email} className="border border-ivory/10 rounded-xl p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-ivory break-all">{m.email}</p>
                    <p className="text-xs text-ivory/40 mt-0.5">Ajouté le {dateHeure(m.ajoute_le)}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <button type="button" onClick={() => modifier(m)} className="text-gold hover:underline">Modifier</button>
                    <button type="button" onClick={() => retirer(m)} className="text-corail/90 hover:underline">Retirer</button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-ivory/70 leading-relaxed">
                  {liste.map(([cle, n], i) => (
                    <span key={cle}>
                      {NOM_SECTION[cle] || cle}{n === "voir" ? <span className="text-ivory/40"> (consultation)</span> : null}
                      {i < liste.length - 1 ? ", " : ""}
                    </span>
                  ))}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {/* Journal */}
      <h2 className="mt-12 text-lg font-semibold text-ivory">Journal des actions</h2>
      <p className="mt-1 text-sm text-ivory/50">Les 100 dernières modifications faites dans l&apos;admin, par qui et quand.</p>
      {journal.length === 0 ? (
        <p className="mt-3 text-sm text-ivory/50">Aucune action enregistrée pour l&apos;instant.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-ivory/10 rounded-lg">
          <table className="w-full text-sm">
            <thead className="text-left text-ivory/55 border-b border-ivory/10">
              <tr>
                <th className="font-medium px-4 py-3">Date</th>
                <th className="font-medium px-4 py-3">Qui</th>
                <th className="font-medium px-4 py-3">Action</th>
                <th className="font-medium px-4 py-3">Détail</th>
              </tr>
            </thead>
            <tbody>
              {journal.map((l, i) => (
                <tr key={i} className="border-b border-ivory/5 last:border-0">
                  <td className="px-4 py-2.5 text-ivory/60 whitespace-nowrap">{dateHeure(l.cree_le)}</td>
                  <td className="px-4 py-2.5 text-ivory/80 break-all">{l.email}</td>
                  <td className="px-4 py-2.5 text-ivory whitespace-nowrap">{l.action}</td>
                  <td className="px-4 py-2.5 text-ivory/60">{detailsJournal(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
