"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import CarteVivante from "./components/CarteVivante";
import CarteVitrine from "./components/CarteVitrine";
import BandeauEvenement from "./components/BandeauEvenement";
import { TrouverCarte, Services, Newsletter } from "./components/SectionsAccueil";

// Enseignes proposées sur la carte de l'accueil si le catalogue n'est pas encore chargé
const apercus = [
  { slug: "amazon", nom: "Amazon", image: "/logos/amazon.svg", categorie: "Généraliste", montant_min: 15, montant_max: 200 },
  { slug: "fnac", nom: "Fnac", image: "/logos/fnac.svg", categorie: "High-tech & multimédia", montant_min: 15, montant_max: 200 },
  { slug: "steam", nom: "Steam", image: "/logos/steam.svg", categorie: "Jeux vidéo", montant_min: 15, montant_max: 200 },
  { slug: "decathlon", nom: "Decathlon", image: "/logos/decathlon.svg", categorie: "Sport", montant_min: 15, montant_max: 200 },
  { slug: "zara", nom: "Zara", image: "/logos/zara.svg", categorie: "Mode & chaussures", montant_min: 15, montant_max: 200 },
];

// Paliers de fidélité (mêmes seuils que la page Fidélité ; 1 € dépensé = 1 point)
const PALIERS_ACCUEIL = [
  { cle: "bronze", seuil: 0, couleur: "#B08D57" },
  { cle: "argent", seuil: 100, couleur: "#C0C0C0" },
  { cle: "or", seuil: 300, couleur: "#C9A227" },
  { cle: "platine", seuil: 700, couleur: "#E5E4E2" },
];

const lienDore = "text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold";

export default function Home() {
  const t = useTranslations("accueilVitrine");
  const t2 = useTranslations("accueil2");
  const tPop = useTranslations("populairesAccueil");
  const tCategories = useTranslations("categories");
  const tFid = useTranslations("fideliteAccueil");
  const tFaq = useTranslations("faqAccueil");
  const locale = useLocale();
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
      setPopulaires(tri.slice(0, 8));

      // La carte de l'accueil propose les enseignes les plus demandées qui ont un logo
      const avecLogo = tri.filter((c) => c.image).slice(0, 5);
      if (avecLogo.length >= 3) setMarquesHero(avecLogo);

      setFabriquees(tri.filter((c) => c.made_in_france).slice(0, 4));
      setCatalogue(toutesCartes || []);
    };
    charger();
  }, []);

  // Catégorie sans traduction (ex. nouvelle catégorie du catalogue) : on affiche son nom tel quel
  const traduireCategorie = (cat) => (cat && tCategories.has(cat) ? tCategories(cat) : cat);

  // Le titre se termine par le point doré du logo
  const titre2 = t("titre2");
  const finitParPoint = titre2.endsWith(".");

  return (
    <div className="flex flex-col flex-1 bg-ink overflow-hidden">
      {/* Bandeau de l'événement du moment (Fête des mères, Noël…), juste sous le menu */}
      <BandeauEvenement onAffiche={setAvecEvenement} />

      {/* Accueil : la carte se personnalise en direct */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] w-[640px] h-[640px] rounded-full opacity-[0.18] blur-3xl"
          style={{ background: "radial-gradient(circle, #E5604D 0%, #5B3A5C 45%, transparent 70%)" }} />
        <div className={`relative max-w-[1240px] mx-auto px-6 ${avecEvenement ? "pt-14" : "pt-32 md:pt-36"} pb-20 grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-14 lg:gap-20 items-center`}>
          <div className="text-center lg:text-left">
            <h1 className="text-[2.6rem] leading-[1.04] sm:text-[3.6rem] lg:text-[3.4rem] xl:text-[3.8rem] font-semibold text-ivory tracking-tight">
              {t("titre1")}<br />
              {finitParPoint ? titre2.slice(0, -1) : titre2}
              {finitParPoint && <span className="text-gold">.</span>}
            </h1>
            <p className="mt-7 text-ivory/70 text-lg leading-relaxed max-w-[33rem] mx-auto lg:mx-0">
              {t("description")}
            </p>
            <a href={`/${locale}/boutique`}
              className="hidden lg:inline-block mt-9 bg-gold text-ink font-semibold rounded-lg px-6 py-3.5 hover:bg-gold/90 transition-colors">
              {catalogue.length ? t2("murTout", { n: catalogue.length }) : t("bouton")}
            </a>
          </div>

          <CarteVivante marques={marquesHero} />
        </div>
      </section>

      {/* Les plus demandées : la boutique commence ici */}
      {populaires.length > 0 && (
        <section className="border-t border-ivory/10">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tPop("titre")}</h2>
              <a href={`/${locale}/boutique`} className={`${lienDore} whitespace-nowrap`}>
                {catalogue.length ? t2("murTout", { n: catalogue.length }) : t("voirTout")}
              </a>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {populaires.map((carte) => (
                <CarteVitrine key={carte.slug} carte={carte} href={`/${locale}/boutique/${carte.slug}`}
                  prixLabel={t("des", { montant: carte.montant_min })} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Fabriqué en France : l'argument qui nous distingue */}
      {fabriquees.length > 0 && (
        <section className="border-t border-ivory/10">
          <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-center">
            <div>
              <div aria-hidden className="flex w-12 h-1 overflow-hidden mb-5">
                <span className="flex-1 bg-[#2f5bd3]" /><span className="flex-1 bg-ivory" /><span className="flex-1 bg-[#e1293b]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tFid("francaisTitre")}</h2>
              <p className="mt-4 text-ivory/65 leading-relaxed">{tFid("francaisTexte")}</p>
              <a href={`/${locale}/boutique?onglet=francaises`} className={`inline-block mt-6 ${lienDore}`}>
                {tFid("francaisLien")}
              </a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {fabriquees.map((carte) => (
                <CarteVitrine key={carte.slug} carte={carte} href={`/${locale}/boutique/${carte.slug}`}
                  prixLabel={t("des", { montant: carte.montant_min })} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Par univers et par budget */}
      <TrouverCarte cartes={catalogue} traduireCategorie={traduireCategorie} />

      {/* Cagnotte et rappels d'anniversaire */}
      <Services />

      {/* Fidélité : une échelle simple, sans fioritures */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-10 lg:gap-20 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tFid("titre")}</h2>
            <p className="mt-4 text-ivory/65 leading-relaxed max-w-[30rem]">{tFid("texte")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-6">
              <a href={`/${locale}/inscription`}
                className="bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
                {tFid("creerCompte")}
              </a>
              <a href={`/${locale}/fidelite`} className={lienDore}>{tFid("programme")}</a>
            </div>
          </div>

          <ol className="border-t border-ivory/10">
            {PALIERS_ACCUEIL.map((p) => (
              <li key={p.cle} className="grid grid-cols-[4px_1fr] sm:grid-cols-[4px_150px_1fr] gap-x-5 gap-y-1 py-5 border-b border-ivory/10">
                <span aria-hidden className="row-span-2 sm:row-span-1 rounded-full" style={{ background: p.couleur }} />
                <span>
                  <span className="block text-ivory font-semibold font-[family-name:var(--font-fraunces)] text-lg leading-tight">{tFid(`${p.cle}Nom`)}</span>
                  <span className="block text-xs text-ivory/45 mt-0.5">
                    {p.seuil === 0 ? t2("paliersDepart") : t2("paliersSeuil", { n: p.seuil })}
                  </span>
                </span>
                <span className="text-sm text-ivory/70 leading-relaxed sm:self-center">{tFid(`${p.cle}Avantage`)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Entreprises : une bande claire, pour changer de rythme */}
      <section className="bg-ivory text-ink">
        <div className="max-w-[1240px] mx-auto px-6 py-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold">{tFaq("proTitre")}</h2>
            <p className="mt-2 text-ink/70 max-w-[38rem] leading-relaxed">{tFaq("proTexte")}</p>
          </div>
          <a href={`/${locale}/professionnels`}
            className="shrink-0 self-start md:self-auto bg-ink text-ivory text-sm font-semibold rounded-lg px-6 py-3.5 hover:bg-ink/85 transition-colors">
            {tFaq("proBouton")}
          </a>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section>
        <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-8 lg:gap-16">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tFaq("titre")}</h2>
            <a href={`/${locale}/aide`} className={`inline-block mt-4 ${lienDore}`}>{tFaq("toutes")}</a>
          </div>
          <div className="divide-y divide-ivory/10 border-y border-ivory/10">
            {[1, 2, 3, 4].map((n) => (
              <details key={n} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-ivory font-medium [&::-webkit-details-marker]:hidden">
                  {tFaq(`q${n}`)}
                  <span aria-hidden className="text-gold text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-ivory/65 leading-relaxed max-w-[44rem]">{tFaq(`r${n}`)}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter : 25 points offerts */}
      <Newsletter />
    </div>
  );
}
