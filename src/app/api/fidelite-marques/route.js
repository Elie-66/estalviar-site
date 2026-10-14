import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { PALIERS, margeEligible } from '../../../lib/cashback';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Page Fidélité : pour chaque palier, les enseignes qui y ouvrent droit au cashback.
// On ne renvoie JAMAIS les marges ni les taux : seulement les enseignes et un multiplicateur
// (« le cashback Or vaut 1,25 fois celui d'Argent »).
export async function GET() {
  try {
    const [{ data: cartes }, { data: marges }] = await Promise.all([
      supabase.from('catalogue').select('slug, nom, image, notoriete, ordre').eq('actif', true).order('ordre', { ascending: true }),
      supabase.from('marges_marques').select('slug, marge'),
    ]);
    const margeParSlug = new Map((marges || []).map((m) => [m.slug, m.marge]));
    const eligibles = (cartes || []).filter((c) => margeEligible(margeParSlug.get(c.slug)));

    const base = PALIERS.find((p) => p.taux > 0)?.taux || 1;
    const dejaVues = new Set();
    const paliers = PALIERS.map((p) => {
      // Enseignes débloquées À CE palier (en plus de celles des paliers précédents)
      const nouvelles = eligibles.filter((c) => p.notorietes.includes(c.notoriete || 'peu') && !dejaVues.has(c.slug));
      nouvelles.forEach((c) => dejaVues.add(c.slug));
      const avecLogo = nouvelles.filter((c) => c.image);
      return {
        nom: p.nom,
        seuil: p.seuil,
        multiplicateur: p.taux ? Math.round((p.taux / base) * 100) / 100 : 0,
        nouvelles: nouvelles.length,
        total: dejaVues.size * (p.taux > 0 ? 1 : 0),
        exemples: (avecLogo.length ? avecLogo : nouvelles).slice(0, 6).map(({ slug, nom, image }) => ({ slug, nom, image })),
      };
    });

    return NextResponse.json({ paliers }, { headers: { 'Cache-Control': 'public, s-maxage=3600' } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ paliers: [] }, { status: 500 });
  }
}
