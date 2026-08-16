import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { nom, email, sujet, message } = await req.json();

    const contenu = `
      ${titreEmail("Nouveau message de contact")}
      ${texteEmail(`<strong>Nom :</strong> ${nom}`)}
      ${texteEmail(`<strong>Email :</strong> ${email}`)}
      ${texteEmail(`<strong>Sujet :</strong> ${sujet}`)}
      ${texteEmail(`<strong>Message :</strong><br/>${message.replace(/\n/g, '<br/>')}`)}
    `;

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: 'info@estalviar.com',
      subject: `Contact : ${sujet}`,
      html: enveloppeEmail({ titre: `Contact : ${sujet}`, contenuHtml: contenu }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}