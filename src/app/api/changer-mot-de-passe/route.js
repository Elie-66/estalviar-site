import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { userId, email, motDePasseActuel, nouveauMotDePasse } = await req.json();

    const { error: erreurVerif } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasseActuel,
    });

    if (erreurVerif) {
      return NextResponse.json({ error: 'Mot de passe actuel incorrect.' }, { status: 401 });
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password: nouveauMotDePasse,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const contenu = `
      ${titreEmail("Votre mot de passe a été modifié")}
      ${texteEmail(`Le mot de passe de votre compte Estalviar vient d'être changé avec succès.`)}
      ${texteEmail(`<strong>Si vous n'êtes pas à l'origine de cette modification</strong>, contactez-nous immédiatement à info@estalviar.com pour sécuriser votre compte.`)}
    `;

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: email,
      subject: '🔒 Votre mot de passe a été modifié',
      html: enveloppeEmail({ titre: 'Mot de passe modifié', contenuHtml: contenu }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}