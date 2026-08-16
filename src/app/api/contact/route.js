import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { nom, email, sujet, message } = await req.json();

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: 'info@estalviar.com',
      subject: `Contact : ${sujet}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>Nouveau message de contact</h2>
          <p><strong>Nom :</strong> ${nom}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Sujet :</strong> ${sujet}</p>
          <p><strong>Message :</strong></p>
          <p>${message.replace(/\n/g, '<br/>')}</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}