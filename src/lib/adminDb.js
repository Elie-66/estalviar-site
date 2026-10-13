import { fetchAdmin } from "./fetchAdmin";

// Fonctions utilisées par les pages admin à la place de supabase.from(...).
// Elles passent par la route serveur /api/admin-donnees, qui vérifie que tu es admin.
// Chaque fonction renvoie { data, error }, comme Supabase, pour garder le même code.

async function appeler(options) {
  try {
    const res = await fetchAdmin("/api/admin-donnees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    const json = await res.json().catch(() => ({}));
    return res.ok ? { data: true, error: null } : { data: null, error: { message: json.error || "Erreur" } };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

export async function adminLire(table, tri, croissant = true) {
  try {
    const params = new URLSearchParams({ table });
    if (tri) {
      params.set("tri", tri);
      params.set("croissant", String(croissant));
    }
    const res = await fetchAdmin(`/api/admin-donnees?${params}`);
    const json = await res.json().catch(() => ({}));
    return res.ok ? { data: json.donnees, error: null } : { data: null, error: { message: json.error || "Erreur" } };
  } catch (e) {
    return { data: null, error: { message: e.message } };
  }
}

export const adminAjouter = (table, donnees) => appeler({ action: "ajouter", table, donnees });
export const adminModifier = (table, id, donnees) => appeler({ action: "modifier", table, id, donnees });
export const adminSupprimer = (table, id) => appeler({ action: "supprimer", table, id });
