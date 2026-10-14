"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { paques } from "../../../lib/evenements";

// Logo « ESTALVIAR. » qui change selon la période de l'année (façon Google Doodle) :
// ruban rose en octobre, moustache en novembre, bonnet de Noël en décembre…
// Pour prévisualiser n'importe quelle décoration : ajouter ?logo=movember (ou noel, halloween…) à l'adresse.

const ROSE = "#ff6fa5";

// Périodes (mois-jour, bornes incluses). La première qui correspond l'emporte.
const PERIODES = [
  { cle: "nouvel-an", du: "12-31", au: "01-02" },
  { cle: "halloween", du: "10-29", au: "10-31" },
  { cle: "saint-valentin", du: "02-07", au: "02-14" },
  { cle: "paques", paques: true },
  { cle: "fete-de-la-musique", du: "06-21", au: "06-21" },
  { cle: "fete-nationale", du: "07-10", au: "07-14" },
  { cle: "octobre-rose", du: "10-01", au: "10-31" },
  { cle: "movember", du: "11-01", au: "11-30" },
  { cle: "noel", du: "12-01", au: "12-26" },
];

function decorationDuJour() {
  const params = new URLSearchParams(window.location.search);
  const forcee = params.get("logo");
  if (forcee && PERIODES.some((p) => p.cle === forcee)) return forcee;

  const [annee, mois, jour] = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" })
    .format(new Date()).split("-");
  const md = `${mois}-${jour}`;
  for (const p of PERIODES) {
    if (p.paques) {
      const ref = Date.UTC(Number(annee), Number(mois) - 1, Number(jour), 12);
      const ecart = Math.round((ref - paques(Number(annee)).getTime()) / 86400000);
      if (ecart >= -3 && ecart <= 1) return p.cle;
    } else if (p.du <= p.au ? md >= p.du && md <= p.au : md >= p.du || md <= p.au) {
      return p.cle;
    }
  }
  return null;
}

// Calculé seulement dans le navigateur (le serveur affiche le logo normal) : pas de décalage à l'affichage
const sAbonner = () => () => {};
const useDecoration = () => useSyncExternalStore(sAbonner, decorationDuJour, () => null);

// Petits dessins (SVG)
const Ruban = () => (
  <svg viewBox="0 0 24 24" className="inline-block w-[0.7em] h-[0.9em] -mb-[0.05em] ml-[0.05em]" aria-hidden>
    <path fill={ROSE} fillRule="evenodd" d="M12 2c-2.2 0-3.6 1.8-3.6 3.9 0 1.6.8 3.2 1.9 4.9L5.8 18.6l2.5 1.3L12 13.6l3.7 6.3 2.5-1.3-4.5-7.8c1.1-1.7 1.9-3.3 1.9-4.9C15.6 3.8 14.2 2 12 2zm0 2.1c.9 0 1.5.7 1.5 1.8 0 .9-.5 2-1.5 3.4-1-1.4-1.5-2.5-1.5-3.4 0-1.1.6-1.8 1.5-1.8z" />
  </svg>
);
const Coeur = () => (
  <svg viewBox="0 0 24 24" className="inline-block w-[0.55em] h-[0.55em] ml-[0.08em]" aria-hidden>
    <path fill="#ff4d6d" d="M12 20.5s-7.5-4.6-9.6-9.3C.9 7.6 3.3 4 6.9 4c2.1 0 3.6 1.2 5.1 3 1.5-1.8 3-3 5.1-3 3.6 0 6 3.6 4.5 7.2-2.1 4.7-9.6 9.3-9.6 9.3z" />
  </svg>
);
const Oeuf = () => (
  <svg viewBox="0 0 24 24" className="inline-block w-[0.5em] h-[0.6em] ml-[0.08em]" aria-hidden>
    <ellipse cx="12" cy="13" rx="7" ry="9" fill="#f7c8e0" />
    <path d="M5.6 12.5l2.4-2 2.4 2 2.4-2 2.4 2 2.4-2 .9.8" stroke="#8cc8f0" strokeWidth="1.6" fill="none" strokeLinejoin="round" />
    <path d="M5.4 16.5h13.2" stroke="#f2d14e" strokeWidth="1.6" />
  </svg>
);

function Decoration({ cle }) {
  switch (cle) {
    case "movember":
      return (
        <svg viewBox="0 7 24 9" className="absolute left-1/2 -translate-x-1/2 -bottom-[11px] w-[34px] h-[13px]" aria-hidden>
          <path fill="#e9dcc3" d="M12 10.5c-1-1.6-3.2-2.4-5-1.4-1.3.7-1.6 2.3-3 2.6-.9.2-1.7-.3-2-1 .1 2.4 2 4.1 4.4 3.9 2.2-.2 3.7-1.6 5.6-2.6 1.9 1 3.4 2.4 5.6 2.6 2.4.2 4.3-1.5 4.4-3.9-.3.7-1.1 1.2-2 1-1.4-.3-1.7-1.9-3-2.6-1.8-1-4-.2-5 1.4z" />
        </svg>
      );
    case "noel":
      return (
        <svg viewBox="0 0 24 24" className="absolute -left-[9px] -top-[13px] w-[24px] h-[24px] -rotate-[18deg]" aria-hidden>
          <path fill="#d62839" d="M4.5 17.5C5 11 8 6 13 5c2.8-.6 5 .8 6.2 3l-3 1.3c-.9-.9-2-1.1-3-.5-2.8 1.8-3.6 5.4-3.3 8.7z" />
          <rect x="2.5" y="16.5" width="14" height="4" rx="2" fill="#ffffff" />
          <circle cx="18.6" cy="9.2" r="2.3" fill="#ffffff" />
        </svg>
      );
    case "halloween":
      return (
        <svg viewBox="0 0 24 24" className="absolute -right-[22px] -top-[10px] w-[20px] h-[20px] rotate-[12deg] animate-[flotter_4s_ease-in-out_infinite]" aria-hidden>
          <path fill="#b07cff" d="M12 9.5c-.6-1-1.3-1.5-1.3-1.5L9.5 9.2C7.8 7 4.7 6.3 2 7.2c1.8 1 2.6 2.8 2.4 4.6 1.5-.6 3.4-.3 4.5.9.6-.8 1.8-1.2 3.1-1.2s2.5.4 3.1 1.2c1.1-1.2 3-1.5 4.5-.9-.2-1.8.6-3.6 2.4-4.6-2.7-.9-5.8-.2-7.5 2l-1.2-1.2s-.7.5-1.3 1.5z" />
        </svg>
      );
    case "nouvel-an":
      return (
        <>
          {[["-left-[10px] -top-[8px]", 14, "#f0d27a"], ["-right-[16px] -top-[10px]", 16, "#ffffff"], ["right-[30px] -top-[12px]", 10, "#f0d27a"]].map(([pos, t, c], i) => (
            <svg key={i} viewBox="0 0 24 24" className={`absolute ${pos} animate-[flotter_3s_ease-in-out_infinite]`} style={{ width: t, height: t, animationDelay: `${i * 0.6}s` }} aria-hidden>
              <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19" stroke={c} strokeWidth="2" strokeLinecap="round" />
            </svg>
          ))}
        </>
      );
    case "fete-nationale":
      return (
        <span aria-hidden className="absolute left-0 right-[0.4em] -bottom-[5px] h-[3px] rounded-full"
          style={{ background: "linear-gradient(90deg, #2f5bd3 0 33%, #ffffff 33% 66%, #e1293b 66% 100%)" }} />
      );
    case "fete-de-la-musique":
      return (
        <svg viewBox="0 0 24 24" className="absolute -right-[20px] -top-[8px] w-[17px] h-[17px] animate-[flotter_3s_ease-in-out_infinite]" aria-hidden>
          <path d="M9 18V5l11-2v13" stroke="#C9A227" strokeWidth="2" fill="none" />
          <circle cx="6.5" cy="18" r="2.6" fill="#C9A227" />
          <circle cx="17.5" cy="16" r="2.6" fill="#C9A227" />
        </svg>
      );
    default:
      return null;
  }
}

/**
 * @param {string} href       lien du logo
 * @param {string} className  classes du texte (taille, police…)
 */
export default function LogoEstalviar({ href, className = "" }) {
  const t = useTranslations("logoSaisonnier");
  const cle = useDecoration();

  // Certaines décorations remplacent le point doré
  const point =
    cle === "octobre-rose" ? <Ruban />
    : cle === "saint-valentin" ? <Coeur />
    : cle === "paques" ? <Oeuf />
    : <span className={cle === "halloween" ? "text-[#ff9a3c]" : "text-gold"}>.</span>;

  return (
    <a href={href} className={`relative inline-block ${className}`} title={cle ? t(cle) : undefined} aria-label={t("accueil")}>
      Estalviar{point}
      {cle && <Decoration cle={cle} />}
    </a>
  );
}
