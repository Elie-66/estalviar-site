import * as fr from "./fr";
import * as en from "./en";

// Les textes légaux existent en français (version de référence) et en anglais.
// Allemand, espagnol, italien : version anglaise, avec une note dans la langue du visiteur.
const NOTES = {
  en: "This is a translation provided for convenience. In the event of any discrepancy, the French version prevails.",
  de: "Diese Seite ist auf Englisch und Französisch verfügbar. Im Zweifelsfall gilt die französische Fassung.",
  es: "Esta página está disponible en inglés y en francés. En caso de discrepancia, prevalece la versión francesa.",
  it: "Questa pagina è disponibile in inglese e in francese. In caso di discrepanza, prevale la versione francese.",
};

export function textesLegaux(locale) {
  if (locale === "fr") return { textes: fr, note: null };
  return { textes: en, note: NOTES[locale] || NOTES.en };
}
