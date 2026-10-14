import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { cagnotteId, nomContributeur, emailContributeur, montant, messageContribution, locale } = await req.json();
    const langue = ['fr', 'en', 'de', 'es', 'it'].includes(locale) ? locale : 'fr';

    // Vérifications côté serveur
    const montantNum = Number(montant);
    if (!Number.isInteger(montantNum) || montantNum < 1 || montantNum > 2000) {
      return NextResponse.json({ error: 'Montant invalide (entre 1 € et 2000 €)' }, { status: 400 });
    }
    const nom = typeof nomContributeur === 'string' ? nomContributeur.trim().slice(0, 40) : '';
    if (!nom) {
      return NextResponse.json({ error: 'Nom manquant' }, { status: 400 });
    }
    const email = typeof emailContributeur === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailContributeur.trim())
      ? emailContributeur.trim()
      : null;

    const { data: cagnotte } = await supabase
      .from('cagnottes')
      .select('id, slug, statut')
      .eq('id', cagnotteId)
      .single();
    if (!cagnotte || cagnotte.statut === 'cloturee' || cagnotte.statut === 'attente_choix') {
      return NextResponse.json({ error: 'Cette cagnotte n\'accepte plus de contributions' }, { status: 400 });
    }
    const slug = cagnotte.slug;

    const { data: contribution, error } = await supabase
      .from('contributions_cagnotte')
      .insert({
        cagnotte_id: cagnotte.id,
        nom_contributeur: nom,
        email_contributeur: email,
        montant: montantNum,
        message: typeof messageContribution === 'string' ? messageContribution.trim().slice(0, 60) || null : null,
        statut: 'en_attente',
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Impossible d\'enregistrer la contribution' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || 'https://estalviar.com';
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: `Contribution cagnotte — ${nom}` },
            unit_amount: montantNum * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: String(contribution.id),
      metadata: { type: 'contribution', contribution_id: String(contribution.id) },
      success_url: `${origin}/${langue}/cagnotte/${slug}?session_id={CHECKOUT_SESSION_ID}&contribution=${contribution.id}`,
      cancel_url: `${origin}/${langue}/cagnotte/${slug}`,
      managed_payments: { enabled: false },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}