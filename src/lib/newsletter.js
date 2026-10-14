// Newsletter : réglages et petits outils partagés (API + tâches automatiques)
export const POINTS_NEWSLETTER = 25; // doit rester égal au chiffre du fichier SQL (déclencheur zz_bonus_newsletter)

export const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const JETON_VALIDE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Pour comparer une adresse email sans que « _ » ou « % » servent de joker dans ilike
export const emailExact = (email) => email.replace(/[\\%_]/g, (c) => `\\${c}`);

// Petit pied de page « se désinscrire » pour les emails de la newsletter
export const piedDesinscription = (lien) =>
  `<p style="margin: 24px 0 0 0; font-family: Arial, sans-serif; font-size: 11px; color: #999; text-align: center;">` +
  `Vous recevez cet email car vous êtes inscrit(e) à la newsletter Estalviar. ` +
  `<a href="${lien}" style="color: #999;">Se désinscrire</a></p>`;
