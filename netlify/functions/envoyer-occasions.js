import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function enveloppeEmail({ titre, contenuHtml }) {
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
        <tr><td style="padding: 32px; background-color:#ffffff;">${contenuHtml}</td></tr>
        <tr><td style="padding: 20px 32px; border-top: 1px solid #eee6d4; background-color:#ffffff;">
          <p style="margin:0; font-family: Arial, sans-serif; font-size: 11px; color: #999; text-align: center;">
            Estalviar — La carte cadeau, offerte simplement.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
  `;
}

export default async function handler() {
  const maintenant = new Date();
  const jour = maintenant.getDate();
  const mois = maintenant.getMonth() + 1;
  const aujourdHui = maintenant.toISOString().split('T')[0];

  const { data: occasionsDuJour } = await supabase
    .from('occasions')
    .select('*')
    .eq('date_jour', jour)
    .eq('date_mois', mois)
    .eq('actif', true);

  if (!occasionsDuJour || occasionsDuJour.length === 0) {
    return new Response(JSON.stringify({ message: 'Aucune occasion aujourd\'hui' }), { status: 200 });
  }

  const { data: abonnes } = await supabase
    .from('profils')
    .select('email, prenom')
    .eq('accepte_marketing', true)
    .not('email', 'is', null);

  if (!abonnes || abonnes.length === 0) {
    return new Response(JSON.stringify({ message: 'Aucun abonné' }), { status: 200 });
  }

  for (const occasion of occasionsDuJour) {
    if (occasion.derniere_execution === aujourdHui) continue;

    const contenu = `
      <h1 style="margin: 0 0 20px 0; font-family: Georgia, serif; font-size: 24px; color: #12172B; text-align: center;">${occasion.titre}</h1>
      <p style="margin: 0 0 16px 0; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;">${occasion.message}</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="https://estalviar.com/fr/boutique" style="display: inline-block; background-color: #C9A227; color: #12172B; font-family: Arial, sans-serif; font-size: 14px; font-weight: bold; text-decoration: none; padding: 14px 28px; border-radius: 8px;">
          Découvrir la boutique
        </a>
      </div>
    `;

    for (const abonne of abonnes) {
      await resend.emails.send({
        from: 'Estalviar <onboarding@resend.dev>',
        to: abonne.email,
        subject: occasion.sujet,
        html: enveloppeEmail({ titre: occasion.titre, contenuHtml: contenu }),
      });
    }

    await supabase
      .from('occasions')
      .update({ derniere_execution: aujourdHui })
      .eq('id', occasion.id);
  }

  return new Response(JSON.stringify({ success: true, occasions: occasionsDuJour.length, abonnes: abonnes.length }), { status: 200 });
}

export const config = {
  schedule: '0 8 * * *',
};