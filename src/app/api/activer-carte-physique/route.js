import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { chiffrerCode, dechiffrerCode } from '../../../lib/chiffrement';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { code, email } = await req.json();
    const codeNormalise = code.trim().toUpperCase();
    const emailNormalise = email.toLowerCase();

    const ilYAQuinzeMinutes = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('tentatives_connexion')
      .select('*', { count: 'exact', head: true })
      .eq('email', `carte_${emailNormalise}`)
      .gte('created_at', ilYAQuinzeMinutes);

    if (count >= 5) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans 15 minutes.' }, { status: 429 });
    }

    const { data: cartes } = await supabase
      .from('cartes_physiques')
      .select('*');

    const carteTrouvee = (cartes || []).find((c) => {
      try {
        return dechiffrerCode(c.code) === codeNormalise;
      } catch (e) {
        return false;
      }
    });

    if (!carteTrouvee) {
      await supabase.from('tentatives_connexion').insert({ email: `carte_${emailNormalise}` });
      return NextResponse.json({ error: 'Code invalide.' }, { status: 404 });
    }

    if (carteTrouvee.statut === 'inactive') {
      await supabase
        .from('cartes_physiques')
        .update({ statut: 'active', email_lie: emailNormalise, liee_at: new Date().toISOString() })
        .eq('id', carteTrouvee.id);
    } else if (carteTrouvee.email_lie !== emailNormalise) {
      return NextResponse.json({ error: 'Cette carte est déjà liée à un autre compte.' }, { status: 403 });
    }

    return NextResponse.json({ success: true, solde: carteTrouvee.solde });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}