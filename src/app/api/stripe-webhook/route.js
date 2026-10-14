import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { traiterPaiementPanier, traiterPaiementContribution, libererPanierAbandonne } from '../../../lib/traiterPaiements';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe prévient directement le serveur quand un paiement réussit.
// Ainsi la commande est livrée même si le client ferme son navigateur avant la page de confirmation.
// Le traitement ne s'exécute qu'une fois : si la page de confirmation l'a déjà fait, rien ne se passe.
export async function POST(req) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook non configuré' }, { status: 503 });
  }

  let evenement;
  try {
    const corpsBrut = await req.text();
    evenement = stripe.webhooks.constructEvent(corpsBrut, req.headers.get('stripe-signature'), secret);
  } catch (e) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    if (
      evenement.type === 'checkout.session.completed' ||
      evenement.type === 'checkout.session.async_payment_succeeded'
    ) {
      const session = evenement.data.object;
      if (session.metadata?.type === 'panier') await traiterPaiementPanier(session);
      if (session.metadata?.type === 'contribution') await traiterPaiementContribution(session);
    }
    if (evenement.type === 'checkout.session.expired') {
      await libererPanierAbandonne(evenement.data.object);
    }
    return NextResponse.json({ recu: true });
  } catch (e) {
    console.error(e);
    // Code 500 : Stripe renverra l'événement plus tard
    return NextResponse.json({ error: 'Erreur de traitement' }, { status: 500 });
  }
}
