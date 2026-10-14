import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Infos PUBLIQUES d'une cagnotte (n'importe qui ayant le lien peut les voir).
// Aucune adresse email, aucun code de carte n'est renvoyé.
const CHAMPS_CAGNOTTE =
  "id, slug, beneficiaire, message, image, marque, background, texte_fonce, montant_collecte, montant_objectif, montant_libre, date_fin, statut, carte_choisie";

export async function GET(req) {
  try {
    const slug = new URL(req.url).searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug manquant" }, { status: 400 });

    const { data: cagnotte } = await supabase
      .from("cagnottes")
      .select(`${CHAMPS_CAGNOTTE}, email_beneficiaire`)
      .eq("slug", slug)
      .single();

    if (!cagnotte) return NextResponse.json({ cagnotte: null });

    const { data: contributions } = await supabase
      .from("contributions_cagnotte")
      .select("id, nom_contributeur, message, montant, created_at")
      .eq("cagnotte_id", cagnotte.id)
      .eq("statut", "payee")
      .order("created_at", { ascending: false });

    let commandes = [];
    if (cagnotte.statut === "cloturee") {
      const { data } = await supabase
        .from("commandes")
        .select("id, marque, montant")
        .eq("cagnotte_id", cagnotte.id);
      commandes = data || [];
    }

    // On indique seulement S'IL existe un email bénéficiaire, sans le révéler
    const { email_beneficiaire, ...cagnottePublique } = cagnotte;
    cagnottePublique.a_email_beneficiaire = !!email_beneficiaire;

    return NextResponse.json({
      cagnotte: cagnottePublique,
      contributions: contributions || [],
      commandes,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
