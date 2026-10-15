// Suivi des emails de cartes : chaque carte garde l'identifiant de son email chez Resend,
// puis Resend nous prévient (webhook) quand il est délivré, ouvert ou rejeté.

// Ordre des étapes : un statut ne recule jamais (un « ouvert » ne redevient pas « délivré »)
export const RANG_STATUT = { programme: 0, envoye: 1, retarde: 2, delivre: 3, ouvert: 4, clique: 5 };
export const STATUTS_PROBLEME = ["rejete", "signale"];

/** Identifiant renvoyé par Resend, quelle que soit la forme de la réponse */
export const idEmail = (reponse) => reponse?.data?.id || reponse?.id || null;

/** Enregistre l'email envoyé pour une ou plusieurs cartes */
export async function noterEnvoi(supabase, idsCommandes, emailId, { programme = false } = {}) {
  const ids = (Array.isArray(idsCommandes) ? idsCommandes : [idsCommandes]).filter(Boolean);
  if (!emailId || ids.length === 0) return;
  try {
    await supabase
      .from("commandes")
      .update({ email_id: emailId, email_statut: programme ? "programme" : "envoye", email_maj_le: new Date().toISOString(), email_detail: null })
      .in("id", ids);
  } catch (e) {
    console.error("Suivi d'envoi non enregistré", ids, e);
  }
}
