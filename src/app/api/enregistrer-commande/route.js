import { NextResponse } from 'next/server';
import { traiterPaiementPanier } from '../../../lib/traiterPaiements';

// Appelée par la page de confirmation après le paiement.
// Le navigateur n'envoie plus que l'identifiant de paiement Stripe :
// les cartes livrées sont celles du panier validé et enregistré par le serveur.
export async function POST(req) {
  try {
    const { sessionId } = await req.json();
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'Paiement manquant' }, { status: 400 });
    }

    const resultat = await traiterPaiementPanier(sessionId);
    if (!resultat.ok) {
      return NextResponse.json({ error: resultat.erreur }, { status: resultat.code || 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
  }
}
