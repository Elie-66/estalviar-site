"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../../lib/supabase";
import { logoEnBlanc } from "../../../../lib/couleursCartes";
import SelecteurCarte from "../../components/SelecteurCarte";

const designs = [
  { id: "marque", nom: "Marque", background: (couleur = "#1b3a5c") => `linear-gradient(150deg, ${couleur} 0%, #0d1022 100%)` },
  { id: "or", nom: "Or", background: () => "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)" },
  { id: "ivoire", nom: "Ivoire", background: () => "linear-gradient(150deg, #F6F2E9 0%, #d9cdae 100%)", texteFonce: true },
  { id: "corail", nom: "Corail", background: () => "linear-gradient(150deg, #E5604D 0%, #5B3A5C 100%)" },
  { id: "ambre", nom: "Ambre", background: () => "linear-gradient(150deg, #C9A227 0%, #E5604D 100%)" },
  { id: "vert", nom: "Vert", background: () => "linear-gradient(150deg, #1f5c45 0%, #0d1022 100%)" },
  { id: "rouge", nom: "Rouge", background: () => "linear-gradient(150deg, #9c2b2b 0%, #0d1022 100%)" },
  { id: "rose", nom: "Rose", background: () => "linear-gradient(150deg, #e8a4c4 0%, #6b2f4d 100%)" },
];

export default function CreerCagnotte() {
  const t = useTranslations("cagnotteCreer");
  const tDesign = useTranslations("designs");
  const locale = useLocale();
  const [copie, setCopie] = useState(false);
  const [cartes, setCartes] = useState({});
  const [chargementCatalogue, setChargementCatalogue] = useState(true);
  const [slugCarte, setSlugCarte] = useState("");
  const [designId, setDesignId] = useState("marque");
  const [carteChoisie, setCarteChoisie] = useState(true);
  const [beneficiaire, setBeneficiaire] = useState("");
  const [message, setMessage] = useState("");
  const [montantLibre, setMontantLibre] = useState(false);
  const [montantObjectif, setMontantObjectif] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [envoiBeneficiaire, setEnvoiBeneficiaire] = useState(false);
  const [emailCreateur, setEmailCreateur] = useState("");
  const [emailBeneficiaire, setEmailBeneficiaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [lienCree, setLienCree] = useState(null);
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

  const carte = cartes[slugCarte];
  const designActuel = designs.find((d) => d.id === designId);

  const dateMin = new Date();
  dateMin.setDate(dateMin.getDate() + 1);
  const dateMinStr = dateMin.toISOString().split("T")[0];

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      const cartesParSlug = {};
      (data || []).forEach((c) => {
        cartesParSlug[c.slug] = { slug: c.slug, nom: c.nom, image: c.image, couleur: c.couleur };
      });
      setCartes(cartesParSlug);
      if (data && data.length > 0) setSlugCarte(data[0].slug);
      setChargementCatalogue(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailCreateur(user.email);
      }
    };
    charger();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");

    const res = await fetch("/api/creer-cagnotte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marque: carteChoisie ? carte.nom : "Estalviar (à choisir)",
        image: carteChoisie ? carte.image : "/logos/estalviar-icone.svg",
        background: carteChoisie
          ? designActuel.background(carte.couleur)
          : designActuel.background(),
        texteFonce: !!designActuel.texteFonce,
        design: designActuel.nom,
        carteChoisie,
        beneficiaire,
        message,
        montantLibre,
        montantObjectif: montantLibre ? null : parseInt(montantObjectif),
        dateFin,
        envoiBeneficiaire,
        emailCreateur,
        emailBeneficiaire: envoiBeneficiaire ? emailBeneficiaire : null,
      }),
    });

    const data = await res.json();
    setEnvoi(false);

    if (res.ok) {
      setLienCree(data.slug);
    } else {
      setErreur(data.error || t("erreur"));
    }
  };

  if (chargementCatalogue || !carte) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        {t("chargement")}
      </div>
    );
  }

  if (lienCree) {
    const lien = typeof window !== "undefined" ? `${window.location.origin}/${locale}/cagnotte/${lienCree}` : "";
    const partager = async () => {
      if (navigator.share) {
        try { await navigator.share({ title: t("partageTitre", { prenom: beneficiaire }), url: lien }); } catch { /* partage annulé */ }
      } else {
        await navigator.clipboard.writeText(lien);
        setCopie(true);
      }
    };
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="w-14 h-14 rounded-full border border-gold/50 text-gold text-2xl flex items-center justify-center mx-auto" aria-hidden>✓</div>
        <h1 className="mt-6 text-3xl font-semibold text-ivory">{t("preteTitre")}</h1>
        <p className="mt-4 text-ivory/65">{t("preteTexte")}</p>
        <div className="mt-6 border border-ivory/20 rounded-lg p-3 pl-4 flex items-center justify-between gap-4">
          <span className="text-sm text-gold truncate">{lien}</span>
          <button onClick={async () => { await navigator.clipboard.writeText(lien); setCopie(true); }}
            className="text-xs text-ivory/70 hover:text-ivory border border-ivory/20 rounded-md px-3 py-1.5 shrink-0">
            {copie ? t("copie") : t("copier")}
          </button>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={partager} className="bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">{t("partager")}</button>
          <a href={`/${locale}/cagnotte/${lienCree}`} className="border border-ivory/25 text-ivory rounded-lg px-6 py-3 hover:border-ivory/50 transition-colors">{t("voir")}</a>
        </div>
      </div>
    );
  }

  const fonce = !!designActuel.texteFonce;
  const carteVisuel = (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8 aspect-[1.586/1] flex flex-col justify-between border border-white/10"
      style={{
        background: carteChoisie ? designActuel.background(carte.couleur) : designActuel.background(),
        boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)",
      }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.14]"
        style={{ background: "linear-gradient(115deg, transparent 35%, #fff 50%, transparent 65%)" }} />
      <div className="relative flex items-start justify-between">
        <div className="h-10 w-36 flex items-center">
          {carteChoisie && carte.image ? (
            <img src={carte.image} alt={carte.nom}
              className={`max-h-full max-w-full object-contain object-left ${!fonce && logoEnBlanc(carte) ? "brightness-0 invert" : "rounded-md"}`} />
          ) : (
            <span className={`text-sm font-medium ${fonce ? "text-ink/70" : "text-white/80"}`}>{t("aChoisir")}</span>
          )}
        </div>
        <span className={`text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)] ${fonce ? "text-ink/50" : "text-white/70"}`}>ESTALVIAR</span>
      </div>
      <div className="relative">
        {(beneficiaire || message) && (
          <div className="mb-3">
            {beneficiaire && <p className={`text-lg font-medium truncate ${fonce ? "text-ink" : "text-white"}`}>{t("pour", { prenom: beneficiaire })}</p>}
            {message && <p className={`text-sm italic line-clamp-2 max-w-[85%] mt-0.5 ${fonce ? "text-ink/60" : "text-white/60"}`}>« {message} »</p>}
          </div>
        )}
        <div className={`h-px mb-3 ${fonce ? "bg-ink/20" : "bg-white/25"}`} />
        <p className={`text-4xl sm:text-5xl font-semibold leading-none font-[family-name:var(--font-fraunces)] ${fonce ? "text-ink" : "text-white"}`}>
          {montantLibre ? "?" : (montantObjectif || 0)}<span className="text-2xl text-gold ml-1">€</span>
        </p>
      </div>
    </div>
  );

  const selecteurEtDesigns = (prefixeCle) => (
    <>
      {carteChoisie && (
        <>
          <label className="block text-sm text-ivory/70 mb-2 mt-6">{t("enseigne")}</label>
          <SelecteurCarte cartes={cartes} valeur={slugCarte} onChange={setSlugCarte} />
        </>
      )}

      <label className="block text-sm text-ivory/70 mb-2 mt-4">{t("design")}</label>
      <div className="grid grid-cols-4 gap-2">
        {designs.map((d) => (
          <button
            key={`${prefixeCle}-${d.id}`}
            type="button"
            onClick={() => setDesignId(d.id)}
            title={tDesign.has(d.nom) ? tDesign(d.nom) : d.nom}
            aria-label={tDesign.has(d.nom) ? tDesign(d.nom) : d.nom}
            aria-pressed={designId === d.id}
            className={`h-9 rounded-lg border-2 transition-all ${
              designId === d.id ? "border-gold scale-105" : "border-transparent opacity-70"
            }`}
            style={{ background: carteChoisie ? d.background(carte.couleur) : d.background() }}
          />
        ))}
      </div>
      {!carteChoisie && (
        <p className="mt-1 text-xs text-ivory/40">
          {t("designAide")}
        </p>
      )}
    </>
  );

  return (
    <>
      {/* Carte : version mobile, toujours collée en haut pendant tout le scroll */}
      <div className="md:hidden sticky top-[74px] z-30 bg-ink px-6 pt-3 pb-3 border-b border-ivory/10">
        {carteVisuel}
      </div>

      <div className="max-w-[1100px] mx-auto px-6 pt-6 md:pt-32 pb-20">
        <p className="text-sm text-gold mb-2 mt-4">{t("surtitre")}</p>
        <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{t("titre")}</h1>
        <p className="mt-3 mb-10 text-ivory/65 max-w-[40rem]">{t("intro")}</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

          {/* Colonne gauche (desktop) : carte + choix enseigne/design. Cachée sur mobile (carte déjà affichée en haut, formulaire à suivre en une colonne) */}
          <div className="hidden md:block">
            <div className="md:sticky md:top-28">
              {carteVisuel}

              <label className="flex items-start gap-3 text-sm text-ivory/70 mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]"
                  checked={!carteChoisie}
                  onChange={(e) => setCarteChoisie(!e.target.checked)}
                />
                {t("choisieCloture")}
              </label>

              {selecteurEtDesigns("desktop")}
            </div>
          </div>

          {/* Colonne droite (desktop) / colonne unique (mobile) : reste du formulaire */}
          <div>
            {/* Sur mobile uniquement : checkbox + enseigne + design, puisque la carte est déjà affichée en haut, collée */}
            <div className="md:hidden">
              <label className="flex items-start gap-3 text-sm text-ivory/70 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]"
                  checked={!carteChoisie}
                  onChange={(e) => setCarteChoisie(!e.target.checked)}
                />
                {t("choisieCloture")}
              </label>

              {selecteurEtDesigns("mobile")}
            </div>

            <label className="block text-sm text-ivory/70 mb-2 mt-6">{t("pourQui")}</label>
            <input
              type="text"
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
              required
              maxLength={30}
              placeholder={t("pourQuiExemple")}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />

            <div className="flex items-center justify-between mb-2 mt-6">
              <label className="block text-sm text-ivory/70">{t("message")}</label>
              <span className="text-xs text-ivory/40">{message.length}/40</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              maxLength={40}
              placeholder={t("messageExemple")}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory resize-none"
            />

            <label className="flex items-start gap-3 text-sm text-ivory/70 mt-6 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]"
                checked={montantLibre}
                onChange={(e) => setMontantLibre(e.target.checked)}
              />
              {t("sansObjectif")}
            </label>

            {!montantLibre && (
              <>
                <label className="block text-sm text-ivory/70 mb-2 mt-4">{t("objectif")}</label>
                <input
                  type="number"
                  min="5"
                  value={montantObjectif}
                  onChange={(e) => setMontantObjectif(e.target.value)}
                  required={!montantLibre}
                  placeholder={t("objectifExemple")}
                  className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
                />
              </>
            )}

            <label className="block text-sm text-ivory/70 mb-2 mt-6">{t("dateFin")}</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              min={dateMinStr}
              required
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory [color-scheme:dark]"
            />
            <p className="mt-1 text-xs text-ivory/40">
              {t("dateFinAide")}
            </p>

            <label className="block text-sm text-ivory/70 mb-2 mt-6">{t("envoi")}</label>
            <div className="flex gap-2 border border-ivory/10 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setEnvoiBeneficiaire(false)}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  !envoiBeneficiaire ? "bg-gold text-ink font-medium" : "text-ivory/60"
                }`}
              >
                {t("envoiMoi")}
              </button>
              <button
                type="button"
                onClick={() => setEnvoiBeneficiaire(true)}
                className={`flex-1 text-sm py-2 rounded-md transition-colors ${
                  envoiBeneficiaire ? "bg-gold text-ink font-medium" : "text-ivory/60"
                }`}
              >
                {t("envoiBenef")}
              </button>
            </div>

            {envoiBeneficiaire && (
              <>
                <label className="block text-sm text-ivory/70 mb-2 mt-4">{t("emailBenef")}</label>
                <input
                  type="email"
                  value={emailBeneficiaire}
                  onChange={(e) => setEmailBeneficiaire(e.target.value)}
                  required={envoiBeneficiaire}
                  className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
                />
              </>
            )}

            {utilisateurConnecte ? (
              <p className="text-sm text-ivory/60 mt-6">
                {t("connecte")} <span className="text-gold">{emailCreateur}</span>
              </p>
            ) : (
              <>
                <label className="block text-sm text-ivory/70 mb-2 mt-6">{t("votreEmail")}</label>
                <input
                  type="email"
                  value={emailCreateur}
                  onChange={(e) => setEmailCreateur(e.target.value)}
                  required
                  placeholder={t("votreEmailAide")}
                  className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
                />
              </>
            )}

            <button
              type="submit"
              disabled={envoi}
              className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              {envoi ? t("creation") : t("creer")}
            </button>
            <p className="mt-3 text-xs text-ivory/45 leading-relaxed">
              {t("cgvAvant")}{" "}
              <a href={`/${locale}/cgv#cagnottes`} target="_blank" className="underline hover:text-ivory/70">{t("cgvLien")}</a>.
            </p>

            {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
          </div>
        </form>
      </div>
    </>
  );
}