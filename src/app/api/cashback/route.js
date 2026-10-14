import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';
import { calculerCashbackUtilisable, REGLES_CASHBACK } from '../../../lib/cashback';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// GET /api/cashback?total=75 → solde du client connecté (+ montant utilisable pour ce total)
export async function GET(req) {
  const client = await utilisateurConnecte(req);
  if (!client) return NextResponse.json({ connecte: false });

  const total = Number(new URL(req.url).searchParams.get('total')) || 0;

  const [{ data: solde }, { data: mouvements }] = await Promise.all([
    supabase.rpc('cashback_solde', { p_profil: client.id }),
    supabase
      .from('cashback_mouvements')
      .select('type, montant, restant, statut, disponible_le, expire_le, description, created_at')
      .eq('profil_id', client.id)
      .neq('statut', 'libere')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const disponible = Number(solde?.[0]?.disponible) || 0;
  const enAttente = Number(solde?.[0]?.en_attente) || 0;
  const maintenant = new Date();

  const prochainesExpirations = (mouvements || [])
    .filter((m) => m.type === 'gain' && Number(m.restant) > 0 && new Date(m.disponible_le) <= maintenant)
    .sort((a, b) => new Date(a.expire_le) - new Date(b.expire_le))
    .slice(0, 3)
    .map((m) => ({ montant: Number(m.restant), expire_le: m.expire_le }));

  const prochainsDeblocages = (mouvements || [])
    .filter((m) => m.type === 'gain' && Number(m.restant) > 0 && new Date(m.disponible_le) > maintenant)
    .map((m) => ({ montant: Number(m.restant), disponible_le: m.disponible_le }));

  return NextResponse.json({
    connecte: true,
    disponible,
    enAttente,
    utilisable: total ? calculerCashbackUtilisable(total, disponible) : 0,
    regles: {
      commandeMinimum: REGLES_CASHBACK.commandeMinimum,
      plafondPourcent: Math.round(REGLES_CASHBACK.plafondCommande * 100),
      joursAttente: REGLES_CASHBACK.joursAttente,
    },
    prochainesExpirations,
    prochainsDeblocages,
    historique: (mouvements || []).map((m) => ({
      type: m.type,
      montant: Number(m.montant),
      description: m.description,
      date: m.created_at,
    })),
  });
}
