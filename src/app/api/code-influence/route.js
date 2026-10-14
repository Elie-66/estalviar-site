import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';
import { evaluerCode } from '../../../lib/codeInfluence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST { code, articles: [{ marque, montant }] }
// → { valide, influenceuse, cashbackAbonne } ou { valide: false, error }
// Ne renvoie jamais de marge ni de commission au navigateur.
export async function POST(req) {
  try {
    const { code, articles } = await req.json();
    const client = await utilisateurConnecte(req);
    if (!Array.isArray(articles) || articles.length === 0 || articles.length > 20) {
      return NextResponse.json({ valide: false, error: 'Panier vide' }, { status: 400 });
    }

    const { data: catalogue } = await supabase.from('catalogue').select('slug, nom, actif');
    const articlesServeur = [];
    for (const a of articles) {
      const nom = String(a.marque || '').trim().toLowerCase();
      const carte = (catalogue || []).find((c) => c.nom.toLowerCase() === nom && c.actif);
      const montant = Number(a.montant);
      if (carte && Number.isFinite(montant) && montant > 0) {
        articlesServeur.push({ slug: carte.slug, montant });
      }
    }

    const resultat = await evaluerCode(code, articlesServeur, client?.id);
    if (!resultat.ok) return NextResponse.json({ valide: false, error: resultat.erreur });

    return NextResponse.json({
      valide: true,
      code: resultat.code.code,
      influenceuse: resultat.code.influenceuse,
      cashbackAbonne: resultat.cashbackAbonne,
      cartesConcernees: resultat.cartesConcernees, // null = tout le panier
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ valide: false, error: 'Erreur lors de la vérification du code' }, { status: 500 });
  }
}
