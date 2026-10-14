import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { JETON_VALIDE, emailExact } from '../../../../lib/newsletter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lien « Se désinscrire » en bas des emails de la newsletter
export async function GET(req) {
  const url = new URL(req.url);
  const jeton = url.searchParams.get('jeton') || '';
  const retour = (etat) => NextResponse.redirect(new URL(`/fr?newsletter=${etat}#newsletter`, url.origin));
  if (!JETON_VALIDE.test(jeton)) return retour('lien-invalide');

  const { data: inscrit } = await supabase
    .from('newsletter_inscrits').select('id, email').eq('jeton', jeton).maybeSingle();
  if (!inscrit) return retour('lien-invalide');

  await supabase.from('newsletter_inscrits')
    .update({ desinscrit_le: new Date().toISOString() }).eq('id', inscrit.id);
  // Son compte (s'il en a un) ne reçoit plus les emails non plus ; les points déjà offerts restent
  await supabase.from('profils')
    .update({ accepte_marketing: false }).ilike('email', emailExact(inscrit.email));

  return retour('desinscrit');
}
