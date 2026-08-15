import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function genererCode() {
  const bloc = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

function construireEmailCarte({ origin, article, code }) {
  const logoUrl = `${origin}${article.image}`;
  const couleurTexte = article.texteFonce ? '#12172B' : '#F6F2E9';
  const couleurTexteAtt = article.texteFonce ? 'rgba(18,23,43,0.6)' : 'rgba(246,242,233,0.6)';

  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0d1022;">
      <div style="border-radius: 16px; padding: 28px; background: ${article.background}; border: 1px solid rgba(201,162,39,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <img src="${logoUrl}" alt="${article.marque}" height="28" style="display:block;" />
          <span style="color:#C9A227; font-size:10px; letter-spacing:2px; text-transform:uppercase;">Estalviar</span>
        </div>
        ${article.beneficiaire ? `<p style="color:${couleurTexte}; font-size:14px; margin:20px 0 0;">Pour ${article.beneficiaire}</p>` : '<div style="margin-top:20px;"></div>'}
        ${article.message ? `<p style="color:${couleurTexteAtt}; font-size:13px; font-style:italic; margin:4px 0 16px;">"${article.message}"</p>` : ''}
        <div style="height:1px; background:rgba(201,162,39,0.3); margin:16px 0;"></div>
        <p style="color:${couleurTexte}; font-size:36px; font-weight:bold; margin:0;">
          ${article.montant} <span style="color:#C9A227; font-size:18px;">€</span>
        </p>
        <p style="color:${couleurTexteAtt}; font-size:11px; letter-spacing:2px; margin-top:16px;">
          ${code}
        </p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  try {
    const { sessionId, articles, emailsBeneficiaires } = await req.json();
    const origin = req.headers.get('origin');

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 });
    }

    const emailAcheteur = session.customer_email || session.customer_details?.email;
    const maintenant = new Date();

    for (const article of articles) {
      const code = genererCode();
      const emailDestinataire = emailsBeneficiaires?.[article.id] || emailAcheteur;

      let dateHeureEnvoi = null;
      if (article.dateEnvoi && article.heureEnvoi) {
        dateHeureEnvoi = new Date(`${article.dateEnvoi}T${article.heureEnvoi}:00`);
      }

      const joursAvant = dateHeureEnvoi
        ? (dateHeureEnvoi.getTime() - maintenant.getTime()) / (1000 * 60 * 60 * 24)
        : 0;

      let statut = 'payee';
      if (dateHeureEnvoi && joursAvant > 30) {
        statut = 'a_programmer';
      }

      await supabase.from('commandes').insert({
        email_acheteur: emailAcheteur,
        email_beneficiaire: emailsBeneficiaires?.[article.id] || null,
        email_destinataire: emailDestinataire,
        marque: article.marque,
        montant: article.montant,
        beneficiaire: article.beneficiaire || null,
        message: article.message || null,
        design: article.design,
        code,
        date_envoi: article.dateEnvoi || null,
        heure_envoi: article.heureEnvoi || null,
        statut,
      });

      if (statut === 'payee') {
        const { data: profilExistant } = await supabase
          .from('profils')
          .select('id, points')
          .eq('email', emailAcheteur)
          .maybeSingle();

        if (profilExistant) {
          await supabase
            .from('profils')
            .update({ points: (profilExistant.points || 0) + article.montant })
            .eq('id', profilExistant.id);
        }
      }

      if (statut === 'a_programmer') continue;

      const html = construireEmailCarte({ origin, article, code });

      const optionsEnvoi = {
        from: 'Estalviar <onboarding@resend.dev>',
        to: emailDestinataire,
        subject: `Votre carte cadeau ${article.marque}`,
        html,
      };

      if (dateHeureEnvoi && joursAvant > 0) {
        optionsEnvoi.scheduledAt = dateHeureEnvoi.toISOString();
      }

      await resend.emails.send(optionsEnvoi);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}