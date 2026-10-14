import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';
import { verifierAdmin } from '../../../lib/verifierAdmin';
import {
  EXPEDITEUR, articleDepuisCommande, construireEmailCarte, dateHeureParis,
} from '../../../lib/emailCarte';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const corps = await req.json();
    const { commandeId, cible } = corps;
    let destinataireOverride = null;

    const { data: commande } = await supabase
      .from('commandes')
      .select('*')
      .eq('id', commandeId)
      .single();

    if (!commande) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    // SÉCURITÉ : la carte ne peut être renvoyée qu'à une adresse déjà liée à cette commande
    // (acheteur, destinataire, ou créateur / bénéficiaire de la cagnotte).
    // Seul l'admin peut choisir librement le destinataire.
    const estAdmin = !!(await verifierAdmin(req));

    // Une carte programmée ne part pas avant sa date (sinon la surprise est gâchée) — sauf par l'admin
    const quand = dateHeureParis(commande.date_envoi, commande.heure_envoi);
    const pasEncoreEnvoyee = ['a_programmer', 'envoi_en_cours'].includes(commande.statut) || (quand && quand > new Date());
    if (pasEncoreEnvoyee && !estAdmin) {
      return NextResponse.json(
        { error: `Cette carte n'a pas encore été envoyée (envoi prévu le ${quand ? quand.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }) : 'plus tard'}).` },
        { status: 409 }
      );
    }
    const adressesAutorisees = [commande.email_acheteur, commande.email_destinataire];
    if (commande.cagnotte_id) {
      const { data: cagnotte } = await supabase
        .from('cagnottes')
        .select('email_createur, email_beneficiaire')
        .eq('id', commande.cagnotte_id)
        .single();
      if (cagnotte) adressesAutorisees.push(cagnotte.email_createur, cagnotte.email_beneficiaire);
    }
    const autorisees = adressesAutorisees.filter(Boolean).map((a) => a.toLowerCase());

    // Boutons de la page cagnotte : on choisit une cible, jamais une adresse libre
    if (cible === 'createur' || cible === 'beneficiaire') {
      if (!commande.cagnotte_id) {
        return NextResponse.json({ error: 'Cible invalide' }, { status: 400 });
      }
      const { data: cagnotteCible } = await supabase
        .from('cagnottes')
        .select('email_createur, email_beneficiaire')
        .eq('id', commande.cagnotte_id)
        .single();
      destinataireOverride = cible === 'createur' ? cagnotteCible?.email_createur : cagnotteCible?.email_beneficiaire;
      if (!destinataireOverride) {
        return NextResponse.json({ error: 'Destinataire introuvable' }, { status: 404 });
      }
    }

    // L'admin peut toujours indiquer une adresse précise
    if (estAdmin && corps.destinataireOverride) destinataireOverride = corps.destinataireOverride;

    if (destinataireOverride && !estAdmin && !autorisees.includes(String(destinataireOverride).toLowerCase())) {
      return NextResponse.json({ error: 'Destinataire non autorisé' }, { status: 403 });
    }

    const destinataire = destinataireOverride || commande.email_destinataire || commande.email_acheteur;

    let codeClair = '';
    if (commande.code) {
      try {
        codeClair = dechiffrerCode(commande.code);
      } catch (e) {
        codeClair = commande.code;
      }
    }

    const article = await articleDepuisCommande(supabase, commande);
    const { error: erreurEnvoi } = await resend.emails.send({
      from: EXPEDITEUR,
      to: destinataire,
      subject: `Votre carte cadeau ${article.marque} (renvoi)`,
      html: construireEmailCarte({ article, code: codeClair, mention: 'Ceci est un renvoi de votre carte cadeau.' }),
    });
    if (erreurEnvoi) {
      console.error('Renvoi refusé par Resend', commande.id, erreurEnvoi);
      return NextResponse.json({ error: "L'email n'a pas pu être envoyé" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors du renvoi' }, { status: 500 });
  }
}