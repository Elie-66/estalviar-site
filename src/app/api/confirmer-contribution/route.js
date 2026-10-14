import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { traiterPaiementContribution, emailExact } from '../../../lib/traiterPaiements';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Appelée par la page cagnotte au retour du paiement.
// Le serveur vérifie que le paiement Stripe correspond bien à CETTE contribution et à son montant.
// Il renvoie de quoi remercier le participant (et l'inviter à créer un compte s'il n'en a pas).
export async function POST(req) {
  try {
    const { sessionId, contributionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Paiement manquant' }, { status: 400 });
    }

    const resultat = await traiterPaiementContribution(sessionId, contributionId);
    if (!resultat.ok) {
      return NextResponse.json({ error: resultat.erreur }, { status: resultat.code || 400 });
    }

    // Ici, le paiement a été vérifié : il appartient bien à cette contribution
    const { data: contribution } = await supabase
      .from('contributions_cagnotte')
      .select('montant, email_contributeur, statut')
      .eq('id', contributionId)
      .maybeSingle();

    let compteExiste = false;
    if (contribution?.email_contributeur) {
      const { data: profil } = await supabase
        .from('profils')
        .select('id')
        .ilike('email', emailExact(contribution.email_contributeur))
        .maybeSingle();
      compteExiste = !!profil;
    }

    return NextResponse.json({
      success: true,
      merci: contribution && contribution.statut === 'payee'
        ? {
            montant: Number(contribution.montant),
            email: contribution.email_contributeur || null,
            compteExiste,
          }
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
  }
}
