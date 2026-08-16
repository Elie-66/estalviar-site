"use client";
import DefilementLogos from "./components/DefilementLogos";
import { useTranslations } from "next-intl";

const apercus = [
  {
    nom: "Steam",
    slug: "steam",
    montant: 20,
    beneficiaire: "Lucas",
    messageKey: "messageSteam",
    image: "/logos/steam.svg",
    background: "linear-gradient(150deg, #1b3a5c 0%, #0d1022 100%)",
    rotate: -18,
    translate: "-110px",
  },
  {
    nom: "Fnac",
    slug: "fnac",
    montant: 30,
    beneficiaire: "Camille",
    messageKey: "messageFnac",
    image: "/logos/fnac.svg",
    background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)",
    rotate: 12,
    translate: "60px",
  },
  {
    nom: "Amazon",
    slug: "amazon",
    montant: 75,
    beneficiaire: "Sarah",
    messageKey: "messageAmazon",
    image: "/logos/amazon.svg",
    background: "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)",
    rotate: -4,
    translate: "-25px",
  },
];

export default function Home() {
  const t = useTranslations("accueilVitrine");
const tCcm = useTranslations("commentCaMarcheAccueil");
const tCagnotte = useTranslations("cagnotteAccueil");

  return (
    <div className="flex flex-col flex-1 bg-ink overflow-hidden">
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 pt-40 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
            <span className="w-6 h-px bg-gold" /> {t("accroche")}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-ivory leading-tight">
            {t("titre1")}<br />
            <span className="italic text-gold">{t("titre2")}</span>
          </h1>
          <p className="mt-6 text-ivory/60 leading-relaxed max-w-md">
            {t("description")}
          </p>
          <a
            href="/fr/boutique"
            className="inline-block mt-8 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
          >
            {t("bouton")}
          </a>
        </div>

        <div className="relative h-[360px] flex items-center justify-center">
          {apercus.map((c, i) => (
            <a
              key={c.nom}
              href={`/fr/boutique/${c.slug}`}
              className="absolute w-[260px] aspect-[1.6/1] rounded-2xl p-5 flex flex-col justify-between border border-gold/20 transition-transform duration-300 hover:!rotate-0 hover:!-translate-y-3 hover:z-50"
              style={{
                background: c.background,
                transform: `translateX(${c.translate}) rotate(${c.rotate}deg)`,
                zIndex: i,
                boxShadow: "0 25px 50px -15px #00000080",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-[0.07]"
                style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }}
              />
              <div className="relative flex items-center justify-between">
                <img src={c.image} alt={c.nom} className="h-6 object-contain drop-shadow-md" />
                <span className="text-gold/70 text-[9px] uppercase tracking-[0.15em] font-[family-name:var(--font-space-mono)]">
                  Estalviar
                </span>
              </div>
              <div className="relative">
                <p className="text-white text-xs font-medium">{t("pour")} {c.beneficiaire}</p>
                <p className="text-white/50 text-xs italic mb-2">"{t(c.messageKey)}"</p>
                <div className="h-px bg-gradient-to-r from-gold/40 via-gold/10 to-transparent mb-2" />
                <p className="text-white text-2xl font-semibold font-[family-name:var(--font-fraunces)]">
                  {c.montant}<span className="text-sm text-gold ml-0.5">€</span>
                </p>
              </div>
            </a>
          ))}
        </div>

      </main>

      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-24">
          <h2 className="text-2xl md:text-3xl font-semibold text-ivory text-center mb-16">
            {tCcm("titre")}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto text-gold font-semibold font-[family-name:var(--font-fraunces)]">
                1
              </div>
              <h3 className="mt-5 text-ivory font-medium">{tCcm("etape1Titre")}</h3>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed max-w-[240px] mx-auto">
                {tCcm("etape1Texte")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto text-gold font-semibold font-[family-name:var(--font-fraunces)]">
                2
              </div>
              <h3 className="mt-5 text-ivory font-medium">{tCcm("etape2Titre")}</h3>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed max-w-[240px] mx-auto">
                {tCcm("etape2Texte")}
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center mx-auto text-gold font-semibold font-[family-name:var(--font-fraunces)]">
                3
              </div>
              <h3 className="mt-5 text-ivory font-medium">{tCcm("etape3Titre")}</h3>
              <p className="mt-2 text-sm text-ivory/60 leading-relaxed max-w-[240px] mx-auto">
                {tCcm("etape3Texte")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
              <span className="w-6 h-px bg-gold" /> {tCagnotte("accroche")}
            </p>
            <h2 className="text-3xl md:text-4xl font-semibold text-ivory leading-tight">
              {tCagnotte("titre")}
            </h2>
            <p className="mt-6 text-ivory/60 leading-relaxed max-w-md">
              {tCagnotte("description")}
            </p>
            <a
              href="/fr/cagnotte/creer"
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

      <DefilementLogos />
    </div>
  );
}