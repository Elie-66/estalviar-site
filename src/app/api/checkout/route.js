import Stripe from 'stripe';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const { articles, emailAcheteur, locale } = await req.json();

    const line_items = articles.map((article) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Carte cadeau ${article.marque}`,
          description: article.beneficiaire ? `Pour ${article.beneficiaire}` : undefined,
        },
        unit_amount: article.montant * 100,
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