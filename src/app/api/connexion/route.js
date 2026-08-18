import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { email, motDePasse } = await req.json();
    const emailNormalise = email.toLowerCase();

    const ilYAQuinzeMinutes = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', emailNormalise)
      .gte('created_at', ilYAQuinzeMinutes);

    if (count >= 5) {
      if (count === 5) {
        const contenu = `
          ${titreEmail("Tentatives de connexion suspectes")}
          ${texteEmail(`Nous avons détecté 5 tentatives de connexion échouées sur le compte associé à cet email (${emailNormalise}). Si ce n'était pas vous, nous vous conseillons de vérifier la sécurité de votre compte.`)}
          ${texteEmail(`Si c'était bien vous et que vous avez oublié votre mot de passe, vous pouvez le réinitialiser depuis la page de connexion.`)}
        `;

        await resend.emails.send({
          from: 'Estalviar <onboarding@resend.dev>',
          to: emailNormalise,
          subject: '🔒 Tentatives de connexion suspectes sur votre compte',
          html: enveloppeEmail({ titre: 'Tentatives de connexion suspectes', contenuHtml: contenu }),
        });
      }

      return NextResponse.json({ error: 'tropTentatives' }, { status: 429 });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailNormalise,
      password: motDePasse,
    });

    if (error) {
      await supabase.from('tentatives_connexion').insert({ email: emailNormalise });

      if (error.message.includes('Invalid login credentials')) {
        return NextResponse.json({ error: 'identifiantsInvalides' }, { status: 401 });
      }
      if (error.message.includes('Email not confirmed')) {
        return NextResponse.json({ error: 'emailNonConfirme' }, { status: 401 });
      }
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      session: data.session,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}