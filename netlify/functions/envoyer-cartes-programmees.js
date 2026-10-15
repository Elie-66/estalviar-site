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
  EXPEDITEUR, REPONDRE_A, articleDepuisCommande, construireEmailCarte, dateHeureParis,
} from '../../src/lib/emailCarte.js';
import { noterEnvoi, idEmail } from '../../src/lib/suiviEnvoi.js';

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

  // 1) Cartes à confier à Resend maintenant, réservées toutes ensemble (une seule exécution les traite)
  const dues = [];
  for (const commande of commandes || []) {
    const quand = dateHeureParis(commande.date_envoi, commande.heure_envoi);
    if (quand && quand > limite) bilan.enAttente += 1;
    else dues.push({ commande, quand });
  }
  const { data: reservees } = dues.length
    ? await supabase
        .from('commandes')
        .update({ statut: 'envoi_en_cours' })
        .in('id', dues.map((d) => d.commande.id))
        .eq('statut', 'a_programmer')
        .select('id')
    : { data: [] };
  const idsReserves = new Set((reservees || []).map((r) => r.id));

  // Le logo et le fond d'une enseigne ne sont cherchés qu'une fois (commande groupée = souvent la même carte)
  const articles = new Map();
  const pretes = [];
  for (const { commande, quand } of dues) {
    if (!idsReserves.has(commande.id)) continue;
    try {
      const code = dechiffrerCode(commande.code);
      const cle = `${commande.marque}|${commande.design}`;
      if (!articles.has(cle)) articles.set(cle, await articleDepuisCommande(supabase, commande));
      const article = { ...articles.get(cle), montant: commande.montant, beneficiaire: commande.beneficiaire, message: commande.message };
      const options = {
        from: EXPEDITEUR,
        replyTo: REPONDRE_A,
        to: commande.email_destinataire || commande.email_acheteur,
        subject: `Votre carte cadeau ${article.marque}`,
        html: construireEmailCarte({ article, code, jeton: commande.jeton_carte }),
      };
      if (quand && quand > maintenant) options.scheduledAt = quand.toISOString();
      pretes.push({ commande, options });
    } catch (e) {
      console.error('Carte programmée non préparée', commande.id, e);
      await supabase.from('commandes').update({ statut: 'a_programmer' }).eq('id', commande.id);
      bilan.erreurs += 1;
    }
  }

  // 2) Envoi par paquets de 100 (une commande groupée de 100 cartes = un seul appel à Resend)
  for (let i = 0; i < pretes.length; i += 100) {
    const paquet = pretes.slice(i, i + 100);
    const ids = paquet.map((p) => p.commande.id);
    try {
      const reponse = paquet.length === 1
        ? await resend.emails.send(paquet[0].options)
        : await resend.batch.send(paquet.map((p) => p.options));
      if (reponse.error) throw new Error(reponse.error.message || 'Envoi refusé par Resend');

      await supabase.from('commandes').update({ statut: 'payee' }).in('id', ids);
      const idsEmails = paquet.length === 1 ? [idEmail(reponse)] : (reponse.data?.data || []).map((e) => e.id);
      await Promise.all(paquet.map((p, k) => noterEnvoi(supabase, p.commande.id, idsEmails[k], { programme: !!p.options.scheduledAt })));
      bilan.envoyees += paquet.length;
    } catch (e) {
      // On remet les cartes en file : elles seront retentées demain
      console.error('Cartes programmées non envoyées', ids, e);
      await supabase.from('commandes').update({ statut: 'a_programmer' }).in('id', ids);
      bilan.erreurs += paquet.length;
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
