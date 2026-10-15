"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

// Les valeurs envoyées au serveur restent en français (lisibles dans l'admin) ; l'affichage est traduit
const OCCASIONS = [
  ["Cadeaux salariés / CSE", "occasion1"],
  ["Fêtes de fin d'année", "occasion2"],
  ["Clients & partenaires", "occasion3"],
  ["Challenge commercial / incentive", "occasion4"],
  ["Arrivée, départ, anniversaire", "occasion5"],
  ["Autre", "occasion6"],
];
const VOLUMES = [
  ["Moins de 10", "volume1"],
  ["10 à 49", "volume2"],
  ["50 à 199", "volume3"],
  ["200 à 999", "volume4"],
  ["1 000 et plus", "volume5"],
];

const champ = "w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm focus:border-gold/60 outline-none";

export default function Professionnels() {
  const t = useTranslations("pro");
  const locale = useLocale();
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
      else setErreur(data.error || t("erreur"));
    } catch {
      setErreur(t("erreurReseau"));
    } finally {
      setEnvoi(false);
    }
  };

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto">✓</div>
        <h1 className="text-3xl font-semibold text-ivory mt-6">{t("merciTitre")}</h1>
        <p className="mt-4 text-ivory/60 leading-relaxed">{t("merciTexte")}</p>
        <a href={`/${locale}/boutique`} className="inline-block mt-8 text-sm text-gold hover:underline">{t("decouvrir")}</a>
      </div>
    );
  }

  return (
    <div className="max-w-[1140px] mx-auto px-6 pt-32 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-14 items-start">

        {/* Présentation */}
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold text-ivory leading-[1.08] tracking-tight">{t("titre")}</h1>
          <p className="mt-6 text-ivory/75 text-lg leading-relaxed max-w-[560px]">{t("intro")}</p>
          <p className="mt-3 text-ivory/50 leading-relaxed max-w-[560px]">{t("pour")}</p>
          <p className="mt-5 max-w-[560px] border-l-2 border-gold pl-4 text-ivory/80 leading-relaxed">
            {t.rich("commandeEnLigne", {
              lien: (m) => <a href={`/${locale}/professionnels/commande-groupee`} className="text-gold underline underline-offset-4 decoration-gold/50 hover:decoration-gold">{m}</a>,
            })}
          </p>
          <a href="#devis"
            className="lg:hidden inline-block mt-6 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
            {t("ctaMobile")}
          </a>

          <h2 className="mt-12 text-lg font-semibold text-ivory">{t("inclusTitre")}</h2>
          <dl className="mt-4 border-t border-ivory/10">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="grid grid-cols-1 sm:grid-cols-[170px_1fr] gap-x-6 gap-y-1 py-4 border-b border-ivory/10">
                <dt className="text-ivory font-medium">{t(`avantage${n}Titre`)}</dt>
                <dd className="text-sm text-ivory/65 leading-relaxed">{t(`avantage${n}Texte`)}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12 text-lg font-semibold text-ivory">{t("commentTitre")}</h2>
          <ol className="mt-4 space-y-4">
            {[1, 2, 3].map((n) => (
              <li key={n} className="grid grid-cols-[1.75rem_1fr] gap-x-2">
                <span className="text-ivory/40 tabular-nums">{n}.</span>
                <span>
                  <span className="text-ivory font-medium">{t(`etape${n}Titre`)}</span>
                  <span className="block text-sm text-ivory/55">{t(`etape${n}Texte`)}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Formulaire */}
        <form id="devis" onSubmit={handleSubmit} className="scroll-mt-24 border border-gold/25 bg-ivory/[0.02] rounded-2xl p-6 sm:p-8 lg:sticky lg:top-28">
          <h2 className="text-2xl font-semibold text-ivory">{t("formTitre")}</h2>
          <p className="text-sm text-ivory/55 mt-1 mb-6">{t("formSousTitre")}</p>

          {/* Champ piège anti-robots : invisible pour les humains */}
          <input type="text" name="site" value={form.site} onChange={maj("site")} tabIndex={-1} autoComplete="off"
            className="hidden" aria-hidden />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("entreprise")} *</label>
              <input type="text" value={form.entreprise} onChange={maj("entreprise")} required maxLength={120} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("votreNom")} *</label>
              <input type="text" value={form.contact} onChange={maj("contact")} required maxLength={120} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("email")} *</label>
              <input type="email" value={form.email} onChange={maj("email")} required maxLength={200} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("telephone")}</label>
              <input type="tel" value={form.telephone} onChange={maj("telephone")} maxLength={30} className={champ} />
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("occasion")}</label>
              <select value={form.occasion} onChange={maj("occasion")} className={`${champ} bg-ink [color-scheme:dark]`}>
                <option value="" className="bg-ink text-ivory">{t("choisir")}</option>
                {OCCASIONS.map(([valeur, cle]) => <option key={cle} value={valeur} className="bg-ink text-ivory">{t(cle)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-ivory/70 mb-2">{t("volume")}</label>
              <select value={form.volume} onChange={maj("volume")} className={`${champ} bg-ink [color-scheme:dark]`}>
                <option value="" className="bg-ink text-ivory">{t("choisir")}</option>
                {VOLUMES.map(([valeur, cle]) => <option key={cle} value={valeur} className="bg-ink text-ivory">{t(cle)}</option>)}
              </select>
            </div>
          </div>

          <label className="block text-sm text-ivory/70 mb-2 mt-4">{t("besoin")}</label>
          <textarea value={form.message} onChange={maj("message")} rows={4} maxLength={2000}
            placeholder={t("besoinAide")}
            className={`${champ} resize-none`} />

          <button type="submit" disabled={envoi}
            className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {envoi ? t("envoi") : t("envoyer")}
          </button>
          {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
          <p className="mt-4 text-xs text-ivory/35 leading-relaxed">
            {t("rgpd")}{" "}
            <a href={`/${locale}/confidentialite`} className="underline hover:text-ivory/60">{t("confidentialite")}</a>.
          </p>
        </form>
      </div>
    </div>
  );
}
