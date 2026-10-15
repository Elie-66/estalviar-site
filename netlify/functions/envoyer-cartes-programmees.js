// Tâche automatique quotidienne (tous les jours à 6h UTC) :
// envoie les cartes cadeaux programmées à plus de 30 jours, quand leur date se rapproche.
//
// Resend ne programme un email que 30 jours à l'avance au maximum. Les cartes plus lointaines
// sont enregistrées « a_programmer » au paiement ; dès qu'elles entrent dans la fenêtre,
// cette tâche les confie à Resend, qui les envoie au jour et à l'heure choisis (heure de Paris).
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { dechiffrerCode } from '../../src/lib/chiffrement.js';
import {
  EXPEDITEUR, articleDepuisCommande, construireEmailCarte, dateHeureParis,
} from '../../src/lib/emailCarte.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const FENETRE_JOURS = 28; // on programme chez Resend quand l'envoi est à moins de 28 jours

export async function envoyerCartesProgrammees(maintenant = new Date()) {
  const limite = new Date(maintenant.getTime() + FENETRE_JOURS * 86400000);
  const { data: commandes, error } = await supabase
    .from('commandes')
    .select('*')
    .eq('statut', 'a_programmer');
  if (error) throw error;

  const bilan = { envoyees: 0, erreurs: 0, enAttente: 0 };

  for (const commande of commandes || []) {
    const quand = dateHeureParis(commande.date_envoi, commande.heure_envoi);
    if (quand && quand > limite) {
      bilan.enAttente += 1;
      continue;
    }

    // Réservation : une seule exécution peut traiter cette carte
    const { data: reservee } = await supabase
      .from('commandes')
      .update({ statut: 'envoi_en_cours' })
      .eq('id', commande.id)
      .eq('statut', 'a_programmer')
      .select('id')
      .maybeSingle();
    if (!reservee) continue;

    try {
      const code = dechiffrerCode(commande.code);
      const article = await articleDepuisCommande(supabase, commande);
      const options = {
        from: EXPEDITEUR,
        to: commande.email_destinataire || commande.email_acheteur,
        subject: `Votre carte cadeau ${article.marque}`,
        html: construireEmailCarte({ article, code, jeton: commande.jeton_carte }),
      };
      if (quand && quand > maintenant) options.scheduledAt = quand.toISOString();

      const { error: erreurEnvoi } = await resend.emails.send(options);
      if (erreurEnvoi) throw new Error(erreurEnvoi.message || 'Envoi refusé par Resend');

      await supabase.from('commandes').update({ statut: 'payee' }).eq('id', commande.id);
      bilan.envoyees += 1;
    } catch (e) {
      // On remet la carte en file : elle sera retentée demain
      console.error('Carte programmée non envoyée', commande.id, e);
      await supabase.from('commandes').update({ statut: 'a_programmer' }).eq('id', commande.id);
      bilan.erreurs += 1;
    }
  }
  return bilan;
}

export default async function handler() {
  const bilan = await envoyerCartesProgrammees();
  console.log('Cartes programmées :', bilan);
  return new Response(JSON.stringify(bilan), { status: 200 });
}

export const config = {
  schedule: '0 6 * * *',
};
