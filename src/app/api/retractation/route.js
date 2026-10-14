import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';
import { echapperHtml } from '../../../lib/designs';
import { EXPEDITEUR, SITE } from '../../../lib/emailCarte';
import { EMAIL_VALIDE } from '../../../lib/newsletter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const texte = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * « Bouton de rétractation » (obligatoire depuis le 19 juin 2026) :
 * enregistre la demande, puis envoie un accusé de réception horodaté au client
 * (support durable) et une alerte à Estalviar.
 */
export async function POST(req) {
  try {
    const corps = await req.json().catch(() => ({}));
    const nom = texte(corps.nom, 120);
    const email = texte(corps.email, 200).toLowerCase();
    const commande = texte(corps.commande, 500);
    const message = texte(corps.message, 2000);

    if (!nom || !EMAIL_VALIDE.test(email) || !commande) {
      return NextResponse.json({ error: 'Merci d’indiquer votre nom, votre email et la commande concernée.' }, { status: 400 });
    }

    // Anti-abus : 5 demandes maximum par heure et par adresse IP
    const ip =
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'inconnue';
    const cle = `retractation_${ip}`;
    const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .gte('created_at', depuis);
    if (count >= 5) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une heure ou écrivez à info@estalviar.com.' }, { status: 429 });
    }
    await supabase.from('tentatives_connexion').insert({ email: cle });

    const { data: demande, error } = await supabase
      .from('demandes_retractation')
      .insert({ nom, email, commande, message: message || null })
      .select('id, created_at')
      .single();
    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Votre demande n’a pas pu être enregistrée. Écrivez-nous à info@estalviar.com.' }, { status: 500 });
    }

    const recue = new Date(demande.created_at).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris', dateStyle: 'long', timeStyle: 'short',
    });
    const reference = demande.id.slice(0, 8).toUpperCase();
    const e = echapperHtml;
    const recap =
      texteEmail(`<strong>Référence :</strong> ${reference}<br/><strong>Reçue le :</strong> ${recue} (heure de Paris)`) +
      texteEmail(`<strong>Nom :</strong> ${e(nom)}<br/><strong>Email :</strong> ${e(email)}`) +
      texteEmail(`<strong>Commande concernée :</strong><br/>${e(commande).replace(/\n/g, '<br/>')}`) +
      (message ? texteEmail(`<strong>Message :</strong><br/>${e(message).replace(/\n/g, '<br/>')}`) : '');

    const [accuse, alerte] = await Promise.all([
      resend.emails.send({
        from: EXPEDITEUR,
        to: email,
        replyTo: 'info@estalviar.com',
        subject: `Accusé de réception de votre rétractation (${reference})`,
        html: enveloppeEmail({
          titre: 'Rétractation reçue',
          siteUrl: SITE,
          contenuHtml:
            titreEmail('Nous avons bien reçu votre rétractation') +
            texteEmail(`Bonjour ${e(nom)},`) +
            texteEmail('Votre demande de rétractation a bien été enregistrée. Conservez cet email : il en est la preuve.') +
            recap +
            texteEmail('Nous vérifions la commande et revenons vers vous rapidement. Si la carte n’a pas encore été envoyée, vous êtes remboursé au plus tard 14 jours après la réception de cette demande, avec le moyen de paiement utilisé lors de la commande.'),
        }),
      }),
      resend.emails.send({
        from: EXPEDITEUR,
        to: 'info@estalviar.com',
        replyTo: email,
        subject: `Rétractation à traiter : ${nom} (${reference})`,
        html: enveloppeEmail({
          titre: 'Rétractation à traiter',
          siteUrl: SITE,
          contenuHtml:
            titreEmail('Nouvelle demande de rétractation') + recap +
            texteEmail('À traiter dans Admin › Rétractations. Remboursement au plus tard 14 jours après réception si la carte n’a pas été envoyée.'),
        }),
      }),
    ]);
    if (accuse.error || alerte.error) {
      // La demande est enregistrée : elle reste visible dans l'admin même si un email échoue
      console.error('Email de rétractation non envoyé', accuse.error || alerte.error);
    }

    return NextResponse.json({ success: true, reference, recue, emailEnvoye: !accuse.error });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Une erreur est survenue. Écrivez-nous à info@estalviar.com.' }, { status: 500 });
  }
}
