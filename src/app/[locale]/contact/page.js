"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RESEAUX } from "../../../lib/reseaux";
import IconeReseau from "../components/IconeReseau";

const champ = "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold/60 transition-colors";

export default function Contact() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom, email, sujet, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) setSucces(true);
      else setErreur(data.error || t("erreur"));
    } catch {
      setErreur(t("erreur"));
    }
    setEnvoi(false);
  };

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto" aria-hidden>✓</div>
        <h1 className="mt-6 text-3xl font-semibold text-ivory">{t("envoyeTitre")}</h1>
        <p className="mt-4 text-ivory/65">{t("envoyeTexte")}</p>
        <a href={`/${locale}/boutique`} className="inline-block mt-8 text-sm text-gold underline underline-offset-4">{t("boutique")}</a>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-28 md:pt-32 pb-20 grid grid-cols-1 md:grid-cols-[1fr_300px] gap-12">
      <div>
        <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
        <p className="mt-3 mb-8 text-ivory/65">{t("intro")}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="ct-nom" className="block text-sm text-ivory/70 mb-2">{t("nom")}</label>
              <input id="ct-nom" type="text" value={nom} onChange={(e) => setNom(e.target.value)} required maxLength={120} autoComplete="name" className={champ} />
            </div>
            <div>
              <label htmlFor="ct-email" className="block text-sm text-ivory/70 mb-2">{t("email")}</label>
              <input id="ct-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={200} autoComplete="email" className={champ} />
            </div>
          </div>
          <div>
            <label htmlFor="ct-sujet" className="block text-sm text-ivory/70 mb-2">{t("sujet")}</label>
            <input id="ct-sujet" type="text" value={sujet} onChange={(e) => setSujet(e.target.value)} required maxLength={150} className={champ} />
          </div>
          <div>
            <label htmlFor="ct-message" className="block text-sm text-ivory/70 mb-2">{t("message")}</label>
            <textarea id="ct-message" value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} maxLength={3000}
              placeholder={t("messageAide")} className={`${champ} resize-none`} />
          </div>
          <button type="submit" disabled={envoi}
            className="w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {envoi ? t("envoi") : t("envoyer")}
          </button>
          {erreur && <p role="alert" className="text-sm text-corail">{erreur}</p>}
          <p className="text-xs text-ivory/45">
            {t("rgpd")} <a href={`/${locale}/confidentialite`} className="underline hover:text-ivory/70">{t("confidentialite")}</a>.
          </p>
        </form>
      </div>

      <aside className="space-y-4 text-sm">
        <div className="rounded-xl border border-ivory/10 p-5">
          <p className="text-ivory font-medium">{t("emailTitre")}</p>
          <a href="mailto:info@estalviar.com" className="mt-1 block text-gold">info@estalviar.com</a>
          <p className="mt-1 text-ivory/55">{t("delai")}</p>
        </div>
        {RESEAUX.map((r) => (
          <a key={r.cle} href={r.url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl border border-ivory/10 p-5 hover:border-ivory/30 transition-colors">
            <IconeReseau cle={r.cle} className="w-6 h-6 text-gold shrink-0" />
            <span>
              <span className="block text-ivory font-medium">{r.nom}</span>
              <span className="block text-ivory/55">{r.compte}</span>
            </span>
          </a>
        ))}
        <a href={`/${locale}/aide`} className="block rounded-xl border border-ivory/10 p-5 hover:border-ivory/30 transition-colors">
          <p className="text-ivory font-medium">{t("aideTitre")}</p>
          <p className="mt-1 text-ivory/55">{t("aideTexte")}</p>
        </a>
        <a href={`/${locale}/professionnels`} className="block rounded-xl border border-ivory/10 p-5 hover:border-ivory/30 transition-colors">
          <p className="text-ivory font-medium">{t("proTitre")}</p>
          <p className="mt-1 text-ivory/55">{t("proTexte")}</p>
        </a>
        <a href={`/${locale}/retractation`} className="block rounded-xl border border-ivory/10 p-5 hover:border-ivory/30 transition-colors">
          <p className="text-ivory font-medium">{t("retractTitre")}</p>
          <p className="mt-1 text-ivory/55">{t("retractTexte")}</p>
        </a>
      </aside>
    </div>
  );
}
