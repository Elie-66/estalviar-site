import { supabase } from "./supabase";

// Comme fetch(), mais ajoute automatiquement le jeton de session de l'admin connecté.
// À utiliser dans les pages admin pour appeler les routes /api/admin-...
export async function fetchAdmin(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const entetes = { ...(options.headers || {}) };
  if (session?.access_token) {
    entetes.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(url, { ...options, headers: entetes });
}
