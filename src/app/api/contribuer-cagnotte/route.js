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
    const { cagnotteId, slug, nomContributeur, emailContributeur, montant, messageContribution, locale } = await req.json();

    const { data: contribution, error } = await supabase
      .from('contributions_cagnotte')
      .insert({
        cagnotte_id: cagnotteId,
        nom_contributeur: nomContributeur,
        email_contributeur: emailContributeur || null,
        montant,
        message: messageContribution || null,
        statut: 'en_attente',
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Contribution cagnotte — ${nomContributeur}` },
            unit_amount: montant * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/${locale}/cagnotte/${slug}?session_id={CHECKOUT_SESSION_ID}&contribution=${contribution.id}`,
      cancel_url: `${req.headers.get('origin')}/${locale}/cagnotte/${slug}`,
      managed_payments: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}