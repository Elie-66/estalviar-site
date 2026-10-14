import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from '../../../lib/emailTemplate';
import { EXPEDITEUR, SITE } from '../../../lib/emailCarte';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';
import { EMAIL_VALIDE, POINTS_NEWSLETTER } from '../../../lib/newsletter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Inscription à la newsletter depuis l'accueil.
 * - Client connecté : inscrit tout de suite, 25 points offerts la première fois (déclencheur SQL).
 * - Visiteur sans compte : email de confirmation ; les points arrivent quand il crée son compte
 *   avec cette adresse.
 */
export async function POST(req) {
  try {
    const utilisateur = await utilisateurConnecte(req);

    if (utilisateur) {
      const { data: avant } = await supabase
        .from('profils').select('bonus_newsletter_le').eq('id', utilisateur.id).maybeSingle();
      const { error } = await supabase
        .from('profils').update({ accepte_marketing: true }).eq('id', utilisateur.id);
      if (error) throw error;
      return NextResponse.json({ statut: 'inscrit', points: avant?.bonus_newsletter_le ? 0 : POINTS_NEWSLETTER });
    }

    const corps = await req.json().catch(() => ({}));
    const email = typeof corps.email === 'string' ? corps.email.trim().toLowerCase().slice(0, 200) : '';
    if (!EMAIL_VALIDE.test(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 });
    }

    // Anti-abus : 5 inscriptions maximum par heure et par adresse IP
    const ip =
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'inconnue';
    const cle = `newsletter_${ip}`;
    const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .gte('created_at', depuis);
    if (count >= 5) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une heure.' }, { status: 429 });
    }
    await supabase.from('tentatives_connexion').insert({ email: cle });

    let { data: inscrit } = await supabase
      .from('newsletter_inscrits').select('*').eq('email', email).maybeSingle();

    // Déjà inscrit et confirmé : rien à renvoyer (même réponse pour ne rien révéler)
    if (inscrit?.confirme_le && !inscrit.desinscrit_le) {
      return NextResponse.json({ statut: 'confirmation' });
    }

    if (!inscrit) {
      const { data, error } = await supabase
        .from('newsletter_inscrits').insert({ email }).select().single();
      if (error) throw error;
      inscrit = data;
    } else if (inscrit.desinscrit_le) {
      // Il s'était désinscrit : il doit reconfirmer
      await supabase.from('newsletter_inscrits')
        .update({ desinscrit_le: null, confirme_le: null }).eq('id', inscrit.id);
    }

    const lien = `${SITE}/api/newsletter/confirmer?jeton=${inscrit.jeton}`;
    const { error: erreurEmail } = await resend.emails.send({
      from: EXPEDITEUR,
      to: email,
      replyTo: 'info@estalviar.com',
      subject: 'Confirmez votre inscription à la newsletter Estalviar',
      html: enveloppeEmail({
        titre: 'Confirmez votre inscription',
        siteUrl: SITE,
        contenuHtml:
          titreEmail('Plus qu’un clic') +
          texteEmail('Confirmez votre adresse pour recevoir nos idées cadeaux, les grandes occasions de l’année et nos offres.') +
          boutonEmail({ texte: 'Confirmer mon inscription', lien }) +
          texteEmail(`Créez ensuite votre compte Estalviar avec cette adresse : <strong>${POINTS_NEWSLETTER} points de fidélité</strong> vous y attendent.`) +
          texteEmail('<span style="color:#999; font-size:12px;">Vous n’avez rien demandé ? Ignorez simplement cet email.</span>'),
      }),
    });
    if (erreurEmail) {
      console.error('Email de confirmation newsletter non envoyé', erreurEmail);
      return NextResponse.json({ error: 'L’email de confirmation n’a pas pu partir. Réessayez plus tard.' }, { status: 502 });
    }

    return NextResponse.json({ statut: 'confirmation' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Une erreur est survenue, réessayez.' }, { status: 500 });
  }
}
