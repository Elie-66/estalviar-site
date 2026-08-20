import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { chiffrerCode } from '../../../lib/chiffrement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function genererCode() {
  const bloc = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${bloc()}-${bloc()}-${bloc()}-${bloc()}`;
}

export async function GET() {
  const { data } = await supabase
    .from('cartes_physiques')
    .select('id, solde, statut, email_lie, created_at')
    .order('created_at', { ascending: false });

  return NextResponse.json({ cartes: data || [] });
}

export async function POST(req) {
  try {
    const { nombre } = await req.json();
    const n = Math.min(Math.max(parseInt(nombre) || 1, 1), 100);

    const codesClairs = [];
    const lignesAInserer = [];

    for (let i = 0; i < n; i++) {
      const code = genererCode();
      codesClairs.push(code);
      lignesAInserer.push({ code: chiffrerCode(code), solde: 0, statut: 'inactive' });
    }

    const { error } = await supabase.from('cartes_physiques').insert(lignesAInserer);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ codes: codesClairs });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}