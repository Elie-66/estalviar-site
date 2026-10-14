import { INFOS_LEGALES } from "../../../lib/infosLegales";

// Nom affiché d'un champ légal encore vide
const LIBELLES = {
  nom: "nom et prénom", siret: "SIRET", rcs: "n° RCS", adresse: "adresse", telephone: "téléphone",
  directeurPublication: "directeur de la publication", mediateurNom: "nom du médiateur",
  mediateurSite: "site du médiateur", mediateurAdresse: "adresse du médiateur", regionDonnees: "région des serveurs",
};

/**
 * Texte enrichi très simple :
 *   {{siret}}        → valeur de INFOS_LEGALES (ou repère rouge « à compléter »)
 *   **gras**         → gras
 *   [texte](/lien)   → lien
 */
function Texte({ texte, locale }) {
  const morceaux = texte.split(/(\{\{\w+\}\}|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).filter(Boolean);
  return morceaux.map((m, i) => {
    const champ = m.match(/^\{\{(\w+)\}\}$/);
    if (champ) {
      const valeur = INFOS_LEGALES[champ[1]];
      if (valeur) return <span key={i}>{valeur}</span>;
      return (
        <span key={i} className="text-corail border-b border-dashed border-corail/70 whitespace-nowrap">
          [{LIBELLES[champ[1]] || champ[1]} {locale === "fr" ? "à compléter" : "to be completed"}]
        </span>
      );
    }
    const gras = m.match(/^\*\*([^*]+)\*\*$/);
    if (gras) return <strong key={i} className="text-ivory font-medium">{gras[1]}</strong>;
    const lien = m.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (lien) {
      const externe = /^https?:/.test(lien[2]);
      const href = externe || lien[2].startsWith("mailto:") ? lien[2] : `/${locale}${lien[2]}`;
      return (
        <a key={i} href={href} className="text-gold underline decoration-gold/40 underline-offset-2 hover:decoration-gold"
          {...(externe ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          {lien[1]}
        </a>
      );
    }
    return <span key={i}>{m}</span>;
  });
}

function Bloc({ bloc, locale }) {
  if (typeof bloc === "string") {
    return <p><Texte texte={bloc} locale={locale} /></p>;
  }
  if (bloc.liste) {
    return (
      <ul className="space-y-2 pl-5 list-disc marker:text-gold/70">
        {bloc.liste.map((l, i) => <li key={i}><Texte texte={l} locale={locale} /></li>)}
      </ul>
    );
  }
  if (bloc.tableau) {
    return (
      <div className="-mx-6 px-6 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm border-collapse">
          <thead>
            <tr>
              {bloc.tableau.entetes.map((e) => (
                <th key={e} className="text-left text-ivory font-medium border-b border-ivory/20 py-2 pr-4 align-bottom">{e}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bloc.tableau.lignes.map((ligne, i) => (
              <tr key={i} className="border-b border-ivory/10 align-top">
                {ligne.map((cellule, j) => (
                  <td key={j} className="py-2.5 pr-4"><Texte texte={cellule} locale={locale} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (bloc.encadre) {
    return (
      <div className="border border-ivory/15 rounded-xl p-5 bg-ivory/[0.03] space-y-3">
        {bloc.encadre.map((l, i) => <p key={i}><Texte texte={l} locale={locale} /></p>)}
      </div>
    );
  }
  return null;
}

/**
 * Page légale : titre, date de mise à jour, sommaire, sections numérotées.
 * contenu = { titre, miseAJour, intro?: [blocs], sections: [{ id, titre, blocs }] }
 */
export default function PageLegale({ contenu, locale, note, sommaire = true }) {
  return (
    <div className="w-full min-w-0 max-w-[820px] mx-auto px-6 pt-32 pb-20 text-ivory/75 leading-relaxed text-[15px]">
      <h1 className="text-3xl md:text-4xl font-semibold text-ivory">{contenu.titre}</h1>
      <p className="mt-2 text-sm text-ivory/45">{contenu.miseAJour}</p>

      {note && (
        <p className="mt-6 text-sm border-l-2 border-gold/60 pl-4 text-ivory/60">{note}</p>
      )}

      {contenu.intro && (
        <div className="mt-8 space-y-4">
          {contenu.intro.map((b, i) => <Bloc key={i} bloc={b} locale={locale} />)}
        </div>
      )}

      {sommaire && contenu.sections.length > 4 && (
        <nav aria-label={contenu.sommaireLabel || "Sommaire"} className="mt-10 border border-ivory/10 rounded-xl p-5">
          <p className="text-ivory font-medium mb-3">{contenu.sommaireLabel || "Sommaire"}</p>
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {contenu.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ivory/65 hover:text-gold">{s.titre}</a>
              </li>
            ))}
          </ol>
        </nav>
      )}

      {contenu.sections.map((s) => (
        <section key={s.id} id={s.id} className="scroll-mt-28 mt-12">
          <h2 className="text-xl font-semibold text-ivory mb-4">{s.titre}</h2>
          <div className="space-y-4">
            {s.blocs.map((b, i) => <Bloc key={i} bloc={b} locale={locale} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
