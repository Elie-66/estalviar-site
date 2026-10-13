import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';
import { supabaseAdmin, verifierAdmin } from '../../../lib/verifierAdmin';

// Réservé à l'admin. On ne déchiffre plus les codes envoyés par le navigateur :
// on relit les codes directement dans la base, à partir des numéros de commande.
export async function POST(req) {
  if (!(await verifierAdmin(req))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

    return NextResponse.json({ resultats });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
