import { supabase } from "./supabase";

// Comme fetch(), mais ajoute le jeton du client connecté (s'il l'est),
// pour que le serveur sache qui fait la demande (ex. : utiliser son cashback).
export async function fetchSession(url, options = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const entetes = { ...(options.headers || {}) };
  if (session?.access_token) {
    entetes.Authorization = `Bearer ${session.access_token}`;
  }
  return fetch(url, { ...options, headers: entetes });
}
