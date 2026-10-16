"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { usePanier } from "../context/PanierContext";
import { supabase } from "../../../lib/supabase";
import { logoEnBlanc } from "../../../lib/couleursCartes";

export default function PageConfirmation() {
  return (
    <Suspense fallback={null}>
      <Confirmation />
    </Suspense>
  );
}

function Confirmation() {
  const t = useTranslations("confirmation");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { articles, videPanier, charge } = usePanier();
  const [statut, setStatut] = useState(sessionId ? "chargement" : "absente");
  const [cartes, setCartes] = useState([]); // copie du panier, gardée pour l'affichage une fois le panier vidé
  const [connecte, setConnecte] = useState(null);
  const envoye = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setConnecte(!!data.session));
  }, []);

  useEffect(() => {
    if (!sessionId || !charge || envoye.current) return;
    envoye.current = true;
    const copie = articles;

    const enregistrerCommande = async () => {
      try {
        // Le serveur retrouve lui-même le panier payé : on n'envoie que l'identifiant Stripe
        const res = await fetch("/api/enregistrer-commande", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        localStorage.removeItem("estalviar-emails-beneficiaires");
        if (res.ok) {
          setCartes(copie);
          setStatut("succes");
          videPanier();
        } else {
          setStatut("erreur");
        }
      } catch {
        setStatut("erreur");
      }
    };
    enregistrerCommande();
  }, [sessionId, charge, articles, videPanier]);

  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(n);
  const programmees = cartes.filter((c) => c.dateEnvoi).length;

  if (statut === "chargement") {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-40 pb-24 text-center" role="status">
        <div className="mx-auto w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-hidden />
        <p className="mt-6 text-ivory/65">{t("chargement")}</p>
      </div>
    );
  }

  if (statut !== "succes") {
    const erreur = statut === "erreur";
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">{erreur ? t("erreurTitre") : t("absenteTitre")}</h1>
        <p className="mt-4 text-ivory/65 leading-relaxed">{erreur ? t("erreurTexte") : t("absenteTexte")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {erreur && (
            <a href={`/${locale}/contact`} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">{t("contact")}</a>
          )}
          <a href={`/${locale}/boutique`} className="border border-ivory/25 text-ivory rounded-lg px-6 py-3 hover:border-ivory/50 transition-colors">{t("boutique")}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[860px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      {/* Les cartes achetées, en éventail */}
      {cartes.length > 0 && (
        <div aria-hidden className="relative h-44 sm:h-52 flex justify-center">
          {cartes.slice(0, 3).map((c, i, liste) => {
            const decalage = i - (liste.length - 1) / 2;
            return (
              <div key={c.id}
                className="absolute top-2 w-48 sm:w-56 aspect-[1.586/1] rounded-2xl p-4 flex flex-col justify-between border border-white/10 shadow-[0_25px_50px_-20px_rgba(0,0,0,0.9)]"
                style={{ background: c.background, transform: `translateX(${decalage * 70}px) rotate(${decalage * 7}deg)`, zIndex: 10 - Math.abs(decalage) }}>
                {c.image
                  ? <img src={c.image} alt="" className={`h-5 w-fit max-w-[60%] object-contain object-left ${logoEnBlanc(c) ? "brightness-0 invert opacity-90" : "rounded"}`} />
                  : <span className="text-white text-sm font-semibold">{c.marque}</span>}
                <span className="text-white text-2xl font-semibold font-[family-name:var(--font-titre)]">
                  {c.montant}<span className="text-gold text-base ml-0.5">€</span>
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center">
        <h1 className="mt-6 text-3xl md:text-4xl font-semibold text-ivory">{t("merciTitre")}</h1>
        <p className="mt-4 text-ivory/70 leading-relaxed max-w-[34rem] mx-auto">
          {programmees === 0 ? t("toutesEnvoyees") : programmees === cartes.length ? t("toutesProgrammees") : t("mixte")}
        </p>
      </div>

      {cartes.length > 0 && (
        <ul className="mt-10 rounded-2xl border border-ivory/10 divide-y divide-ivory/10">
          {cartes.map((c) => (
            <li key={c.id} className="flex items-center gap-4 px-5 py-4">
              <span className="w-12 aspect-[1.586/1] rounded shrink-0 border border-white/10" style={{ background: c.background }} aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="text-ivory text-sm font-medium truncate">
                  {c.marque}{c.beneficiaire ? <span className="text-ivory/55 font-normal"> {t("pour", { prenom: c.beneficiaire })}</span> : null}
                </p>
                <p className="text-xs text-gold/80">
                  {c.dateEnvoi
                    ? t("envoiLe", {
                        date: new Date(`${c.dateEnvoi}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", timeZone: "UTC" }),
                        heure: c.heureEnvoi || "",
                      })
                    : t("envoyee")}
                </p>
              </div>
              <span className="text-ivory text-sm whitespace-nowrap">{euros(c.montant)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        {[1, 2, 3].map((n) => (
          <div key={n} className="rounded-xl bg-ivory/[0.03] border border-ivory/10 p-4">
            <p className="text-ivory font-medium">{t(`info${n}Titre`)}</p>
            <p className="mt-1 text-ivory/60 leading-relaxed">{t(`info${n}Texte`)}</p>
          </div>
        ))}
      </div>

      {connecte === false && (
        <div className="mt-8 rounded-2xl border border-gold/30 bg-gold/[0.06] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-ivory font-semibold">{t("compteTitre")}</p>
            <p className="mt-1 text-sm text-ivory/65">{t("compteTexte")}</p>
          </div>
          <a href={`/${locale}/inscription`} className="shrink-0 bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-3 hover:bg-gold/90 transition-colors text-center">
            {t("compteBouton")}
          </a>
        </div>
      )}

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <a href={`/${locale}/boutique`} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">{t("autreCarte")}</a>
        {connecte && (
          <a href={`/${locale}/profil?onglet=commandes`} className="border border-ivory/25 text-ivory rounded-lg px-6 py-3 hover:border-ivory/50 transition-colors">{t("mesCommandes")}</a>
        )}
      </div>
    </div>
  );
}
