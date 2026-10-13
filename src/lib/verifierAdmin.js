import { createClient } from "@supabase/supabase-js";
import { estAdmin } from "./admin";

// Client serveur avec la clé service_role : à n'utiliser QUE dans les routes /api
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Vérifie que la requête vient bien d'un admin connecté.
// Le navigateur envoie son jeton de session dans l'en-tête Authorization (voir lib/fetchAdmin.js).
// Renvoie l'utilisateur si c'est un admin, sinon null.
export async function verifierAdmin(req) {
  const entete = req.headers.get("authorization") || "";
  const jeton = entete.startsWith("Bearer ") ? entete.slice(7) : null;
  if (!jeton) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(jeton);
  if (error || !data?.user || !estAdmin(data.user.email)) return null;

  return data.user;
}
