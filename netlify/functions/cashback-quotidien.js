// Tâche automatique quotidienne du cashback (tous les jours à 7h UTC) :
//  1. fait expirer le cashback de plus de 12 mois
//  2. envoie un email de rappel 30 jours avant chaque expiration
//  3. rend le cashback réservé sur les paiements abandonnés
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from '../../src/lib/emailTemplate.js';
import { EXPEDITEUR, REPONDRE_A, SITE } from '../../src/lib/emailCarte.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const euros = (n) => `${Number(n).toFixed(2).replace('.', ',')} €`;
const date = (d) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function emailRappel(lignes, total) {
  const liste = lignes
    .map((l) => `<li style="margin:4px 0;"><strong>${euros(l.restant)}</strong> le ${date(l.expire_le)}</li>`)
    .join('');
  return enveloppeEmail({
    titre: 'Votre cashback expire bientôt',
    siteUrl: SITE,
    contenuHtml:
      titreEmail('Votre cashback expire bientôt') +
      texteEmail(`Vous avez <strong>${euros(total)}</strong> de cashback qui arrive à expiration dans les 30 prochains jours :`) +
      `<ul style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding-left: 20px; margin: 0 0 16px 0;">${liste}</ul>` +
      texteEmail('Utilisez-le sur votre prochaine carte cadeau avant qu’il ne soit perdu.') +
      boutonEmail({ texte: 'Utiliser mon cashback', lien: `${SITE}/fr/boutique` }),
  });
}

export default async function handler() {
  const resultat = { expires: 0, liberes: 0, rappels: 0 };

  // 1) Expirations
  const { data: nbExpires } = await supabase.rpc('cashback_expirer');
  resultat.expires = nbExpires || 0;

  // 2) Paiements abandonnés depuis plus de 2 heures
  const { data: nbLiberes } = await supabase.rpc('cashback_liberer_abandonnes');
  resultat.liberes = nbLiberes || 0;

  // 3) Rappels 30 jours avant expiration (un seul email par client, une seule fois par gain)
  const maintenant = new Date();
  const dans30Jours = new Date(maintenant.getTime() + 30 * 24 * 3600 * 1000);
  const { data: gains } = await supabase
    .from('cashback_mouvements')
    .select('id, profil_id, restant, expire_le')
    .eq('type', 'gain')
    .eq('rappel_envoye', false)
    .gt('restant', 0)
    .lte('disponible_le', maintenant.toISOString())
    .gt('expire_le', maintenant.toISOString())
    .lte('expire_le', dans30Jours.toISOString());

  const parClient = {};
  (gains || []).forEach((g) => { (parClient[g.profil_id] ||= []).push(g); });

  for (const [profilId, lignes] of Object.entries(parClient)) {
    const { data: profil } = await supabase.from('profils').select('email').eq('id', profilId).maybeSingle();
    if (!profil?.email) continue;
    const total = lignes.reduce((s, l) => s + Number(l.restant), 0);
    try {
      await resend.emails.send({
        from: EXPEDITEUR,
        replyTo: REPONDRE_A,
        to: profil.email,
        subject: `${euros(total)} de cashback expirent bientôt`,
        html: emailRappel(lignes, total),
      });
      await supabase.from('cashback_mouvements').update({ rappel_envoye: true }).in('id', lignes.map((l) => l.id));
      resultat.rappels++;
    } catch (e) {
      console.error('Rappel cashback non envoyé', profilId, e);
    }
  }

  return new Response(JSON.stringify(resultat), { status: 200 });
}

export const config = {
  schedule: '0 7 * * *',
};
