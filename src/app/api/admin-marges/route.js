import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAdmin } from "../../../lib/verifierAdmin";

// GET : toutes les marges (réservé à l'admin)
export async function GET(req) {
  if (!(await verifierAdmin(req))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("marges_marques")
    .select("slug, fournisseur, marge, montant_min_fournisseur, montant_max_fournisseur, valeurs_fixes");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ marges: data || [] });
}

// POST : créer ou modifier la marge d'une marque (réservé à l'admin)
export async function POST(req) {
  if (!(await verifierAdmin(req))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { slug, marge, fournisseur } = await req.json();
    const valeur = parseFloat(String(marge).replace(",", "."));

    if (!slug || isNaN(valeur) || valeur < 0 || valeur > 100) {
      return NextResponse.json({ error: "Marge invalide (entre 0 et 100)" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("marges_marques").upsert(
      {
        slug,
        marge: valeur,
        fournisseur: fournisseur || "tillo",
        mis_a_jour: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
