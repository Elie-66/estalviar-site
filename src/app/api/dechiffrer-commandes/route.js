import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';
import { supabaseAdmin, verifierAcces, journaliser } from '../../../lib/verifierAdmin';

// Réservé à l'admin. On ne déchiffre plus les codes envoyés par le navigateur :
// on relit les codes directement dans la base, à partir des numéros de commande.
export async function POST(req) {
  const acces = await verifierAcces(req, 'codes');
  if (!acces) {
    return NextResponse.json({ error: 'Vous n\'avez pas accès aux codes des cartes' }, { status: 403 });
  }

  try {
    const { items } = await req.json();
    const ids = (items || []).map((item) => item.id).filter(Boolean);
    if (ids.length === 0) return NextResponse.json({ resultats: [] });

    const { data: commandes, error } = await supabaseAdmin
      .from('commandes')
      .select('id, code')
      .in('id', ids);
    if (error) throw error;

    const resultats = (commandes || []).map((c) => {
      let code = null;
      if (c.code) {
        try {
          code = dechiffrerCode(c.code);
        } catch (e) {
          code = c.code; // ancien code non chiffré, on l'affiche tel quel
        }
      }
      return { id: c.id, code };
    });

    await journaliser(acces, 'afficher codes', { commandes: ids.length });
    return NextResponse.json({ resultats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
