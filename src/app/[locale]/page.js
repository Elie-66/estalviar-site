"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import CarteVivante from "./components/CarteVivante";
import CarteVitrine from "./components/CarteVitrine";
import { couleurCategorie, fondCarte } from "../../lib/couleursCartes";
import BandeauEvenement from "./components/BandeauEvenement";
import { Reassurance, IdeesBudget, RappelAnniversaire, Newsletter } from "./components/SectionsAccueil";

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

export default function Home() {
  const t = useTranslations("accueilVitrine");
  const tCcm = useTranslations("commentCaMarcheAccueil");
  const tCagnotte = useTranslations("cagnotteAccueil");
  const tPop = useTranslations("populairesAccueil");
  const tCategories = useTranslations("categories");
  const tFid = useTranslations("fideliteAccueil");
  const tFaq = useTranslations("faqAccueil");
  const locale = useLocale();
  const [populaires, setPopulaires] = useState([]);
  const [categories, setCategories] = useState([]); // [{ nom, nombre }]
  const [marquesHero, setMarquesHero] = useState(apercus);
  const [fabriquees, setFabriquees] = useState([]); // enseignes fabriquées en France
  const [catalogue, setCatalogue] = useState([]); // toutes les enseignes actives (idées par budget)
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

      const compte = {};
      (toutesCartes || []).forEach((c) => { if (c.categorie) compte[c.categorie] = (compte[c.categorie] || 0) + 1; });
      setCategories(
        Object.entries(compte)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 8)
          .map(([nom, nombre]) => ({ nom, nombre }))
      );
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
            <h1 className="text-[2.4rem] leading-[1.06] sm:text-[3.4rem] lg:text-[3rem] xl:text-[3.2rem] font-semibold text-ivory tracking-tight">
              {t("titre1")}<br />
              {finitParPoint ? titre2.slice(0, -1) : titre2}
              {finitParPoint && <span className="text-gold">.</span>}
            </h1>
            <p className="mt-7 text-ivory/70 text-lg leading-relaxed max-w-[34rem] mx-auto lg:mx-0">
              {t("description")}
            </p>
            <ul className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-6 justify-center lg:justify-start text-sm text-ivory/75">
              <li className="flex items-center gap-2 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gold" />{t("atout1")}</li>
              <li className="flex items-center gap-2 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gold" />{t("atout2")}</li>
              <li className="flex items-center gap-2 justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gold" />{t("atout3")}</li>
            </ul>
            <a href={`/${locale}/boutique`}
              className="hidden lg:inline-block mt-10 text-sm text-ivory/80 underline decoration-gold/60 underline-offset-4 hover:text-gold">
              {t("bouton")}
            </a>
          </div>

          <CarteVivante marques={marquesHero} />
        </div>
      </section>

      {/* Paiement sécurisé, envoi rapide, points, équipe en France */}
      <Reassurance />

      {/* Fabriqué en France : l'argument qui nous distingue */}
      {fabriquees.length > 0 && (
        <section>
          <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-10 items-center">
            <div>
              <div aria-hidden className="flex w-16 h-1.5 rounded-full overflow-hidden mb-6">
                <span className="flex-1 bg-[#2f5bd3]" /><span className="flex-1 bg-ivory" /><span className="flex-1 bg-[#e1293b]" />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tFid("francaisTitre")}</h2>
              <p className="mt-4 text-ivory/65 leading-relaxed">{tFid("francaisTexte")}</p>
              <a href={`/${locale}/boutique?onglet=francaises`}
                className="inline-block mt-6 text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
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

      {/* Les plus demandées, présentées comme de vraies cartes */}
      {populaires.length > 0 && (
        <section className="border-t border-ivory/10 bg-ivory/[0.02]">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tPop("titre")}</h2>
              <a href={`/${locale}/boutique`} className="text-sm text-gold hover:underline whitespace-nowrap">{t("voirTout")}</a>
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

      {/* Un budget en tête ? 20 / 50 / 100 € */}
      <IdeesBudget cartes={catalogue} />

      {/* Envie de… : les catégories, chacune dans sa couleur */}
      {categories.length > 0 && (
        <section className="max-w-[1240px] w-full mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-6">{tPop("categoriesTitre")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((c) => (
              <a key={c.nom} href={`/${locale}/boutique?categorie=${encodeURIComponent(c.nom)}`}
                className="group relative overflow-hidden rounded-2xl p-5 min-h-[112px] flex flex-col justify-between transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-gold"
                style={{ background: fondCarte(couleurCategorie(c.nom)) }}>
                <span className="text-white text-lg font-semibold leading-tight font-[family-name:var(--font-fraunces)]">
                  {traduireCategorie(c.nom)}
                </span>
                <span className="text-white/75 text-xs">{t("nbEnseignes", { n: c.nombre })}</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Fidélité : chaque achat rapporte */}
      <section className="border-t border-ivory/10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(201,162,39,0.14),transparent_55%)]">
        <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-ivory">{tFid("titre")}</h2>
            <p className="mt-4 text-ivory/65 leading-relaxed max-w-[30rem]">{tFid("texte")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5">
              <a href={`/${locale}/inscription`}
                className="bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors">
                {tFid("creerCompte")}
              </a>
              <a href={`/${locale}/fidelite`} className="text-sm text-ivory/75 underline underline-offset-4 decoration-ivory/30 hover:text-gold">
                {tFid("programme")}
              </a>
            </div>
          </div>

          <ol className="relative grid grid-cols-2 sm:grid-cols-4 gap-6">
            <span aria-hidden className="hidden sm:block absolute left-[12%] right-[12%] top-7 h-px bg-gradient-to-r from-[#B08D57] via-[#C9A227] to-[#E5E4E2] opacity-60" />
            {PALIERS_ACCUEIL.map((p) => (
              <li key={p.cle} className="relative text-center">
                <span className="mx-auto w-14 h-14 rounded-full flex items-center justify-center text-ink text-lg font-semibold font-[family-name:var(--font-fraunces)] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.8)]"
                  style={{ background: `radial-gradient(circle at 30% 30%, #fff8, transparent 45%), ${p.couleur}` }}>
                  {tFid(`${p.cle}Nom`).charAt(0)}
                </span>
                <p className="mt-3 text-ivory font-medium">{tFid(`${p.cle}Nom`)}</p>
                <p className="text-xs text-gold/80 mt-0.5">{p.seuil === 0 ? tFid("desInscription") : tFid("desAchats", { montant: p.seuil })}</p>
                <p className="text-xs text-ivory/55 mt-2 leading-relaxed">{tFid(`${p.cle}Avantage`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Comment ça marche : 3 étapes */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-10">{tCcm("titre")}</h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
            {[1, 2, 3].map((n) => (
              <li key={n} className="flex gap-4">
                <span className="text-gold text-4xl font-semibold leading-none font-[family-name:var(--font-fraunces)]">{n}</span>
                <div>
                  <h3 className="text-ivory text-lg font-medium">{tCcm(`etape${n}Titre`)}</h3>
                  <p className="mt-1.5 text-sm text-ivory/60 leading-relaxed max-w-[300px]">{tCcm(`etape${n}Texte`)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
         <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-semibold text-ivory leading-tight">
              {tCagnotte("titre")}
            </h2>
            <p className="mt-6 text-ivory/60 leading-relaxed max-w-md mx-auto md:mx-0">
              {tCagnotte("description")}
            </p>
            <a
              href={`/${locale}/cagnotte/creer`}
              className="inline-block mt-8 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
            >
              {tCagnotte("bouton")}
            </a>
          </div>

          <div
            className="relative overflow-hidden rounded-2xl p-8 aspect-[1.6/1] flex flex-col justify-between border border-gold/30"
            style={{
              background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)",
              boxShadow: "0 25px 60px -15px #00000066",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }}
            />
            <div className="relative flex items-center justify-between">
              <span className="text-white text-sm font-medium">Pour Camille</span>
              <span className="text-gold/70 text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-space-mono)]">
                Estalviar
              </span>
            </div>
            <div className="relative">
              <div className="flex items-end justify-between mb-3">
                <p className="text-white text-4xl font-semibold font-[family-name:var(--font-fraunces)]">
                  140<span className="text-xl text-gold ml-1">€</span>
                  <span className="text-sm text-white/40 font-sans ml-2">/ 200 €</span>
                </p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gold rounded-full" style={{ width: "70%" }} />
              </div>
              <p className="text-white/40 text-xs mt-2">6 contributeurs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Rappels d'anniversaire */}
      <RappelAnniversaire />

      {/* Entreprises */}
      <section className="max-w-[1240px] w-full mx-auto px-6 pb-20">
        <div className="rounded-2xl border border-gold/25 bg-gold/[0.06] px-6 py-7 sm:px-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold text-ivory">{tFaq("proTitre")}</h2>
            <p className="mt-1.5 text-sm text-ivory/65 max-w-[36rem]">{tFaq("proTexte")}</p>
          </div>
          <a href={`/${locale}/professionnels`}
            className="shrink-0 self-start md:self-auto border border-gold text-gold text-sm font-semibold rounded-lg px-5 py-3 hover:bg-gold hover:text-ink transition-colors">
            {tFaq("proBouton")}
          </a>
        </div>
      </section>

      {/* Questions fréquentes */}
      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory mb-8">{tFaq("titre")}</h2>
          <div className="max-w-[860px] divide-y divide-ivory/10 border-y border-ivory/10">
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
          <a href={`/${locale}/aide`} className="inline-block mt-6 text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
            {tFaq("toutes")}
          </a>
        </div>
      </section>

      {/* Newsletter : 25 points offerts */}
      <Newsletter />
    </div>
  );
}