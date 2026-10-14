import { NextResponse } from 'next/server';
import { traiterPaiementContribution } from '../../../lib/traiterPaiements';

// Appelée par la page cagnotte au retour du paiement.
// Le serveur vérifie que le paiement Stripe correspond bien à CETTE contribution et à son montant.
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
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la confirmation' }, { status: 500 });
  }
}
