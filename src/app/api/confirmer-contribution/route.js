import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { sessionId, contributionId } = await req.json();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 });
    }

    const { data: contribution } = await supabase
      .from('contributions_cagnotte')
      .select('*')
      .eq('id', contributionId)
      .single();

    if (!contribution || contribution.statut === 'payee') {
      return NextResponse.json({ success: true });
    }

    await supabase
      .from('contributions_cagnotte')
      .update({ statut: 'payee' })
      .eq('id', contributionId);

    const { data: cagnotte } = await supabase
      .from('cagnottes')
      .select('*')
      .eq('id', contribution.cagnotte_id)
      .single();

    const nouveauMontant = (cagnotte.montant_collecte || 0) + contribution.montant;
    const complete = nouveauMontant >= cagnotte.montant_objectif;

    await supabase
      .from('cagnottes')
      .update({
        montant_collecte: nouveauMontant,
        statut: complete ? 'complete' : 'ouverte',
      })
      .eq('id', cagnotte.id);

    if (contribution.email_contributeur) {
      await supabase.from('commandes').insert({
        email_acheteur: contribution.email_contributeur,
        marque: `Cagnotte ${cagnotte.marque}`,
        montant: contribution.montant,
        beneficiaire: cagnotte.beneficiaire,
        message: contribution.message || null,
        design: cagnotte.design,
        statut: 'payee',
      });

      const { data: profilExistant } = await supabase
        .from('profils')
        .select('id, points')
        .eq('email', contribution.email_contributeur)
        .maybeSingle();

      if (profilExistant) {
        await supabase
          .from('profils')
          .update({ points: (profilExistant.points || 0) + contribution.montant })
          .eq('id', profilExistant.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}