import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    const { data: commandes } = await supabase
      .from('commandes')
      .select('marque')
      .eq('statut', 'payee');

    const compteur = {};
    (commandes || []).forEach((c) => {
      const nom = c.marque.replace(/^Cagnotte\s*/i, '').trim();
      compteur[nom] = (compteur[nom] || 0) + 1;
    });

    const classement = Object.entries(compteur)
      .sort((a, b) => b[1] - a[1])
      .map(([nom]) => nom);

    return NextResponse.json({ classement });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ classement: [] });
  }
}