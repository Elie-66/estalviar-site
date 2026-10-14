import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { JETON_VALIDE, emailExact } from '../../../../lib/newsletter';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Lien reçu par email : confirme l'inscription, puis renvoie vers l'accueil
export async function GET(req) {
  const url = new URL(req.url);
  const jeton = url.searchParams.get('jeton') || '';
  const retour = (etat) => NextResponse.redirect(new URL(`/fr?newsletter=${etat}#newsletter`, url.origin));
  if (!JETON_VALIDE.test(jeton)) return retour('lien-invalide');

  const { data: inscrit } = await supabase
    .from('newsletter_inscrits').select('*').eq('jeton', jeton).maybeSingle();
  if (!inscrit) return retour('lien-invalide');

  if (!inscrit.confirme_le || inscrit.desinscrit_le) {
    await supabase.from('newsletter_inscrits')
      .update({ confirme_le: new Date().toISOString(), desinscrit_le: null }).eq('id', inscrit.id);
  }

  // Il a déjà un compte avec cette adresse : on l'inscrit aux emails (25 points la première fois)
  await supabase.from('profils')
    .update({ accepte_marketing: true }).ilike('email', emailExact(inscrit.email));

  return retour('confirmee');
}
