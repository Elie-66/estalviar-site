"use client";

import { couleurCarte } from "../../../lib/couleursCartes";

/**
 * Une enseigne dans la vitrine : une carte cadeau blanche (format carte bancaire),
 * le logo en grand au centre, une fine bande de couleur en bas (couleur de la catégorie).
 * Le nom et le prix sont sous la carte. Utilisée dans la boutique et sur l'accueil.
 */
export default function CarteVitrine({ carte, href, prixLabel, badge }) {
  const couleur = couleurCarte(carte);

  return (
    <a href={href} className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold">
      <div className="relative aspect-[1.586/1] rounded-xl bg-white overflow-hidden flex items-center justify-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:-translate-y-1">
        {carte.image ? (
          <img src={carte.image} alt="" className="max-h-[46%] max-w-[64%] object-contain transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span
            className="px-4 text-center text-lg sm:text-xl font-semibold leading-tight font-[family-name:var(--font-fraunces)]"
            style={{ color: couleur }}
          >
            {carte.nom}
          </span>
        )}

        {badge && <div className="absolute top-2.5 left-2.5">{badge}</div>}

        {/* Bande de couleur, comme la piste d'une carte */}
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-2" style={{ background: couleur }} />
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-0.5 sm:gap-2 px-0.5">
        <p className="text-ivory text-sm sm:text-[15px] font-medium truncate group-hover:text-gold transition-colors">{carte.nom}</p>
        {prixLabel && <p className="text-ivory/50 text-xs whitespace-nowrap">{prixLabel}</p>}
      </div>
    </a>
  );
}
