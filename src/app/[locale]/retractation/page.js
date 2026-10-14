"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const champ = "w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory text-sm focus:border-gold/60 outline-none";

/**
 * Formulaire de rétractation en ligne (« bouton de rétractation »).
 * Étape 1 : la demande. Étape 2 : confirmation. Puis accusé de réception par email.
 */
export default function Retractation() {
  const t = useTranslations("retractation");
  const locale = useLocale();
  const [etape, setEtape] = useState("saisie"); // saisie | verification | envoyee
  const [form, setForm] = useState({ nom: "", email: "", commande: "", message: "" });
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [resultat, setResultat] = useState(null);
  const maj = (cle) => (e) => setForm({ ...form, [cle]: e.target.value });

  const confirmer = async () => {
    setEnvoi(true);
    setErreur("");
    try {
      const res = await fetch("/api/retractation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErreur(data.error || t("erreur"));
      } else {
        setResultat(data);
        setEtape("envoyee");
        window.scrollTo({ top: 0 });
      }
    } catch {
      setErreur(t("erreur"));
    } finally {
      setEnvoi(false);
    }
  };

  if (etape === "envoyee") {
    return (
      <div className="max-w-[620px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto">✓</div>
        <h1 className="text-3xl font-semibold text-ivory mt-6">{t("merciTitre")}</h1>
        <p className="mt-4 text-ivory/65 leading-relaxed">
          {t("merciTexte", { reference: resultat.reference, date: resultat.recue })}
        </p>
        <p className="mt-3 text-ivory/65 leading-relaxed">{resultat.emailEnvoye ? t("merciEmail") : t("merciSansEmail")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
      <p className="mt-4 text-ivory/65 leading-relaxed">{t("intro")}</p>
      <p className="mt-3 text-sm text-ivory/50 leading-relaxed">
        {t("exception")}{" "}
        <a href={`/${locale}/cgv#retractation`} className="text-gold underline decoration-gold/40 underline-offset-2">{t("voirCgv")}</a>
      </p>

      {etape === "saisie" ? (
        <form
          onSubmit={(e) => { e.preventDefault(); setEtape("verification"); }}
          className="mt-8 border border-ivory/10 rounded-2xl p-6 sm:p-8 space-y-5"
        >
          <div>
            <label htmlFor="r-nom" className="block text-sm text-ivory/70 mb-2">{t("nom")} *</label>
            <input id="r-nom" required maxLength={120} value={form.nom} onChange={maj("nom")} autoComplete="name" className={champ} />
          </div>
          <div>
            <label htmlFor="r-email" className="block text-sm text-ivory/70 mb-2">{t("email")} *</label>
            <input id="r-email" type="email" required maxLength={200} value={form.email} onChange={maj("email")} autoComplete="email" className={champ} />
          </div>
          <div>
            <label htmlFor="r-commande" className="block text-sm text-ivory/70 mb-2">{t("commande")} *</label>
            <textarea id="r-commande" required rows={3} maxLength={500} value={form.commande} onChange={maj("commande")}
              placeholder={t("commandeExemple")} className={`${champ} resize-none`} />
          </div>
          <div>
            <label htmlFor="r-message" className="block text-sm text-ivory/70 mb-2">{t("message")}</label>
            <textarea id="r-message" rows={3} maxLength={2000} value={form.message} onChange={maj("message")} className={`${champ} resize-none`} />
          </div>
          <button type="submit" className="w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors">
            {t("continuer")}
          </button>
        </form>
      ) : (
        <div className="mt-8 border border-gold/30 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-ivory">{t("verifierTitre")}</h2>
          <dl className="mt-5 space-y-3 text-sm">
            {["nom", "email", "commande", "message"].filter((c) => form[c].trim()).map((c) => (
              <div key={c}>
                <dt className="text-ivory/45">{t(c)}</dt>
                <dd className="text-ivory whitespace-pre-line break-words">{form[c]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-ivory/60">{t("verifierTexte")}</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button type="button" onClick={confirmer} disabled={envoi}
              className="flex-1 bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-50">
              {envoi ? t("envoi") : t("confirmer")}
            </button>
            <button type="button" onClick={() => setEtape("saisie")} disabled={envoi}
              className="border border-ivory/20 text-ivory/80 rounded-lg px-6 py-3.5 hover:border-ivory/40 transition-colors">
              {t("modifier")}
            </button>
          </div>
          {erreur && <p role="alert" className="mt-4 text-sm text-corail">{erreur}</p>}
        </div>
      )}
    </div>
  );
}
