import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { code } = await req.json();
    if (typeof code !== 'string' || code.length > 40) {
      return NextResponse.json({ trouve: false });
    }
    const codeNormalise = code.trim().toUpperCase();

    // Limite : 10 vérifications par adresse IP toutes les 15 minutes (empêche de tester des codes au hasard)
    const ip =
      req.headers.get('x-nf-client-connection-ip') ||
      (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() ||
      'inconnue';
    const cle = `solde_${ip}`;
    const depuis = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', cle)
      .gte('created_at', depuis);
    if (count >= 10) {
      return NextResponse.json({ error: 'Trop de vérifications. Réessayez dans 15 minutes.' }, { status: 429 });
    }
    await supabase.from('tentatives_connexion').insert({ email: cle });

    const { data: commandes } = await supabase
      .from('commandes')
      .select('marque, montant, statut, code')
      .not('code', 'is', null);

    const commandeTrouvee = (commandes || []).find((c) => {
      let codeClair = null;
      try {
        codeClair = dechiffrerCode(c.code);
      } catch (e) {
        codeClair = c.code;
      }
      return codeClair === codeNormalise;
    });

    if (!commandeTrouvee) {
      return NextResponse.json({ trouve: false });
    }

    return NextResponse.json({
      trouve: true,
      marque: commandeTrouvee.marque,
      montant: commandeTrouvee.montant,
      statut: commandeTrouvee.statut,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la vérification' }, { status: 500 });
  }
}