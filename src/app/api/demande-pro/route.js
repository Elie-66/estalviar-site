import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { entreprise, contact, email, telephone, quantite, message, destinataires } = await req.json();

    const { error } = await supabase.from('demandes_pro').insert({
      entreprise,
      contact,
      email,
      telephone: telephone || null,
      quantite: quantite ? parseInt(quantite) : null,
      message: message || null,
      destinataires: destinataires && destinataires.length > 0 ? destinataires : null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const listeDestinatairesHtml =
      destinataires && destinataires.length > 0
        ? texteEmail(`<strong>Destinataires fournis (${destinataires.length}) :</strong><br/>${destinataires.map((d) => `${d.nom || "—"} — ${d.email || "—"}`).join('<br/>')}`)
        : '';

    const contenu = `
      ${titreEmail("Nouvelle demande de devis")}
      ${texteEmail(`<strong>Entreprise :</strong> ${entreprise}`)}
      ${texteEmail(`<strong>Contact :</strong> ${contact}`)}
      ${texteEmail(`<strong>Email :</strong> ${email}`)}
      ${texteEmail(`<strong>Téléphone :</strong> ${telephone || "—"}`)}
      ${texteEmail(`<strong>Quantité estimée :</strong> ${quantite || "—"}`)}
      ${texteEmail(`<strong>Message :</strong> ${message || "—"}`)}
      ${listeDestinatairesHtml}
    `;

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: 'info@estalviar.com',
      subject: `Nouvelle demande pro : ${entreprise}`,
      html: enveloppeEmail({ titre: `Nouvelle demande pro : ${entreprise}`, contenuHtml: contenu }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}