"use client";

import { useState } from "react";

/** Bouton « Copier le code » (page Ma carte) */
export function CopierCode({ code, texte, texteCopie }) {
  const [copie, setCopie] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Navigateurs anciens : copie à l'ancienne
      const champ = document.createElement("textarea");
      champ.value = code;
      document.body.appendChild(champ);
      champ.select();
      document.execCommand("copy");
      champ.remove();
    }
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  }

  return (
    <button type="button" onClick={copier}
      className="print:hidden shrink-0 bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-3 hover:bg-gold/90 transition-colors">
      <span aria-live="polite">{copie ? texteCopie : texte}</span>
    </button>
  );
}

/** Bouton « Imprimer ou enregistrer en PDF » : ouvre la fenêtre d'impression du navigateur */
export function BoutonImprimer({ texte }) {
  return (
    <button type="button" onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-2.5 text-sm text-ivory/85 border border-ivory/20 rounded-lg px-5 py-3 hover:border-gold/60 hover:text-ivory transition-colors">
      <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9V3h12v6" /><rect x="6" y="14" width="12" height="7" rx="1" /><path d="M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" />
      </svg>
      {texte}
    </button>
  );
}
