import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Supprime le compte du client CONNECTÉ (jeton de session), jamais un identifiant envoyé par le navigateur.
// Les commandes restent conservées (obligation comptable), sans lien avec un compte.
export async function POST(req) {
  try {
    const client = await utilisateurConnecte(req);
    if (!client) return NextResponse.json({ error: 'Non connecté' }, { status: 401 });

    await supabaseAdmin.from('beneficiaires').delete().eq('profil_id', client.id);
    await supabaseAdmin.from('profils').delete().eq('id', client.id);

    const { error } = await supabaseAdmin.auth.admin.deleteUser(client.id);
    if (error) {
      console.error(error);
      return NextResponse.json({ error: 'Suppression impossible' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Suppression impossible' }, { status: 500 });
  }
}
