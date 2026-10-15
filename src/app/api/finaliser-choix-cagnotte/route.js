import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import { EXPEDITEUR, boutonVoirCarte } from '../../../lib/emailCarte';
import { chiffrerCode } from '../../../lib/chiffrement';
import { trouverDesign, echapperHtml } from '../../../lib/designs';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://estalviar.com';
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

function genererCode() {
  const bloc = () => Array.from({ length: 4 }, () => ALPHABET[crypto.randomInt(ALPHABET.length)]).join('');
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

function blocCarte({ marque, image, background, texteFonce, montant, code, origin, beneficiaire }) {
  const logoUrl = `${origin}${image}`;
  const couleurTexte = texteFonce ? '#12172B' : '#F6F2E9';
  const couleurTexteAtt = texteFonce ? 'rgba(18,23,43,0.6)' : 'rgba(246,242,233,0.6)';
  return `
    <div style="border-radius: 16px; padding: 28px; background: ${background}; border: 1px solid rgba(201,162,39,0.3); margin-bottom: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <img src="${logoUrl}" alt="${echapperHtml(marque)}" height="28" style="display:block;" />
        <span style="color:#C9A227; font-size:10px; letter-spacing:2px; text-transform:uppercase;">Estalviar</span>
      </div>
      <p style="color:${couleurTexte}; font-size:14px; margin:20px 0 0;">Pour ${echapperHtml(beneficiaire)}</p>
      <div style="height:1px; background:rgba(201,162,39,0.3); margin:16px 0;"></div>
      <p style="color:${couleurTexte}; font-size:36px; font-weight:bold; margin:0;">
        ${montant} <span style="color:#C9A227; font-size:18px;">€</span>
      </p>
      <p style="color:${couleurTexteAtt}; font-size:11px; letter-spacing:2px; margin-top:16px;">${code}</p>
    </div>
  `;
}

export async function POST(req) {
  try {
    const { cagnotteId, jeton, cartes: cartesDemandees } = await req.json();
    const origin = SITE;

    if (!Array.isArray(cartesDemandees) || cartesDemandees.length === 0 || cartesDemandees.length > 10) {
      return NextResponse.json({ error: 'Choix de cartes invalide' }, { status: 400 });
    }

    const { data: existante } = await supabase
      .from('cagnottes')
      .select('id, statut, jeton_choix, montant_collecte')
      .eq('id', cagnotteId)
      .maybeSingle();

    if (!existante || existante.statut !== 'attente_choix') {
      return NextResponse.json({ error: 'Cagnotte non disponible' }, { status: 400 });
    }

    // Seule la personne qui a reçu le lien secret par email peut choisir les cartes
    const jetonAttendu = existante.jeton_choix || '';
    const jetonRecu = typeof jeton === 'string' ? jeton : '';
    const jetonValide =
      jetonAttendu.length > 0 &&
      jetonRecu.length === jetonAttendu.length &&
      crypto.timingSafeEqual(Buffer.from(jetonRecu), Buffer.from(jetonAttendu));
    if (!jetonValide) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 403 });
    }

    // Les cartes sont reconstruites à partir du catalogue (logo, couleurs), pas du navigateur
    const { data: catalogue } = await supabase
      .from('catalogue')
      .select('slug, nom, image, couleur, actif');
    const cartes = [];
    for (const c of cartesDemandees) {
      const ref = (catalogue || []).find(
        (x) => x.actif && (x.slug === c.slug || x.nom.toLowerCase() === String(c.marque || '').toLowerCase())
      );
      const montant = Number(c.montant);
      if (!ref || !Number.isInteger(montant) || montant < 1) {
        return NextResponse.json({ error: 'Choix de cartes invalide' }, { status: 400 });
      }
      const d = trouverDesign(c.design, ref.couleur);
      cartes.push({ marque: ref.nom, image: ref.image, background: d.background, texteFonce: d.texteFonce, montant });
    }

    const totalDemande = cartes.reduce((s, c) => s + c.montant, 0);
    if (totalDemande !== Number(existante.montant_collecte)) {
      return NextResponse.json({ error: 'Montant total incorrect' }, { status: 400 });
    }

    // Réservation : le choix ne peut être validé qu'une seule fois
    const { data: cagnotte } = await supabase
      .from('cagnottes')
      .update({ statut: 'cloture_en_cours', jeton_choix: null })
      .eq('id', cagnotteId)
      .eq('statut', 'attente_choix')
      .select('*')
      .maybeSingle();
    if (!cagnotte) {
      return NextResponse.json({ error: 'Choix déjà effectué' }, { status: 400 });
    }

    const { data: participants } = await supabase
      .from('contributions_cagnotte')
      .select('nom_contributeur, montant')
      .eq('cagnotte_id', cagnotteId)
      .eq('statut', 'payee');

    const destinataire = cagnotte.envoi_beneficiaire ? cagnotte.email_beneficiaire : cagnotte.email_createur;

    let blocsHtml = '';
    const nomsMarques = [];

    for (const carte of cartes) {
      const code = genererCode();
      nomsMarques.push(carte.marque);

      const { data: carteEnregistree } = await supabase.from('commandes').insert({
        email_acheteur: cagnotte.email_createur,
        email_destinataire: destinataire,
        marque: `Cagnotte ${carte.marque}`,
        montant: carte.montant,
        beneficiaire: cagnotte.beneficiaire,
        message: cagnotte.message,
        design: 'Marque',
        code: chiffrerCode(code),
        statut: 'payee',
        cagnotte_id: cagnotte.id,
      }).select().single();

      blocsHtml += blocCarte({
        marque: carte.marque,
        image: carte.image,
        background: carte.background,
        texteFonce: carte.texteFonce,
        montant: carte.montant,
        code,
        origin,
        beneficiaire: cagnotte.beneficiaire,
      }) + boutonVoirCarte(carteEnregistree?.jeton_carte);
    }

    let htmlComplet = `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 24px; background:#0d1022;">
        ${blocsHtml}
    `;

    if (participants && participants.length > 0) {
      htmlComplet += `
        <div style="color:#F6F2E9; font-family: sans-serif; margin-top: 20px;">
          <p style="font-size:12px; text-transform:uppercase; letter-spacing:1px; color:#C9A227;">Ont contribué</p>
          <ul style="padding-left:18px; font-size:13px;">
            ${participants.map((p) => `<li>${echapperHtml(p.nom_contributeur)} — ${p.montant} €</li>`).join('')}
          </ul>
        </div>
      `;
    }

    htmlComplet += `</div>`;

    await resend.emails.send({
      from: EXPEDITEUR,
      to: destinataire,
      subject: `Vos cartes cadeaux (${nomsMarques.join(', ')})`,
      html: htmlComplet,
    });

    await supabase.from('cagnottes').update({ statut: 'cloturee', marque: nomsMarques.join(', ') }).eq('id', cagnotteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de l\'envoi des cartes' }, { status: 500 });
  }
}