import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { trouverDesign } from '../../../lib/designs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texte = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

// Identifiant de cagnotte imprévisible (le lien de la cagnotte ne doit pas pouvoir être deviné)
function genererSlug() {
  return crypto.randomBytes(9).toString('base64url').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12) || crypto.randomUUID().slice(0, 12);
}

export async function POST(req) {
  try {
    const {
      marque, design, carteChoisie, beneficiaire, message,
      montantLibre, montantObjectif, dateFin, envoiBeneficiaire, emailCreateur, emailBeneficiaire,
    } = await req.json();

    // Vérifications côté serveur
    if (!EMAIL_VALIDE.test(emailCreateur || '')) {
      return NextResponse.json({ error: 'Email du créateur invalide' }, { status: 400 });
    }
    if (envoiBeneficiaire && !EMAIL_VALIDE.test(emailBeneficiaire || '')) {
      return NextResponse.json({ error: 'Email du bénéficiaire invalide' }, { status: 400 });
    }
    const nomBeneficiaire = texte(beneficiaire, 30);
    if (!nomBeneficiaire) {
      return NextResponse.json({ error: 'Nom du bénéficiaire manquant' }, { status: 400 });
    }

    const objectif = montantLibre ? null : Number(montantObjectif);
    if (!montantLibre && (!Number.isInteger(objectif) || objectif < 5 || objectif > 5000)) {
      return NextResponse.json({ error: 'Objectif invalide (entre 5 € et 5000 €)' }, { status: 400 });
    }

    const fin = new Date(`${dateFin}T23:59:59`);
    const dansUnAn = Date.now() + 366 * 24 * 3600 * 1000;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFin || '') || isNaN(fin) || fin.getTime() < Date.now() || fin.getTime() > dansUnAn) {
      return NextResponse.json({ error: 'Date de clôture invalide (dans les 12 prochains mois)' }, { status: 400 });
    }

    // La carte (logo, couleurs) est reconstruite à partir du catalogue, pas du navigateur
    let carte = null;
    if (carteChoisie) {
      const { data } = await supabase
        .from('catalogue')
        .select('nom, image, couleur, actif')
        .ilike('nom', texte(marque, 100))
        .maybeSingle();
      if (!data || !data.actif) {
        return NextResponse.json({ error: 'Enseigne indisponible' }, { status: 400 });
      }
      carte = data;
    }
    const d = trouverDesign(design, carte?.couleur);

    const slug = genererSlug();
    const { error } = await supabase.from('cagnottes').insert({
      slug,
      email_createur: emailCreateur.trim(),
      marque: carte ? carte.nom : 'Estalviar (à choisir)',
      image: carte ? carte.image : '/logos/estalviar-icone.svg',
      background: d.background,
      texte_fonce: d.texteFonce,
      design: d.nom,
      carte_choisie: !!carteChoisie,
      beneficiaire: nomBeneficiaire,
      message: texte(message, 40) || null,
      montant_libre: !!montantLibre,
      montant_objectif: objectif,
      date_fin: dateFin,
      envoi_beneficiaire: !!envoiBeneficiaire,
      email_beneficiaire: envoiBeneficiaire ? emailBeneficiaire.trim() : null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Impossible de créer la cagnotte' }, { status: 500 });
    }
    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
