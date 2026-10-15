"use client";

import { use, useState, useEffect } from "react";
import Tricolore from "../../components/Tricolore";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { usePanier } from "../../context/PanierContext";
import { supabase } from "../../../../lib/supabase";
import { logoEnBlanc } from "../../../../lib/couleursCartes";

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

export default function FicheCarte({ params }) {
  const { slug } = use(params);
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const t = useTranslations("ficheProduit");
  const tDesign = useTranslations("designs");
  const { ajouterArticle } = usePanier();

  const [carte, setCarte] = useState(null);
  const [autresCartes, setAutresCartes] = useState([]);
  const [chargement, setChargement] = useState(true);

  const [montant, setMontant] = useState(0);
  const [beneficiaire, setBeneficiaire] = useState("");
  const [message, setMessage] = useState("");
  const [designId, setDesignId] = useState("marque");
  const [jourEnvoi, setJourEnvoi] = useState("");
  const [moisEnvoi, setMoisEnvoi] = useState("");
  const [anneeEnvoi, setAnneeEnvoi] = useState("");
  const [heureEnvoi, setHeureEnvoi] = useState("");
  const [minuteEnvoi, setMinuteEnvoi] = useState("");
  const [confirmationVisible, setConfirmationVisible] = useState(false);

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .eq("slug", slug)
        .eq("actif", true)
        .single();

      setCarte(data);
      if (data) {
        // Choix faits sur la carte de l'accueil (?pour=Camille&montant=50&message=…)
        const params = new URLSearchParams(window.location.search);
        const montantDemande = Number(params.get("montant"));
        setMontant(
          montantDemande >= data.montant_min && montantDemande <= data.montant_max ? montantDemande : data.montant_min
        );
        if (params.get("pour")) setBeneficiaire(params.get("pour").slice(0, 30));
        if (params.get("message")) setMessage(params.get("message").slice(0, 40));
      }

      const { data: memeCategorie } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .eq("categorie", data?.categorie || "")
        .neq("slug", slug)
        .order("ordre", { ascending: true });

      let suggestions = memeCategorie || [];

      if (suggestions.length < 2) {
        const { data: toutesCartes } = await supabase
          .from("catalogue")
          .select("*")
          .eq("actif", true)
          .neq("slug", slug);

        const resTop = await fetch("/api/top-ventes");
        const { classement } = await resTop.json();

        const dejaAjoutees = new Set(suggestions.map((c) => c.slug));
        const restantes = (toutesCartes || []).filter((c) => !dejaAjoutees.has(c.slug));

        restantes.sort((a, b) => {
          const posA = classement.indexOf(a.nom);
          const posB = classement.indexOf(b.nom);
          const rangA = posA === -1 ? 999 : posA;
          const rangB = posB === -1 ? 999 : posB;
          return rangA - rangB;
        });

        suggestions = [...suggestions, ...restantes];
      }

      setAutresCartes(suggestions.slice(0, 2));
      setChargement(false);
    };
    charger();
  }, [slug]);

  if (chargement) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        {t("chargement")}
      </div>
    );
  }

  if (!carte) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-ivory">
        {t("carteIntrouvable")}
      </div>
    );
  }

  const design = designs.find((d) => d.id === designId) ?? designs[0];
  const texteFonce = !!design.texteFonce;
  const couleurTexte = texteFonce ? "text-ink" : "text-white";
  const couleurTexteAtt = texteFonce ? "text-ink/60" : "text-white/60";
  const couleurTexteAtt2 = texteFonce ? "text-ink/40" : "text-white/40";
  const backgroundActuel = design.background(carte.couleur);

  const aujourdHui = new Date();
  const annees = [aujourdHui.getFullYear(), aujourdHui.getFullYear() + 1];
  const mois = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 15)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" })
  ).map((m) => m.charAt(0).toUpperCase() + m.slice(1));
  const jours = Array.from({ length: 31 }, (_, i) => i + 1);
  const heures = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutes = ["00", "15", "30", "45"];

  const dateEnvoiComplete =
    jourEnvoi && moisEnvoi && anneeEnvoi
      ? `${anneeEnvoi}-${String(Number(moisEnvoi) + 1).padStart(2, "0")}-${String(jourEnvoi).padStart(2, "0")}`
      : null;
  const heureEnvoiComplete =
    dateEnvoiComplete ? `${heureEnvoi || "09"}:${minuteEnvoi || "00"}` : null;

  // Vérifications avant l'ajout au panier
  const versTexte = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dansUnAn = new Date(aujourdHui.getFullYear() + 1, aujourdHui.getMonth(), aujourdHui.getDate());
  const dateIncomplete = (jourEnvoi || moisEnvoi || anneeEnvoi) && !dateEnvoiComplete;
  const dateExiste = !dateEnvoiComplete || (() => {
    const d = new Date(Number(anneeEnvoi), Number(moisEnvoi), Number(jourEnvoi));
    return d.getMonth() === Number(moisEnvoi) && d.getDate() === Number(jourEnvoi);
  })();
  const maintenantTexte = `${versTexte(aujourdHui)}T${String(aujourdHui.getHours()).padStart(2, "0")}:${String(aujourdHui.getMinutes()).padStart(2, "0")}`;
  const erreurDate = dateIncomplete ? t("dateIncomplete")
    : !dateExiste ? t("dateInvalide")
    : dateEnvoiComplete && `${dateEnvoiComplete}T${heureEnvoiComplete}` <= maintenantTexte ? t("datePassee")
    : dateEnvoiComplete && dateEnvoiComplete > versTexte(dansUnAn) ? t("dateTropLoin")
    : "";
  const montantValide = Number.isFinite(montant) && montant >= carte.montant_min && montant <= carte.montant_max;
  const logoBlanc = !texteFonce && logoEnBlanc(carte);

  const carteVisuel = (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-8 aspect-[1.586/1] flex flex-col justify-between border border-white/10"
      style={{ background: backgroundActuel, boxShadow: "0 30px 60px -20px rgba(0,0,0,0.8)" }}
    >
      <div aria-hidden className="absolute inset-0 opacity-[0.14]"
        style={{ background: "linear-gradient(115deg, transparent 35%, #fff 50%, transparent 65%)" }} />

      <div className="relative flex items-start justify-between">
        {/* Logo posé sur la carte, sans cadre (comme sur l'accueil) */}
        <div className="h-10 sm:h-12 w-36 flex items-center">
          {carte.image ? (
            <img src={carte.image} alt={carte.nom}
              className={`max-h-full max-w-full object-contain object-left drop-shadow-[0_1px_2px_rgba(0,0,0,0.25)] ${logoBlanc ? "brightness-0 invert" : "rounded-md"}`} />
          ) : (
            <span className={`text-lg font-semibold font-[family-name:var(--font-fraunces)] ${couleurTexte}`}>{carte.nom}</span>
          )}
        </div>
        <span className={`text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)] ${texteFonce ? "text-ink/50" : "text-white/70"}`}>
          ESTALVIAR
        </span>
      </div>

      <div className="relative">
        {(beneficiaire || message) && (
          <div className="mb-3">
            {beneficiaire && <p className={`text-lg font-medium truncate ${couleurTexte}`}>{t("pour", { prenom: beneficiaire })}</p>}
            {message && <p className={`text-sm italic line-clamp-2 max-w-[85%] mt-0.5 ${couleurTexteAtt}`}>« {message} »</p>}
          </div>
        )}
        <div className={`h-px mb-3 ${texteFonce ? "bg-ink/20" : "bg-white/25"}`} />
        <div className="flex items-end justify-between">
          <p className={`text-4xl sm:text-5xl font-semibold leading-none font-[family-name:var(--font-fraunces)] ${couleurTexte}`}>
            {montant || 0}<span className="text-2xl text-gold ml-1">€</span>
          </p>
          <span className={`text-[10px] font-[family-name:var(--font-space-mono)] tracking-wider ${couleurTexteAtt2}`}>
            •••• •••• ••••
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Carte : version mobile, toujours collée en haut pendant tout le scroll */}
      <div className="md:hidden sticky top-[74px] z-30 bg-ink px-6 pt-3 pb-3 border-b border-ivory/10">
        {carteVisuel}
      </div>

      <div className="max-w-[1100px] mx-auto px-6 pt-8 md:pt-32 pb-20 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-start">

        <div>
          {/* Carte : version desktop uniquement, collée dans sa colonne */}
          <div className="hidden md:block">
            {carteVisuel}

            <p className="mt-4 text-center text-xs text-ivory/30 font-[family-name:var(--font-space-mono)] uppercase tracking-wide">
              {t("apercu")}
            </p>
          </div>

          <p className="md:hidden mt-1 text-center text-xs text-ivory/30 font-[family-name:var(--font-space-mono)] uppercase tracking-wide">
            {t("apercu")}
          </p>

          <div className="mt-6">
            <label className="block text-sm text-ivory/70 mb-3">{t("choisirDesign")}</label>
            <div className="grid grid-cols-4 gap-3">
              {designs.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setDesignId(d.id)}
                  title={tDesign.has(d.nom) ? tDesign(d.nom) : d.nom}
                  aria-label={tDesign.has(d.nom) ? tDesign(d.nom) : d.nom}
                  aria-pressed={designId === d.id}
                  className={`h-12 rounded-lg border-2 transition-all ${
                    designId === d.id ? "border-gold scale-105" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  style={{ background: d.background(carte.couleur) }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 bg-ink-secondary/50 border border-ivory/10 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-gold mb-2">{t("commentCaMarche")}</p>
            <ol className="text-sm text-ivory/60 space-y-1 list-decimal list-inside">
              <li>{t("etape1")}</li>
              <li>{t("etape2")}</li>
              <li>{t("etape3")}</li>
            </ol>
          </div>

          {autresCartes.length > 0 && (
            <div className="mt-6">
              <label className="block text-sm text-ivory/70 mb-3">{t("pourriezAimer")}</label>
              <div className="grid grid-cols-2 gap-3">
                {autresCartes.map((c) => (
                  <a
                    key={c.slug}
                    href={`/${locale}/boutique/${c.slug}`}
                    className="border border-ivory/10 rounded-lg p-3 flex items-center gap-3 hover:border-gold/40 transition-colors"
                  >
                    <div className="bg-white rounded-md p-1.5 flex-shrink-0">
                      <img src={c.image} alt={c.nom} className="h-4 object-contain" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-ivory text-sm font-medium truncate">{c.nom}</p>
                      <p className="text-ivory/40 text-xs">{t("des")} {c.montant_min} €</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <a href={`/${locale}/boutique`} className="text-sm text-ivory/55 hover:text-gold">‹ {t("retourBoutique")}</a>
          <p className="mt-4 text-sm text-gold mb-1">{t("carteCadeau")}</p>
          <h1 className="text-4xl font-semibold text-ivory">{carte.nom}</h1>
          {carte.made_in_france && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-ivory/80">
              <Tricolore /> {t("fabriqueEnFrance")}
            </p>
          )}
          <p className="mt-4 text-ivory/70 leading-relaxed">
            {locale !== "fr" && carte[`description_${locale}`] ? carte[`description_${locale}`] : carte.description}
          </p>

          <div className="mt-10">
            <label className="block text-sm text-ivory/70 mb-3">{t("choisirMontant")}</label>
            <div className="grid grid-cols-4 gap-3">
              {carte.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={montant === s}
                  onClick={() => setMontant(s)}
                  className={`border rounded-lg py-3 transition-colors ${
                    montant === s
                      ? "border-gold text-gold"
                      : "border-ivory/20 text-ivory hover:border-gold hover:text-gold"
                  }`}
                >
                  {s} €
                </button>
              ))}
            </div>

            <p className="mt-4 text-xs text-ivory/40">
              {t("montantLibre")} {carte.montant_min} € {t("et")} {carte.montant_max} €
            </p>
            <input
              type="number"
              min={carte.montant_min}
              max={carte.montant_max}
              value={montant}
              onChange={(e) => setMontant(Number(e.target.value))}
              aria-label={t("choisirMontant")}
              aria-invalid={!montantValide}
              className={`mt-2 w-full bg-transparent border rounded-lg px-4 py-3 text-ivory ${montantValide ? "border-ivory/20" : "border-corail/70"}`}
            />
            {!montantValide && (
              <p className="mt-1.5 text-xs text-corail">{t("montantInvalide", { min: carte.montant_min, max: carte.montant_max })}</p>
            )}
          </div>

          <div className="mt-8">
            <label className="block text-sm text-ivory/70 mb-2">{t("nomBeneficiaire")}</label>
            <input
              type="text"
              value={beneficiaire}
              onChange={(e) => setBeneficiaire(e.target.value)}
              placeholder={t("exempleCamille")}
              maxLength={30}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm text-ivory/70">{t("message")}</label>
              <span className="text-xs text-ivory/40">{message.length}/40</span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("placeholderMessage")}
              maxLength={40}
              rows={3}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory resize-none"
            />
          </div>

          <div className="mt-6">
            <label className="block text-sm text-ivory/70 mb-2">{t("dateHeureEnvoi")}</label>

            <div className="grid grid-cols-3 gap-3">
              <select
                value={jourEnvoi}
                onChange={(e) => setJourEnvoi(e.target.value)}
                className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
              >
                <option value="" className="bg-ink">{t("jour")}</option>
                {jours.map((j) => (
                  <option key={j} value={j} className="bg-ink">{j}</option>
                ))}
              </select>

              <select
                value={moisEnvoi}
                onChange={(e) => setMoisEnvoi(e.target.value)}
                className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
              >
                <option value="" className="bg-ink">{t("mois")}</option>
                {mois.map((m, i) => (
                  <option key={m} value={i} className="bg-ink">{m}</option>
                ))}
              </select>

              <select
                value={anneeEnvoi}
                onChange={(e) => setAnneeEnvoi(e.target.value)}
                className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm"
              >
                <option value="" className="bg-ink">{t("annee")}</option>
                {annees.map((a) => (
                  <option key={a} value={a} className="bg-ink">{a}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <select
                value={heureEnvoi}
                onChange={(e) => setHeureEnvoi(e.target.value)}
                disabled={!dateEnvoiComplete}
                className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm disabled:opacity-30"
              >
                <option value="" className="bg-ink">{t("heure")}</option>
                {heures.map((h) => (
                  <option key={h} value={h} className="bg-ink">{h} h</option>
                ))}
              </select>

              <select
                value={minuteEnvoi}
                onChange={(e) => setMinuteEnvoi(e.target.value)}
                disabled={!dateEnvoiComplete}
                className="bg-transparent border border-ivory/20 rounded-lg px-3 py-3 text-ivory text-sm disabled:opacity-30"
              >
                <option value="" className="bg-ink">{t("minutes")}</option>
                {minutes.map((m) => (
                  <option key={m} value={m} className="bg-ink">{m} min</option>
                ))}
              </select>
            </div>

            {erreurDate
              ? <p className="mt-2 text-xs text-corail">{erreurDate}</p>
              : <p className="mt-2 text-xs text-ivory/40">{t("envoiImmediat")}</p>}
          </div>

          <button
            type="button"
            disabled={!montantValide || !!erreurDate}
            onClick={() => {
              ajouterArticle({
                slug: carte.slug,
                marque: carte.nom,
                montant,
                beneficiaire,
                message,
                design: design.nom,
                image: carte.image,
                background: backgroundActuel,
                texteFonce,
                dateEnvoi: dateEnvoiComplete,
                heureEnvoi: heureEnvoiComplete,
              });
              setConfirmationVisible(true);
              setTimeout(() => setConfirmationVisible(false), 6000);
            }}
            className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("ajouterPanier")}
          </button>

          {confirmationVisible && (
            <div role="status" className="mt-3 flex items-center gap-2 text-sm text-vert bg-vert/10 border border-vert/30 rounded-lg px-4 py-3">
              <span aria-hidden>✓</span>
              <span className="flex-1">{t("ajouteePanier")}</span>
              <a href={`/${locale}/panier`} className="text-ivory underline underline-offset-2 hover:text-gold whitespace-nowrap">{t("voirPanier")}</a>
            </div>
          )}
        </div>

      </div>
    </>
  );
}