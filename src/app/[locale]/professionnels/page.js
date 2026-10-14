"use client";

import { useState } from "react";

const OCCASIONS = [
  "Cadeaux salariés / CSE",
  "Fêtes de fin d'année",
  "Clients & partenaires",
  "Challenge commercial / incentive",
  "Arrivée, départ, anniversaire",
  "Autre",
];

const VOLUMES = ["Moins de 10", "10 à 49", "50 à 199", "200 à 999", "1 000 et plus"];

const USAGES = [
  {
    titre: "Vos équipes",
    texte: "Fin d'année, primes, anniversaires, bienvenue : un cadeau que chacun choisit vraiment.",
  },
  {
    titre: "Vos clients",
    texte: "Remerciez vos meilleurs clients et partenaires avec une attention qui marque les esprits.",
  },
  {
    titre: "Vos challenges",
    texte: "Récompensez vos commerciaux et vos meilleures équipes avec des récompenses qui motivent.",
  },
];

const AVANTAGES = [
  ["Plus de 200 enseignes", "Mode, sport, high-tech, gastronomie, voyages… et des marques fabriquées en France."],
  ["Personnalisées", "Le prénom, votre message et le design de votre choix sur chaque carte."],
  ["Envoyées pour vous", "Chaque bénéficiaire reçoit sa carte par email, tout de suite ou à la date que vous choisissez."],
  ["Une seule facture", "Une commande, une facture, un interlocuteur dédié. Paiement par virement possible."],
  ["Tarifs selon le volume", "Plus vous commandez, plus le prix est intéressant. Devis gratuit et sans engagement."],
];

const ETAPES = [
  ["Vous décrivez votre besoin", "En 2 minutes, avec le formulaire."],
  ["Nous vous envoyons un devis", "Sous 48 h, adapté à votre budget et à votre volume."],
  ["Vos cartes sont envoyées", "Aux bénéficiaires, à la date prévue. Vous n'avez rien à gérer."],
];

const champ = "w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm focus:border-gold/60 outline-none";

export default function Professionnels() {
  const [form, setForm] = useState({
    entreprise: "", contact: "", email: "", telephone: "", occasion: "", volume: "", message: "", site: "",
  });
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  const maj = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const res = await fetch("/api/demande-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSucces(true);
      else setErreur(data.error || "Une erreur est survenue, réessayez.");
    } catch {
      setErreur("Erreur réseau, réessayez.");
    } finally {
      setEnvoi(false);
    }
  };

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto">✓</div>
        <h1 className="text-3xl font-semibold text-ivory mt-6">Merci, votre demande est envoyée</h1>
        <p className="mt-4 text-ivory/60 leading-relaxed">
          Nous revenons vers vous sous 48 h avec un devis personnalisé. Un email de confirmation vient de vous être envoyé.
        </p>
        <a href="/fr/boutique" className="inline-block mt-8 text-sm text-gold hover:underline">Découvrir les enseignes →</a>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto px-6 pt-32 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 items-start">

        {/* Présentation */}
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-4">Entreprises, CSE, associations</p>
          <h1 className="text-4xl md:text-5xl font-semibold text-ivory leading-tight">
            Le cadeau que vos équipes et vos clients <span className="italic text-gold">choisissent vraiment.</span>
          </h1>
          <p className="mt-6 text-ivory/70 leading-relaxed max-w-[560px]">
            Offrez des cartes cadeaux personnalisées, valables dans plus de 200 enseignes. Vous fixez le budget,
            chacun se fait plaisir. Nous nous occupons de tout, de la commande à l&apos;envoi.
          </p>
          <a href="#devis"
            className="lg:hidden inline-block mt-6 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
            Demander mon devis gratuit
          </a>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {USAGES.map((u) => (
              <div key={u.titre} className="border border-ivory/10 rounded-xl p-5">
                <p className="text-ivory font-medium">{u.titre}</p>
                <p className="text-sm text-ivory/55 mt-2 leading-relaxed">{u.texte}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 space-y-4">
            {AVANTAGES.map(([titre, texte]) => (
              <div key={titre} className="flex gap-3">
                <span className="text-gold mt-0.5">✓</span>
                <p className="text-sm text-ivory/70 leading-relaxed">
                  <span className="text-ivory font-medium">{titre}.</span> {texte}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12">
            <p className="text-sm uppercase tracking-wide text-ivory/50 mb-5">Comment ça marche</p>
            <ol className="space-y-5">
              {ETAPES.map(([titre, texte], i) => (
                <li key={titre} className="flex gap-4">
                  <span className="w-9 h-9 shrink-0 rounded-full border border-gold/40 text-gold flex items-center justify-center font-semibold font-[family-name:var(--font-fraunces)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-ivory font-medium">{titre}</p>
                    <p className="text-sm text-ivory/55">{texte}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Formulaire */}
        <form id="devis" onSubmit={handleSubmit} className="scroll-mt-24 border border-gold/25 bg-ivory/[0.02] rounded-2xl p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-2xl font-semibold text-ivory">Demandez votre devis</h2>
          <p className="text-sm text-ivory/55 mt-1 mb-6">Gratuit, sans engagement, réponse sous 48 h.</p>

          {/* Champ piège anti-robots : invisible pour les humains */}
          <input type="text" name="site" value={form.site} onChange={maj("site")} tabIndex={-1} autoComplete="off"
            className="hidden" aria-hidden />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Entreprise *</label>
              <input type="text" value={form.entreprise} onChange={maj("entreprise")} required maxLength={120} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Votre nom *</label>
              <input type="text" value={form.contact} onChange={maj("contact")} required maxLength={120} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Email professionnel *</label>
              <input type="email" value={form.email} onChange={maj("email")} required maxLength={200} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Téléphone</label>
              <input type="tel" value={form.telephone} onChange={maj("telephone")} maxLength={30} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Occasion</label>
              <select value={form.occasion} onChange={maj("occasion")} className={`${champ} bg-ink [color-scheme:dark]`}>
                <option value="" className="bg-ink text-ivory">Choisir…</option>
                {OCCASIONS.map((o) => <option key={o} value={o} className="bg-ink text-ivory">{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">Nombre de bénéficiaires</label>
              <select value={form.volume} onChange={maj("volume")} className={`${champ} bg-ink [color-scheme:dark]`}>
                <option value="" className="bg-ink text-ivory">Choisir…</option>
                {VOLUMES.map((v) => <option key={v} value={v} className="bg-ink text-ivory">{v}</option>)}
              </select>
            </div>
          </div>

          <label className="block text-sm text-ivory/70 mb-2 mt-4">Votre besoin</label>
          <textarea value={form.message} onChange={maj("message")} rows={4} maxLength={2000}
            placeholder="Budget par personne, date souhaitée, enseignes préférées…"
            className={`${champ} resize-none`} />

          <button type="submit" disabled={envoi}
            className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {envoi ? "Envoi…" : "Recevoir mon devis gratuit"}
          </button>
          {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
          <p className="mt-4 text-xs text-ivory/35 leading-relaxed">
            Vos informations servent uniquement à vous répondre. Voir notre{" "}
            <a href="/fr/confidentialite" className="underline hover:text-ivory/60">politique de confidentialité</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
