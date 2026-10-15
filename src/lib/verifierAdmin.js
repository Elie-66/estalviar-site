import { createClient } from "@supabase/supabase-js";
import { estProprietaire, aLeDroit, CLES_SECTIONS } from "./admin";

// Client serveur avec la clé service_role : à n'utiliser QUE dans les routes /api
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Accès admin de la personne connectée (le navigateur envoie son jeton, voir lib/fetchAdmin.js).
 * Renvoie { user, email, proprietaire, sections } ou null si elle n'a aucun accès.
 */
export async function accesAdmin(req) {
  const entete = req.headers.get("authorization") || "";
  const jeton = entete.startsWith("Bearer ") ? entete.slice(7) : null;
  if (!jeton) return null;

  const { data, error } = await supabaseAdmin.auth.getUser(jeton);
  const user = data?.user;
  // Adresse email confirmée obligatoire : personne ne peut s'inscrire avec l'adresse d'un admin
  if (error || !user?.email || !user.email_confirmed_at) return null;
  const email = user.email.toLowerCase();

  if (estProprietaire(email)) {
    return { user, email, proprietaire: true, sections: Object.fromEntries(CLES_SECTIONS.map((c) => [c, "modifier"])) };
  }

  const { data: membre } = await supabaseAdmin
    .from("equipe_admin")
    .select("sections")
    .eq("email", email)
    .maybeSingle();
  const sections = Object.fromEntries(
    Object.entries(membre?.sections || {}).filter(([cle, n]) => CLES_SECTIONS.includes(cle) && ["voir", "modifier"].includes(n))
  );
  if (Object.keys(sections).length === 0) return null;
  return { user, email, proprietaire: false, sections };
}

/**
 * Vérifie un droit précis. section peut être une liste (au moins une suffit).
 * Renvoie l'accès si c'est autorisé, sinon null.
 */
export async function verifierAcces(req, section, niveau = "voir") {
  const acces = await accesAdmin(req);
  return aLeDroit(acces, section, niveau) ? acces : null;
}

/** Réservé au propriétaire (gestion de l'équipe) */
export async function verifierProprietaire(req) {
  const acces = await accesAdmin(req);
  return acces?.proprietaire ? acces : null;
}

/** Note une action dans le journal de l'admin (ne bloque jamais l'action si le journal échoue) */
export async function journaliser(acces, action, details = {}) {
  try {
    await supabaseAdmin.from("journal_admin").insert({ email: acces?.email || "inconnu", action, details });
  } catch (e) {
    console.error("Journal admin", e);
  }
}
