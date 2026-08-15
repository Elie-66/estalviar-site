import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const cartesConnues = {
  amazon: { image: "/logos/amazon.svg", couleur: "#1b3a5c" },
  fnac: { image: "/logos/fnac.svg", couleur: "#1b3a5c" },
  steam: { image: "/logos/steam.svg", couleur: "#1b3a5c" },
};

export async function POST(req) {
  try {
    const { commandeId, origin } = await req.json();

    const { data: commande } = await supabase
      .from('commandes')
      .select('*')
      .eq('id', commandeId)
      .single();

    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const nomPropre = commande.marque.replace(/^Cagnotte\s*/i, '').trim();
    const clePossible = Object.keys(cartesConnues).find(
      (k) => k.toLowerCase() === nomPropre.toLowerCase()
    );
    const infosCarte = clePossible
      ? cartesConnues[clePossible]
      : { image: "/logos/estalviar-icone.svg", couleur: "#C9A227" };

    const background = `linear-gradient(150deg, ${infosCarte.couleur} 0%, #0d1022 100%)`;
    const logoUrl = `${origin}${infosCarte.image}`;
    const destinataire = commande.email_destinataire || commande.email_acheteur;

    let codeClair = '';
    if (commande.code) {
      try {
        codeClair = dechiffrerCode(commande.code);
      } catch (e) {
        codeClair = commande.code;
      }
    }

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: destinataire,
      subject: `Votre carte cadeau ${nomPropre} (renvoi)`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0d1022;">
          <div style="border-radius: 16px; padding: 28px; background: ${background}; border: 1px solid rgba(201,162,39,0.3);">
            <div style="display: flex; align-items: center; justify-content: space-between;">
              <img src="${logoUrl}" alt="${nomPropre}" height="28" style="display:block;" />
              <span style="color:#C9A227; font-size:10px; letter-spacing:2px; text-transform:uppercase;">Estalviar</span>
            </div>
            ${commande.beneficiaire ? `<p style="color:#F6F2E9; font-size:14px; margin:20px 0 0;">Pour ${commande.beneficiaire}</p>` : '<div style="margin-top:20px;"></div>'}
            ${commande.message ? `<p style="color:rgba(246,242,233,0.6); font-size:13px; font-style:italic; margin:4px 0 16px;">"${commande.message}"</p>` : ''}
            <div style="height:1px; background:rgba(201,162,39,0.3); margin:16px 0;"></div>
            <p style="color:#F6F2E9; font-size:36px; font-weight:bold; margin:0;">
              ${commande.montant} <span style="color:#C9A227; font-size:18px;">€</span>
            </p>
            <p style="color:rgba(246,242,233,0.6); font-size:11px; letter-spacing:2px; margin-top:16px;">${codeClair}</p>
          </div>
          <p style="color:rgba(246,242,233,0.4); font-size:11px; text-align:center; margin-top:16px;">
            Ceci est un renvoi de votre carte cadeau.
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}