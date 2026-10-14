import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { enveloppeEmail, titreEmail, texteEmail } from '../../../lib/emailTemplate';
import { echapperHtml } from '../../../lib/designs';
import { EXPEDITEUR, SITE } from '../../../lib/emailCarte';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
// « 10 à 49 » → 10, « 1 000 et plus » → 1000, « Moins de 10 » → 1
const quantiteDepuisVolume = (volume) => {
  if (/^moins/i.test(volume)) return 1;
  const n = parseInt(String(volume).replace(/\s/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

export async function POST(req) {
  try {
    const corps = await req.json();

    // Champ piège : rempli uniquement par les robots → on fait semblant que tout va bien
    if (texte(corps.site, 200)) return NextResponse.json({ success: true });

    const entreprise = texte(corps.entreprise, 120);
    const contact = texte(corps.contact, 120);
    const email = texte(corps.email, 200);
    const telephone = texte(corps.telephone, 30);
    const occasion = texte(corps.occasion, 80);
    const volume = texte(corps.volume, 40);
    const besoin = texte(corps.message, 2000);

    if (!entreprise || !contact || !EMAIL_VALIDE.test(email)) {
      return NextResponse.json({ error: 'Merci de remplir l’entreprise, votre nom et un email valide.' }, { status: 400 });
    }

    // Anti-spam : 5 demandes maximum par heure et par adresse IP
    const ip =
      req.headers.get('x-nf-client-connection-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'inconnue';
    const cle = `pro_${ip}`;
    const depuis = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .gte('created_at', depuis);
    if (count >= 5) {
      return NextResponse.json({ error: 'Trop de demandes. Réessayez dans une heure ou écrivez-nous à info@estalviar.com.' }, { status: 429 });
    }
    await supabase.from('tentatives_connexion').insert({ email: cle });

    const message = [
      occasion && `Occasion : ${occasion}`,
      volume && `Bénéficiaires : ${volume}`,
      besoin,
    ].filter(Boolean).join('\n');

    const { error } = await supabase.from('demandes_pro').insert({
      entreprise,
      contact,
      email,
      telephone: telephone || null,
      quantite: volume ? quantiteDepuisVolume(volume) : null,
      message: message || null,
    });
    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Votre demande n’a pas pu être enregistrée, réessayez.' }, { status: 500 });
    }

    // Tout ce qui vient du formulaire est échappé avant d'être mis dans l'email
    const e = echapperHtml;
    const ligne = (titre, valeur) => texteEmail(`<strong>${titre} :</strong> ${valeur ? e(valeur).replace(/\n/g, '<br/>') : '—'}`);

    try {
      await resend.emails.send({
        from: EXPEDITEUR,
        to: 'info@estalviar.com',
        replyTo: email,
        subject: `Nouvelle demande pro : ${entreprise}`,
        html: enveloppeEmail({
          titre: 'Nouvelle demande de devis',
          siteUrl: SITE,
          contenuHtml:
            titreEmail('Nouvelle demande de devis') +
            ligne('Entreprise', entreprise) +
            ligne('Contact', contact) +
            ligne('Email', email) +
            ligne('Téléphone', telephone) +
            ligne('Occasion', occasion) +
            ligne('Bénéficiaires', volume) +
            ligne('Besoin', besoin),
        }),
      });

      // Accusé de réception au demandeur
      await resend.emails.send({
        from: EXPEDITEUR,
        to: email,
        replyTo: 'info@estalviar.com',
        subject: 'Votre demande de devis Estalviar',
        html: enveloppeEmail({
          titre: 'Votre demande de devis',
          siteUrl: SITE,
          contenuHtml:
            titreEmail('Merci pour votre demande') +
            texteEmail(`Bonjour ${e(contact)},`) +
            texteEmail(`Nous avons bien reçu votre demande de devis pour <strong>${e(entreprise)}</strong>. Nous revenons vers vous sous 48 h avec une proposition adaptée à votre besoin.`) +
            texteEmail('Une question d’ici là ? Répondez simplement à cet email.'),
        }),
      });
    } catch (erreurEmail) {
      // La demande est enregistrée (visible dans l'admin) même si un email échoue
      console.error('Email de demande pro non envoyé', erreurEmail);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Une erreur est survenue, réessayez.' }, { status: 500 });
  }
}
