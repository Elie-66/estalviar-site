import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

function genererSlug() {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(req) {
  try {
    const {
      marque,
      image,
      background,
      texteFonce,
      design,
      carteChoisie,
      beneficiaire,
      message,
      montantLibre,
      montantObjectif,
      dateFin,
      envoiBeneficiaire,
      emailCreateur,
      emailBeneficiaire,
    } = await req.json();

    const slug = genererSlug();

    const { error } = await supabase.from('cagnottes').insert({
      slug,
      email_createur: emailCreateur,
      marque,
      image,
      background,
      texte_fonce: texteFonce,
      design,
      carte_choisie: carteChoisie,
      beneficiaire,
      message: message || null,
      montant_libre: montantLibre,
      montant_objectif: montantLibre ? null : montantObjectif,
      date_fin: dateFin,
      envoi_beneficiaire: envoiBeneficiaire,
      email_beneficiaire: emailBeneficiaire || null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, slug });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}