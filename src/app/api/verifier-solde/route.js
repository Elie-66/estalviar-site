import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { dechiffrerCode } from '../../../lib/chiffrement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { code } = await req.json();
    const codeNormalise = code.trim().toUpperCase();

    const { data: commandes } = await supabase
      .from('commandes')
      .select('*')
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}