import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classerEnseignes } from "../../../lib/classement";
import {
  aujourdhuiParis, dansSelection, evenementDuMoment, prochaineOccurrence,
} from "../../../lib/evenements";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Jamais la marge, la notoriété ni le score au navigateur
const CHAMPS_PUBLICS = "slug, nom, categorie, image, couleur, montant_min, made_in_france";

// GET /api/evenement              → événement du moment (ou null) + sa sélection de marques
// GET /api/evenement?slug=noel    → cet événement précis, même hors période (lien direct)
export async function GET(req) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    const aujourdhui = aujourdhuiParis();

    const [{ data: evenements, error }, { data: cartes }, { data: lignesMarges }] = await Promise.all([
      supabase.from("evenements").select("*").eq("actif", true),
      supabase.from("catalogue").select(`${CHAMPS_PUBLICS}, etiquettes, notoriete, mise_en_avant`).eq("actif", true),
      supabase.from("marges_marques").select("slug, marge"),
    ]);
    if (error) throw error;

    let evenement = null;
    if (slug) {
      const trouve = (evenements || []).find((e) => e.slug === slug);
      if (trouve) evenement = { ...trouve, ...prochaineOccurrence(trouve, aujourdhui) };
    } else {
      evenement = evenementDuMoment(evenements || [], cartes || [], aujourdhui);
    }

    let selection = [];
    if (evenement) {
      const marges = {};
      (lignesMarges || []).forEach((m) => { marges[m.slug] = m.marge; });
      const cartesEvenement = (cartes || []).filter((c) => dansSelection(evenement, c));
      selection = classerEnseignes(cartesEvenement, marges, {}, aujourdhui)
        .map(({ etiquettes, notoriete, mise_en_avant, ...publique }) => publique);
    }

    return NextResponse.json(
      {
        evenement: evenement
          ? {
              slug: evenement.slug,
              nom: evenement.nom,
              accroche: evenement.accroche,
              description: evenement.description,
              date: evenement.date,
              joursRestants: evenement.joursRestants,
            }
          : null,
        cartes: selection,
      },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ evenement: null, cartes: [] });
  }
}
