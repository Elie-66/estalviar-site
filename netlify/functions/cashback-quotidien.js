// Tâche automatique quotidienne du cashback (tous les jours à 7h UTC) :
//  1. fait expirer le cashback de plus de 12 mois
//  2. envoie un email de rappel 30 jours avant chaque expiration
//  3. rend le cashback réservé sur les paiements abandonnés
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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
  return `
<!DOCTYPE html>
<html>
<body style="margin:0; padding:0; background-color:#F6F2E9; font-family: Georgia, serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F6F2E9; padding: 40px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background-color:#ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5ded0;">
        <tr><td style="padding: 32px; text-align: center; background-color:#12172B;">
          <span style="font-family: Georgia, serif; font-size: 22px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; color: #F6F2E9;">
            Estalviar<span style="color:#C9A227;">.</span>
          </span>
        </td></tr>
        <tr><td style="padding: 32px; background-color:#ffffff;">
          <h1 style="margin: 0 0 20px 0; font-size: 24px; color: #12172B; text-align: center;">Votre cashback expire bientôt</h1>
          <p style="margin: 0 0 12px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
            Vous avez <strong>${euros(total)}</strong> de cashback qui arrive à expiration dans les 30 prochains jours :
          </p>
          <ul style="font-family: Arial, sans-serif; font-size: 14px; color: #333; padding-left: 20px;">${liste}</ul>
          <p style="margin: 12px 0 0 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">
            Utilisez-le sur votre prochaine carte cadeau avant qu'il ne soit perdu.
          </p>
          <div style="text-align: center; margin: 28px 0 8px;">
            <a href="https://estalviar.com/fr/boutique" style="display: inline-block; background-color: #C9A227; color: #12172B; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
              Utiliser mon cashback
            </a>
          </div>
        </td></tr>
        <tr><td style="padding: 20px 32px; border-top: 1px solid #eee6d4; background-color:#ffffff;">
          <p style="margin:0; font-family: Arial, sans-serif; font-size: 11px; color: #999; text-align: center;">
            Estalviar — La carte cadeau, offerte simplement.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
        from: 'Estalviar <onboarding@resend.dev>',
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
