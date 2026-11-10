"use client";

import { useState } from "react";

// Nom de fichier de la photo d'un univers : « Culture & High-tech » → culture-high-tech
export function slugUnivers(nom) {
  return (nom || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Tuile d'univers avec photo (public/univers/<slug>.jpg).
// Tant que la photo n'est pas ajoutée, la tuile affiche un fond uni.
export default function TuileUnivers({ href, nom, nomAffiche, sousTitre }) {
  const [photoOk, setPhotoOk] = useState(true);
  const photo = `/univers/${slugUnivers(nom)}.jpg`;

  return (
    <a
      href={href}
      className="group relative block aspect-[4/3] rounded-lg overflow-hidden bg-[#D9CFBA]"
    >
      {photoOk && (
        <img
          src={photo}
          alt=""
          decoding="async"
          draggable={false}
          onError={() => setPhotoOk(false)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04] [backface-visibility:hidden]"
        />
      )}
      {/* Voile en bas de la photo pour que le texte reste lisible */}
      <span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3 bg-[linear-gradient(to_top,rgba(10,12,20,0.78),rgba(10,12,20,0))]"
      />
      <span className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3">
        <span>
          <span className="block text-white text-lg sm:text-xl font-semibold leading-tight font-[family-name:var(--font-titre)]">
            {nomAffiche}
          </span>
          <span className="block text-white/80 text-[13px] mt-0.5">{sousTitre}</span>
        </span>
        <span
          aria-hidden
          className="shrink-0 w-9 h-9 rounded-full bg-white text-[#12172B] flex items-center justify-center transition-colors group-hover:bg-gold"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>
    </a>
  );
}
