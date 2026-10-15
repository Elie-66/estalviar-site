// Côté pages admin : sections auxquelles la personne connectée a accès (demandé une fois au serveur).
// Le serveur revérifie chaque droit : ceci sert seulement à afficher les bonnes pages et boutons.
import { fetchAdmin } from "./fetchAdmin";
import { aLeDroit } from "./admin";

let promesse = null;

export function lireAccesAdmin() {
  if (!promesse) {
    promesse = fetchAdmin("/api/admin-acces")
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((acces) => {
        if (!acces) promesse = null; // on redemandera (ex. : connexion juste après)
        return acces;
      });
  }
  return promesse;
}

export async function peutVoir(section, niveau = "voir") {
  return aLeDroit(await lireAccesAdmin(), section, niveau);
}
