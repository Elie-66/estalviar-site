import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';
import { EXPEDITEUR, SITE } from '../../../lib/emailCarte';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const motDePasseValide = (mdp) => typeof mdp === 'string' && mdp.length >= 8 && /[a-zA-Z]/.test(mdp) && /[0-9]/.test(mdp);

// Le compte modifié est TOUJOURS celui du client connecté (jeton de session),
// jamais un identifiant envoyé par le navigateur.
export async function POST(req) {
  try {
    const client = await utilisateurConnecte(req);
    if (!client) return NextResponse.json({ code: 'nonConnecte' }, { status: 401 });

    const { motDePasseActuel, nouveauMotDePasse } = await req.json().catch(() => ({}));
    if (!motDePasseValide(nouveauMotDePasse)) return NextResponse.json({ code: 'regle' }, { status: 400 });

    // Anti-essais : 5 vérifications ratées maximum en 15 minutes
    const cle = `mdp_${client.id}`;
    const depuis = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .gte('created_at', depuis);
    if (count >= 5) return NextResponse.json({ code: 'tropTentatives' }, { status: 429 });

    const { error: erreurVerif } = await supabase.auth.signInWithPassword({
      email: client.email,
      password: typeof motDePasseActuel === 'string' ? motDePasseActuel : '',
    });
    if (erreurVerif) {
      await supabase.from('tentatives_connexion').insert({ email: cle });
      return NextResponse.json({ code: 'actuelIncorrect' }, { status: 401 });
    }

    const { error } = await supabase.auth.admin.updateUserById(client.id, { password: nouveauMotDePasse });
    if (error) {
      console.error(error);
      return NextResponse.json({ code: 'erreur' }, { status: 500 });
    }

    const { error: erreurEmail } = await resend.emails.send({
      from: EXPEDITEUR,
      to: client.email,
      subject: 'Votre mot de passe Estalviar a été modifié',
      html: enveloppeEmail({
        titre: 'Mot de passe modifié',
        siteUrl: SITE,
        contenuHtml:
          titreEmail('Votre mot de passe a été modifié') +
          texteEmail('Le mot de passe de votre compte Estalviar vient d’être changé.') +
          texteEmail('<strong>Si vous n’êtes pas à l’origine de cette modification</strong>, contactez-nous immédiatement à info@estalviar.com pour sécuriser votre compte.'),
      }),
    });
    if (erreurEmail) console.error('Email de changement de mot de passe non envoyé', erreurEmail);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ code: 'erreur' }, { status: 500 });
  }
}
