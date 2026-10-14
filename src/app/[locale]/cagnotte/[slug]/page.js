"use client";

import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../../lib/supabase";

const MONTANTS_RAPIDES = [10, 20, 30, 50];
const champ = "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm outline-none focus:border-gold/60 transition-colors";

export default function PageCagnotte({ params }) {
  const { slug } = use(params);
  const t = useTranslations("cagnottePage");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const contributionId = searchParams.get("contribution");
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(Number(n) || 0);

  const [cagnotte, setCagnotte] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [nomContributeur, setNomContributeur] = useState("");
  const [emailContributeur, setEmailContributeur] = useState("");
  const [montant, setMontant] = useState("");
  const [messageContribution, setMessageContribution] = useState("");
  const [envoiContribution, setEnvoiContribution] = useState(false);
  const [erreurContribution, setErreurContribution] = useState("");
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);
  const [commandesCagnotte, setCommandesCagnotte] = useState([]);
  const [messageRenvoi, setMessageRenvoi] = useState({});
  const [lienCopie, setLienCopie] = useState(false);
  const [merci, setMerci] = useState(null); // retour de paiement : remerciement + invitation

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailContributeur(user.email);
        const { data: profil } = await supabase.from("profils").select("pseudo, prenom").eq("id", user.id).maybeSingle();
        setNomContributeur(profil?.pseudo || profil?.prenom || user.email.split("@")[0]);
      }

      if (sessionId && contributionId) {
        const reponse = await fetch("/api/confirmer-contribution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, contributionId }),
        });
        const confirmation = await reponse.json().catch(() => ({}));
        if (confirmation.merci) setMerci(confirmation.merci);
      }

      // Infos publiques de la cagnotte (sans emails) via le serveur
      const lirePublique = async () => {
        const res = await fetch(`/api/cagnotte-publique?slug=${encodeURIComponent(slug)}`);
        return res.ok ? res.json() : { cagnotte: null, contributions: [], commandes: [] };
      };
      let infos = await lirePublique();
      const donnees = infos.cagnotte;
      if (donnees && donnees.date_fin && new Date(donnees.date_fin) <= new Date() && donnees.statut === "ouverte") {
        await fetch("/api/cloturer-cagnotte", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cagnotteId: donnees.id }),
        });
        infos = await lirePublique();
      }
      setCagnotte(infos.cagnotte);
      setContributions(infos.contributions || []);
      setCommandesCagnotte(infos.commandes || []);
      setChargement(false);
    };
    charger();
  }, [slug, sessionId, contributionId]);

  const handleContribuer = async () => {
    setEnvoiContribution(true);
    setErreurContribution("");
    try {
      const res = await fetch("/api/contribuer-cagnotte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cagnotteId: cagnotte.id,
          slug,
          nomContributeur,
          emailContributeur,
          montant: parseInt(montant, 10),
          messageContribution,
          locale,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setErreurContribution(data.error || t("erreur"));
    } catch {
      setErreurContribution(t("erreur"));
    }
    setEnvoiContribution(false);
  };

  // cible : "createur" ou "beneficiaire" (le serveur retrouve l'adresse lui-même)
  const handleRenvoyer = async (commandeId, cible) => {
    setMessageRenvoi((prev) => ({ ...prev, [commandeId]: t("envoi") }));
    const res = await fetch("/api/renvoyer-carte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commandeId, cible }),
    });
    setMessageRenvoi((prev) => ({ ...prev, [commandeId]: res.ok ? t("renvoyee") : t("erreurEnvoi") }));
  };

  const partager = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try { await navigator.share({ title: t("titre", { prenom: cagnotte.beneficiaire }), url }); return; } catch { /* annulé */ }
    }
    await navigator.clipboard.writeText(url);
    setLienCopie(true);
    setTimeout(() => setLienCopie(false), 2000);
  };

  if (chargement) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-40 pb-24 text-center" role="status">
        <div className="mx-auto w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-hidden />
        <p className="mt-6 text-ivory/60">{t("chargement")}</p>
      </div>
    );
  }

  if (!cagnotte) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">{t("introuvable")}</h1>
        <p className="mt-4 text-ivory/60">{t("introuvableTexte")}</p>
        <a href={`/${locale}/cagnotte/creer`} className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90">{t("creerUne")}</a>
      </div>
    );
  }

  const pourcentage = cagnotte.montant_libre
    ? 100
    : Math.min(100, Math.round((cagnotte.montant_collecte / cagnotte.montant_objectif) * 100));
  const complete = cagnotte.statut === "cloturee" || cagnotte.statut === "attente_choix";
  const fonce = cagnotte.texte_fonce;
  const montantValide = Number(montant) >= 1 && Number.isInteger(Number(montant));

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-28 md:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-14 items-start">
      <div>
        {/* La carte de la cagnotte */}
        <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8 aspect-[1.586/1] max-w-[560px] flex flex-col justify-between border border-white/10"
          style={{ background: cagnotte.background, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)" }}>
          <div aria-hidden className="absolute inset-0 opacity-[0.14]" style={{ background: "linear-gradient(115deg, transparent 35%, #fff 50%, transparent 65%)" }} />
          <div className="relative flex items-start justify-between">
            {cagnotte.carte_choisie && cagnotte.image
              ? <img src={cagnotte.image} alt={cagnotte.marque} className="h-9 max-w-[45%] object-contain object-left rounded-md" />
              : <span className={`text-sm font-medium ${fonce ? "text-ink/70" : "text-white/80"}`}>{t("carteAuChoix")}</span>}
            <span className={`text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)] ${fonce ? "text-ink/50" : "text-white/70"}`}>ESTALVIAR</span>
          </div>
          <div className="relative">
            <p className={`text-lg font-medium ${fonce ? "text-ink" : "text-white"}`}>{t("pour", { prenom: cagnotte.beneficiaire })}</p>
            {cagnotte.message && <p className={`text-sm italic mt-0.5 ${fonce ? "text-ink/60" : "text-white/65"}`}>« {cagnotte.message} »</p>}
            <div className={`h-px my-3 ${fonce ? "bg-ink/20" : "bg-white/25"}`} />
            <p className={`text-4xl sm:text-5xl font-semibold leading-none font-[family-name:var(--font-fraunces)] ${fonce ? "text-ink" : "text-white"}`}>
              {euros(cagnotte.montant_collecte)}
            </p>
          </div>
        </div>

        <h1 className="mt-8 text-3xl font-semibold text-ivory">{t("titre", { prenom: cagnotte.beneficiaire })}</h1>
        <p className="mt-2 text-ivory/65">
          {cagnotte.montant_libre
            ? t("collecte", { montant: euros(cagnotte.montant_collecte) })
            : t("collecteSur", { montant: euros(cagnotte.montant_collecte), objectif: euros(cagnotte.montant_objectif) })}
          {" · "}{t("participants", { n: contributions.length })}
        </p>
        {!cagnotte.montant_libre && (
          <div className="mt-4 max-w-[560px]">
            <div className="h-2.5 bg-ivory/10 rounded-full overflow-hidden">
              <div className="h-full bg-gold rounded-full transition-all" style={{ width: `${pourcentage}%` }} />
            </div>
            <p className="mt-1.5 text-sm text-gold">{pourcentage} %</p>
          </div>
        )}
        {cagnotte.date_fin && cagnotte.statut === "ouverte" && (
          <p className="mt-2 text-sm text-ivory/50">
            {t("clotureLe", { date: new Date(cagnotte.date_fin).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) })}
          </p>
        )}

        {contributions.length > 0 && (
          <div className="mt-10 max-w-[560px]">
            <h2 className="text-lg font-semibold text-ivory mb-4">{t("contributeurs")}</h2>
            <ul className="divide-y divide-ivory/10 border-y border-ivory/10">
              {contributions.map((c) => (
                <li key={c.id} className="flex justify-between gap-4 py-3 text-sm">
                  <div className="min-w-0">
                    <span className="text-ivory">{c.nom_contributeur}</span>
                    {c.message && <p className="text-ivory/50 italic truncate">« {c.message} »</p>}
                  </div>
                  <span className="text-gold whitespace-nowrap">{euros(c.montant)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="lg:sticky lg:top-28 space-y-6">
        {merci && (
          <div className="border border-gold/30 bg-gold/[0.06] rounded-2xl p-6 text-center">
            <p className="text-ivory font-medium">{t("merci", { montant: euros(merci.montant) })}</p>
            {utilisateurConnecte || merci.compteExiste ? (
              <p className="text-sm text-ivory/65 mt-2">{t("merciPoints", { n: Math.floor(merci.montant) })}</p>
            ) : merci.email ? (
              <>
                <p className="text-sm text-ivory/65 mt-2">{t("merciCompte", { email: merci.email, n: Math.floor(merci.montant) })}</p>
                <a href={`/${locale}/inscription?email=${encodeURIComponent(merci.email)}`}
                  className="inline-block mt-4 bg-gold text-ink font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-gold/90 transition-colors">
                  {t("creerCompte")}
                </a>
              </>
            ) : (
              <p className="text-sm text-ivory/65 mt-2">{t("merciSansEmail")}</p>
            )}
          </div>
        )}

        {complete ? (
          <div>
            <div className="text-center border border-vert/30 bg-vert/10 rounded-2xl p-6">
              <p className="text-vert font-medium">{t("cloturee")} 🎉</p>
              <p className="text-sm text-ivory/65 mt-1">{cagnotte.statut === "attente_choix" ? t("attenteChoix") : t("carteEnvoyee")}</p>
            </div>
            {cagnotte.statut === "cloturee" && commandesCagnotte.length > 0 && (
              <div className="mt-6 space-y-4">
                {commandesCagnotte.map((cmd) => (
                  <div key={cmd.id} className="border border-ivory/10 rounded-xl p-4">
                    <p className="text-ivory font-medium">{cmd.marque} · {euros(cmd.montant)}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <button onClick={() => handleRenvoyer(cmd.id, "createur")}
                        className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors">
                        {t("renvoyerMoi")}
                      </button>
                      {cagnotte.a_email_beneficiaire && (
                        <button onClick={() => handleRenvoyer(cmd.id, "beneficiaire")}
                          className="text-xs text-gold border border-gold/30 rounded-lg px-3 py-1.5 hover:bg-gold/10 transition-colors">
                          {t("renvoyerBenef")}
                        </button>
                      )}
                    </div>
                    {messageRenvoi[cmd.id] && <p className="text-xs text-ivory/55 mt-2">{messageRenvoi[cmd.id]}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="border border-ivory/15 bg-ivory/[0.03] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-ivory mb-5">{t("participer")}</h2>

            {utilisateurConnecte ? (
              <p className="text-sm text-ivory/65 mb-4">
                {t("connecte")} <span className="text-gold">{nomContributeur}</span>
              </p>
            ) : (
              <>
                <label htmlFor="ct-nom" className="block text-sm text-ivory/70 mb-2">{t("votreNom")}</label>
                <input id="ct-nom" type="text" value={nomContributeur} onChange={(e) => setNomContributeur(e.target.value)} maxLength={60} className={champ} />
                <label htmlFor="ct-email" className="block text-sm text-ivory/70 mb-2 mt-4">{t("email")}</label>
                <input id="ct-email" type="email" value={emailContributeur} onChange={(e) => setEmailContributeur(e.target.value)} autoComplete="email" className={champ} />
                <p className="mt-1.5 text-xs text-ivory/45">{t("emailAide")}</p>
              </>
            )}

            <p className="block text-sm text-ivory/70 mb-2 mt-4">{t("montant")}</p>
            <div className="grid grid-cols-4 gap-2 mb-2" role="group" aria-label={t("montant")}>
              {MONTANTS_RAPIDES.map((m) => (
                <button key={m} type="button" onClick={() => setMontant(String(m))} aria-pressed={Number(montant) === m}
                  className={`rounded-lg py-2 text-sm border transition-colors ${Number(montant) === m ? "border-gold text-gold bg-gold/10" : "border-ivory/20 text-ivory/80 hover:border-ivory/40"}`}>
                  {m} €
                </button>
              ))}
            </div>
            <input type="number" min="1" step="1" value={montant} onChange={(e) => setMontant(e.target.value)}
              placeholder={t("autreMontant")} aria-label={t("autreMontant")} className={champ} />

            <label htmlFor="ct-msg" className="block text-sm text-ivory/70 mb-2 mt-4">{t("message")}</label>
            <input id="ct-msg" type="text" value={messageContribution} onChange={(e) => setMessageContribution(e.target.value)} maxLength={60} className={champ} />

            <button onClick={handleContribuer} disabled={!nomContributeur || !montantValide || envoiContribution}
              className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
              {envoiContribution ? t("redirection") : montantValide ? t("participerMontant", { montant: euros(montant) }) : t("participer")}
            </button>
            {erreurContribution && <p role="alert" className="mt-3 text-sm text-corail">{erreurContribution}</p>}
            <p className="mt-3 text-xs text-ivory/45 leading-relaxed">
              {t("cgvAvant")}{" "}
              <a href={`/${locale}/cgv#cagnottes`} target="_blank" className="underline hover:text-ivory/70">{t("cgvLien")}</a>. {t("cgvApres")}
            </p>
          </div>
        )}

        {!complete && (
          <button onClick={partager}
            className="w-full border border-ivory/20 text-ivory/85 rounded-lg px-6 py-3 text-sm hover:border-ivory/40 transition-colors">
            {lienCopie ? t("lienCopie") : t("partager")}
          </button>
        )}
      </div>
    </div>
  );
}
