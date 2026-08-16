import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { chiffrerCode } from '../../../lib/chiffrement';
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function genererCode() {
  const bloc = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

function construireEmailCarte({ marque, image, background, texteFonce, beneficiaire, message, montant, code, origin }) {
  const logoUrl = image.startsWith('http') ? image : `${origin}${image}`;
  const couleurTexte = texteFonce ? '#12172B' : '#F6F2E9';
  const couleurTexteAtt = texteFonce ? 'rgba(18,23,43,0.6)' : 'rgba(246,242,233,0.6)';

  return `
    <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0d1022;">
      <div style="border-radius: 16px; padding: 28px; background: ${background}; border: 1px solid rgba(201,162,39,0.3);">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <img src="${logoUrl}" alt="${marque}" height="28" style="display:block;" />
          <span style="color:#C9A227; font-size:10px; letter-spacing:2px; text-transform:uppercase;">Estalviar</span>
        </div>
        <p style="color:${couleurTexte}; font-size:14px; margin:20px 0 0;">Pour ${beneficiaire}</p>
        ${message ? `<p style="color:${couleurTexteAtt}; font-size:13px; font-style:italic; margin:4px 0 16px;">"${message}"</p>` : ''}
        <div style="height:1px; background:rgba(201,162,39,0.3); margin:16px 0;"></div>
        <p style="color:${couleurTexte}; font-size:36px; font-weight:bold; margin:0;">
          ${montant} <span style="color:#C9A227; font-size:18px;">€</span>
        </p>
        <p style="color:${couleurTexteAtt}; font-size:11px; letter-spacing:2px; margin-top:16px;">${code}</p>
      </div>
    </div>
  `;
}

export async function POST(req) {
  try {
    const { cagnotteId, origin } = await req.json();

    const { data: participants } = await supabase
      .from('contributions_cagnotte')
      .select('nom_contributeur, montant')
      .eq('cagnotte_id', cagnotteId)
      .eq('statut', 'payee');

    const { data: cagnotte } = await supabase
      .from('cagnottes')
      .select('*')
      .eq('id', cagnotteId)
      .single();

    if (!cagnotte || cagnotte.statut === 'cloturee' || cagnotte.statut === 'attente_choix') {
      return NextResponse.json({ success: true });
    }

    const destinataire = cagnotte.envoi_beneficiaire
      ? cagnotte.email_beneficiaire
      : cagnotte.email_createur;

    if (cagnotte.carte_choisie) {
      const code = genererCode();

      await supabase.from('commandes').insert({
        email_acheteur: cagnotte.email_createur,
        email_destinataire: destinataire,
        marque: `Cagnotte ${cagnotte.marque}`,
        montant: cagnotte.montant_collecte,
        beneficiaire: cagnotte.beneficiaire,
        message: cagnotte.message,
        design: cagnotte.design,
        code: chiffrerCode(code),
        statut: 'payee',
        cagnotte_id: cagnotte.id,
      });

      let html = construireEmailCarte({
        marque: cagnotte.marque,
        image: cagnotte.image,
        background: cagnotte.background,
        texteFonce: cagnotte.texte_fonce,
        beneficiaire: cagnotte.beneficiaire,
        message: cagnotte.message,
        montant: cagnotte.montant_collecte,
        code,
        origin,
      });

      if (participants && participants.length > 0) {
        html += `
          <div style="color:#F6F2E9; font-family: sans-serif; max-width: 480px; margin: 20px auto 0;">
            <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#C9A227;">Ont contribué</p>
            <ul style="padding-left:18px; font-size:13px;">
              ${participants.map((p) => `<li>${p.nom_contributeur} — ${p.montant} €</li>`).join('')}
            </ul>
          </div>
        `;
      }

      await resend.emails.send({
        from: 'Estalviar <onboarding@resend.dev>',
        to: destinataire,
        subject: `Votre carte cadeau ${cagnotte.marque}`,
        html,
      });

      await supabase.from('cagnottes').update({ statut: 'cloturee', code }).eq('id', cagnotteId);
    } else {
      const contenuChoix = `
        ${titreEmail("Votre cagnotte est clôturée !")}
        ${texteEmail(`${cagnotte.montant_collecte} € ont été collectés pour vous. Choisissez maintenant la carte cadeau de votre choix :`)}
        ${boutonEmail({ texte: "Choisir ma carte", lien: `${origin}/fr/cagnotte/${cagnotte.slug}/choisir` })}
      `;

      await resend.emails.send({
        from: 'Estalviar <onboarding@resend.dev>',
        to: destinataire,
        subject: `Cagnotte clôturée — choisissez votre carte`,
        html: enveloppeEmail({ titre: `Cagnotte clôturée — choisissez votre carte`, contenuHtml: contenuChoix }),
      });

      await supabase.from('cagnottes').update({ statut: 'attente_choix' }).eq('id', cagnotteId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}