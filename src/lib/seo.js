// Titres et descriptions des pages (onglet du navigateur, Google, partages)
export const SITE_URL = "https://estalviar.com";
export const LANGUES = ["fr", "en", "de", "es", "it"];

async function messagesSeo(locale) {
  const messages = (await import(`../../messages/${LANGUES.includes(locale) ? locale : "fr"}.json`)).default;
  return messages.seo || {};
}

/** Liens vers la même page dans les autres langues (pour Google) */
export function alternates(locale, chemin = "") {
  const suffixe = chemin ? `/${chemin}` : "";
  return {
    canonical: `${SITE_URL}/${locale}${suffixe}`,
    languages: Object.fromEntries(LANGUES.map((l) => [l, `${SITE_URL}/${l}${suffixe}`])),
  };
}

/**
 * Métadonnées d'une page à partir des clés seo.<cle>Titre et seo.<cle>Description.
 * prive = page personnelle (compte, paiement…) : pas d'indexation par Google.
 */
export async function metadonnees(params, cle, chemin, { prive = false, valeurs = {} } = {}) {
  const { locale } = await params;
  const seo = await messagesSeo(locale);
  const remplir = (texte) => (texte || "").replace(/\{(\w+)\}/g, (_, k) => valeurs[k] ?? "");
  const titre = remplir(seo[`${cle}Titre`]);
  const description = remplir(seo[`${cle}Description`]) || undefined;
  // Titre complet et fixe (« Panier | Estalviar »), quelle que soit la page parente
  const titreComplet = titre.includes("Estalviar") ? titre : `${titre} | Estalviar`;
  return {
    title: { absolute: titreComplet },
    description,
    alternates: prive ? undefined : alternates(locale, chemin),
    robots: prive ? { index: false, follow: false } : undefined,
    openGraph: description ? { title: titreComplet, description } : undefined,
  };
}
