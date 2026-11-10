"use client";

import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import BandeauEvenement from "./components/BandeauEvenement";
import { Newsletter } from "./components/SectionsAccueil";
import HeroCarte from "./components/accueil/HeroCarte";
import VignetteEnseigne from "./components/accueil/VignetteEnseigne";
import CarrouselUnivers from "./components/accueil/CarrouselUnivers";
import SectionFrance from "./components/accueil/SectionFrance";
import { Icone } from "./components/accueil/Icones";
import { textesAccueil } from "./components/accueil/textes";

// Enseignes proposées sur la carte de l'accueil si le catalogue n'est pas encore chargé
const apercus = [
  { slug: "amazon", nom: "Amazon", image: "/logos/amazon.svg", categorie: "Généraliste", montant_min: 15 },
  { slug: "fnac", nom: "Fnac", image: "/logos/fnac.svg", categorie: "High-tech & multimédia", montant_min: 15 },
  { slug: "steam", nom: "Steam", image: "/logos/steam.svg", categorie: "Jeux vidéo", montant_min: 15 },
  { slug: "decathlon", nom: "Decathlon", image: "/logos/decathlon.svg", categorie: "Sport", montant_min: 15 },
  { slug: "zara", nom: "Zara", image: "/logos/zara.svg", categorie: "Mode & chaussures", montant_min: 15 },
];

// Paliers de fidélité (mêmes seuils que la page Fidélité ; 1 € dépensé = 1 point)
const PALIERS_ACCUEIL = [
  { cle: "bronze", seuil: 0, couleur: "#B08D57" },
  { cle: "argent", seuil: 100, couleur: "#9A9A9A" },
  { cle: "or", seuil: 300, couleur: "#C9A227" },
  { cle: "platine", seuil: 700, couleur: "#7F8A96" },
];

const titreSection = "font-[family-name:var(--font-titre)] font-medium text-[30px] md:text-[34px] leading-[1.15] text-ink";
const lien = "text-[15px] font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink";
const boutonSombre = "inline-block bg-ink text-white text-[15px] font-semibold rounded px-6 py-3.5 hover:bg-ink/85 transition-colors";
const boutonOr = "inline-block bg-gold text-ink text-[15px] font-semibold rounded px-6 py-3.5 hover:bg-[#B8921F] transition-colors";

export default function Home() {
  const t2 = useTranslations("accueil2");
  const tCategories = useTranslations("categories");
  const tFid = useTranslations("fideliteAccueil");
  const tFaq = useTranslations("faqAccueil");
  const locale = useLocale();
  const tx = textesAccueil(locale);

  const [populaires, setPopulaires] = useState([]);
  const [marquesHero, setMarquesHero] = useState(apercus);
  const [fabriquees, setFabriquees] = useState([]); // enseignes fabriquées en France
  const [catalogue, setCatalogue] = useState([]); // toutes les enseignes actives
  const [avecEvenement, setAvecEvenement] = useState(false); // bandeau d'événement affiché en haut

  useEffect(() => {
    const charger = async () => {
      const { data: toutesCartes } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      let classement = [];
      try {
        const resTop = await fetch("/api/top-ventes");
        ({ classement = [] } = await resTop.json());
      } catch {
        // sans classement, on garde l'ordre du catalogue
      }

      const tri = [...(toutesCartes || [])];
      if (classement.length > 0) {
        tri.sort((a, b) => {
          const rang = (c) => (classement.indexOf(c.nom) === -1 ? 999 : classement.indexOf(c.nom));
          return rang(a) - rang(b);
        });
      }
      setPopulaires(tri.slice(0, 12));

      // La carte de l'accueil propose les enseignes les plus demandées qui ont un logo
      const avecLogo = tri.filter((c) => c.image).slice(0, 5);
      if (avecLogo.length >= 3) setMarquesHero(avecLogo);

      setFabriquees(tri.filter((c) => c.made_in_france).slice(0, 4));
      setCatalogue(toutesCartes || []);
    };
    charger();
  }, []);

  // Catégorie sans traduction (ex. nouvelle catégorie du catalogue) : on affiche son nom tel quel
  const traduireCategorie = useCallback(
    (cat) => (cat && tCategories.has(cat) ? tCategories(cat) : cat),
    [tCategories]
  );

  // Univers du catalogue, du plus fourni au moins fourni
  const categories = useMemo(() => {
    const compte = {};
    catalogue.forEach((c) => {
      if (c.categorie) compte[c.categorie] = (compte[c.categorie] || 0) + 1;
    });
    return Object.entries(compte)
      .map(([nom, n]) => ({ nom, n }))
      .sort((a, b) => b.n - a.n);
  }, [catalogue]);

  return (
    <div className="flex flex-col flex-1 bg-[#F6F5F2] text-ink">
      {/* Le header est fixe : on réserve sa hauteur pour que rien ne passe dessous */}
      {!avecEvenement && <div aria-hidden className="h-[74px] bg-ink shrink-0" />}
      {/* Bandeau de l'événement du moment (Fête des mères, Noël…), juste sous le menu */}
      <BandeauEvenement onAffiche={setAvecEvenement} />

      {/* Hero : fond sable chaud, la carte bleu nuit est le point focal */}
      <section className="bg-[#EFE9DC] border-b border-[#E0D8C6]">
        <div className="max-w-[1240px] mx-auto px-6 pt-12 pb-14 lg:pt-14 lg:pb-16 grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-10 lg:gap-14 items-center">
          <div>
            <h1 className="font-[family-name:var(--font-titre)] font-medium text-[40px] leading-[1.08] sm:text-[48px] lg:text-[56px] lg:leading-[1.05] tracking-[-0.01em] text-ink">
              {tx.titre}<span className="text-gold">.</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-[#4A4F5E] max-w-[34rem]">{tx.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href={`/${locale}/boutique`} className={boutonSombre}>
                {tx.voirEnseignes(catalogue.length)}
              </a>
              <a
                href={`/${locale}/cagnotte`}
                className="inline-block bg-white text-ink text-[15px] font-semibold rounded px-6 py-[13px] border border-ink hover:bg-[#F6F5F2] transition-colors"
              >
                {tx.creerCagnotte}
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-[#4A4F5E] mr-1">{tx.pour}</span>
              {tx.occasions.map((o) => (
                <a
                  key={o}
                  href={`/${locale}/boutique`}
                  className="px-3.5 py-2 rounded-full bg-white border border-[#E0D8C6] text-ink hover:border-ink transition-colors"
                >
                  {o}
                </a>
              ))}
            </div>
          </div>

          <HeroCarte locale={locale} marques={marquesHero} tx={tx} />
        </div>
      </section>

      {/* Réassurance */}
      <section className="bg-white border-b border-[#E4E1D9]">
        <ul className="max-w-[1240px] mx-auto px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tx.reassurance.map((r) => (
            <li key={r.titre} className="flex items-center gap-3">
              <span className="shrink-0 w-11 h-11 rounded bg-[#F3E9C6] text-ink flex items-center justify-center"><Icone nom={r.icone} taille={22} /></span>
              <span>
                <span className="block text-sm font-semibold text-ink">{r.titre}</span>
                <span className="block text-[13px] text-[#4A4F5E]">{r.texte}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Fabriqué en France : en premier, c'est notre différence */}
      {fabriquees.length > 0 && (
        <SectionFrance locale={locale} marques={fabriquees} traduireCategorie={traduireCategorie} tx={tx} />
      )}

      {/* Par univers */}
      {categories.length > 0 && (
        <section>
          <div className="max-w-[1240px] mx-auto px-6 pt-12 pb-6">
            <CarrouselUnivers
              titre={tx.univers}
              titreClasse={titreSection}
              categories={categories}
              locale={locale}
              traduireCategorie={traduireCategorie}
              tx={tx}
            />
          </div>
        </section>
      )}

      {/* Les plus offertes */}
      {populaires.length > 0 && (
        <section>
          <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-6">
              <h2 className={titreSection}>{tx.populaires}</h2>
              <a href={`/${locale}/boutique`} className={lien}>{tx.toutesEnseignes}</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {populaires.map((carte) => (
                <VignetteEnseigne
                  key={carte.slug}
                  carte={carte}
                  href={`/${locale}/boutique/${carte.slug}`}
                  categorie={traduireCategorie(carte.categorie)}
                  prix={tx.des(carte.montant_min)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Cagnotte + envoi programmé */}
      <section>
        <div className="max-w-[1240px] mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-ink text-ivory rounded-lg p-8 md:p-9">
            <div className="text-[13px] font-semibold tracking-[0.04em] text-gold">{tx.cagnotteSurtitre}</div>
            <h3 className="mt-2.5 font-[family-name:var(--font-titre)] font-medium text-[28px] md:text-[30px] leading-[1.15]">
              {tx.cagnotteTitre}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#D3CFC5] max-w-[30rem]">{tx.cagnotteTexte}</p>
            <a href={`/${locale}/cagnotte`} className={`mt-6 ${boutonOr}`}>{tx.creerCagnotte}</a>
          </div>
          <div className="bg-white border border-[#E4E1D9] rounded-lg p-8 md:p-9">
            <div className="text-[13px] font-semibold tracking-[0.04em] text-[#8A6D10]">{tx.programmeSurtitre}</div>
            <h3 className="mt-2.5 font-[family-name:var(--font-titre)] font-medium text-[28px] md:text-[30px] leading-[1.15] text-ink">
              {tx.programmeTitre}
            </h3>
            <p className="mt-3 text-[15px] leading-relaxed text-[#4A4F5E] max-w-[30rem]">{tx.programmeTexte}</p>
            <a href={`/${locale}/boutique`} className={`mt-6 ${boutonSombre}`}>{tx.programmeBouton}</a>
          </div>
        </div>
      </section>

      {/* Fidélité */}
      <section>
        <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-20 items-start">
          <div>
            <h2 className={titreSection}>{tFid("titre")}</h2>
            <p className="mt-4 text-[#4A4F5E] leading-relaxed max-w-[30rem]">{tFid("texte")}</p>
            <div className="mt-6 flex flex-wrap items-center gap-6">
              <a href={`/${locale}/inscription`} className={boutonSombre}>{tFid("creerCompte")}</a>
              <a href={`/${locale}/fidelite`} className={lien}>{tFid("programme")}</a>
            </div>
          </div>
          <ol className="bg-white border border-[#E4E1D9] rounded-lg divide-y divide-[#EFECE5]">
            {PALIERS_ACCUEIL.map((p) => (
              <li key={p.cle} className="grid grid-cols-[4px_1fr] sm:grid-cols-[4px_150px_1fr] gap-x-5 gap-y-1 px-5 py-4">
                <span aria-hidden className="row-span-2 sm:row-span-1 rounded-sm" style={{ background: p.couleur }} />
                <span>
                  <span className="block font-[family-name:var(--font-titre)] font-medium text-lg leading-tight text-ink">{tFid(`${p.cle}Nom`)}</span>
                  <span className="block text-xs text-[#6B6F7C] mt-0.5">
                    {p.seuil === 0 ? t2("paliersDepart") : t2("paliersSeuil", { n: p.seuil })}
                  </span>
                </span>
                <span className="text-sm text-[#4A4F5E] leading-relaxed sm:self-center">{tFid(`${p.cle}Avantage`)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Entreprises : bande or */}
      <section className="bg-gold">
        <div className="max-w-[1240px] mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className={titreSection}>{tx.proTitre}</h2>
            <p className="mt-2 text-[15px] text-ink/80">{tx.proTexte}</p>
          </div>
          <a href={`/${locale}/professionnels`} className={`shrink-0 self-start md:self-auto ${boutonSombre}`}>
            {tx.proBouton}
          </a>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section>
        <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16">
          <div>
            <h2 className={titreSection}>{tFaq("titre")}</h2>
            <a href={`/${locale}/aide`} className={`inline-block mt-4 ${lien}`}>{tFaq("toutes")}</a>
          </div>
          <div className="bg-white border border-[#E4E1D9] rounded-lg divide-y divide-[#EFECE5]">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="group px-5 py-4">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {tFaq(`q${n}`)}
                  <span aria-hidden className="text-ink text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-[#4A4F5E] leading-relaxed max-w-[44rem]">{tFaq(`r${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter : garde son fond sombre, juste avant le footer */}
      <div className="bg-ink">
        <Newsletter />
      </div>
    </div>
  );
}
