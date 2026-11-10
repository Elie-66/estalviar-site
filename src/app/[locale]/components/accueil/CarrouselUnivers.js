"use client";

import { useEffect, useRef, useState } from "react";
import TuileUnivers from "./TuileUnivers";

// Univers sur une seule ligne : 3 visibles sur ordinateur, les autres en faisant défiler vers la droite
export default function CarrouselUnivers({ titre, titreClasse, categories, locale, traduireCategorie, tx }) {
  const piste = useRef(null);
  const [debut, setDebut] = useState(true);
  const [fin, setFin] = useState(false);

  const image = useRef(0);

  const majFleches = () => {
    const el = piste.current;
    if (!el) return;
    setDebut(el.scrollLeft <= 4);
    setFin(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  };

  // Pendant le défilement, on ne recalcule les flèches qu'une fois par image affichée
  const surDefilement = () => {
    if (image.current) return;
    image.current = requestAnimationFrame(() => {
      image.current = 0;
      majFleches();
    });
  };

  useEffect(() => {
    majFleches();
    window.addEventListener("resize", majFleches);
    return () => window.removeEventListener("resize", majFleches);
  }, [categories]);

  // Avance d'une « page » entière de tuiles, calée pile sur le début d'une tuile
  const defiler = (sens) => {
    const el = piste.current;
    if (!el || !el.children.length) return;
    const tuile = el.children[0];
    const pas = tuile.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || "16");
    const parPage = Math.max(1, Math.round((el.clientWidth - 48) / pas));
    const actuelle = Math.round(el.scrollLeft / pas);
    const cible = Math.max(0, actuelle + sens * parPage) * pas;
    el.scrollTo({ left: Math.min(cible, el.scrollWidth - el.clientWidth), behavior: "smooth" });
  };

  const fleche =
    "w-11 h-11 rounded-full border border-[#D9D5CB] bg-white text-[#12172B] flex items-center justify-center hover:border-[#12172B] transition-colors disabled:opacity-35 disabled:hover:border-[#D9D5CB] disabled:cursor-default";

  return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-6">
        <h2 className={titreClasse}>{titre}</h2>
        {!(debut && fin) && (
          <div className="hidden sm:flex gap-2">
            <button type="button" onClick={() => defiler(-1)} disabled={debut} aria-label={tx.precedent} className={fleche}>
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M11 6l-6 6 6 6" />
              </svg>
            </button>
            <button type="button" onClick={() => defiler(1)} disabled={fin} aria-label={tx.suivant} className={fleche}>
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={piste}
        onScroll={surDefilement}
        className="flex gap-4 overflow-x-auto overscroll-x-contain snap-x snap-mandatory lg:snap-none scroll-px-6 pb-2 -mx-6 px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
      >
        {categories.map((cat) => (
          <div
            key={cat.nom}
            className="snap-start shrink-0 w-[78%] sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)]"
          >
            <TuileUnivers
              href={`/${locale}/boutique?categorie=${encodeURIComponent(cat.nom)}`}
              nom={cat.nom}
              nomAffiche={traduireCategorie(cat.nom)}
              sousTitre={tx.nbEnseignes(cat.n)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
