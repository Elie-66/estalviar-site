import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Retrouve le client connecté à partir du jeton envoyé par le navigateur (voir lib/fetchSession.js).
// Renvoie { id, email } ou null.
export async function utilisateurConnecte(req) {
  const entete = req.headers.get("authorization") || "";
  const jeton = entete.startsWith("Bearer ") ? entete.slice(7) : null;
  if (!jeton) return null;
  const { data, error } = await supabase.auth.getUser(jeton);
  if (error || !data?.user) return null;
  return { id: data.user.id, email: data.user.email };
}
