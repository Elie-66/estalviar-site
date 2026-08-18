import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';

const resend = new Resend(process.env.RESEND_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { nom, email, sujet, message } = await req.json();
    const emailNormalise = email.toLowerCase();

    const ilYAUneHeure = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('demandes_contact')
      .select('*', { count: 'exact', head: true })
      .eq('email', emailNormalise)
      .gte('created_at', ilYAUneHeure);

    if (count >= 3) {
      return NextResponse.json({ error: 'Trop de messages envoyés. Réessayez dans une heure.' }, { status: 429 });
    }

    await supabase.from('demandes_contact').insert({ email: emailNormalise });

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