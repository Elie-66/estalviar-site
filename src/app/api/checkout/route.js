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
    const { articles, emailAcheteur, locale } = await req.json();

    if (!articles || articles.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const { data: catalogue } = await supabase
      .from('catalogue')
      .select('nom, montant_min, montant_max, actif');

    for (const article of articles) {
      const carteReference = (catalogue || []).find(
        (c) => c.nom.toLowerCase() === article.marque.replace(/^Cagnotte\s*/i, '').trim().toLowerCase()
      );

      const montant = Number(article.montant);

      if (!Number.isFinite(montant) || montant <= 0) {
        return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
      }

      if (carteReference) {
        if (!carteReference.actif) {
          return NextResponse.json({ error: `${article.marque} n'est plus disponible` }, { status: 400 });
        }
        if (montant < carteReference.montant_min || montant > carteReference.montant_max) {
          return NextResponse.json(
            { error: `Montant invalide pour ${article.marque} (doit être entre ${carteReference.montant_min} € et ${carteReference.montant_max} €)` },
            { status: 400 }
          );
        }
      }
    }

    const line_items = articles.map((article) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Carte cadeau ${article.marque}`,
          description: article.beneficiaire ? `Pour ${article.beneficiaire}` : undefined,
        },
        unit_amount: Math.round(article.montant * 100),
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      customer_email: emailAcheteur,
      success_url: `${req.headers.get('origin')}/${locale}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/${locale}/panier`,
      managed_payments: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}