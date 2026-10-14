import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAdmin } from "../../../lib/verifierAdmin";

// Route unique pour les pages admin : lecture et écriture des tables protégées.
// Seules les tables et actions listées ici sont autorisées.
const AUTORISATIONS = {
  catalogue: ["lire", "ajouter", "modifier"],
  articles_blog: ["lire", "ajouter", "modifier", "supprimer"],
  occasions: ["lire", "ajouter", "modifier", "supprimer"],
  commandes: ["lire", "modifier"],
  profils: ["lire"],
  cagnottes: ["lire"],
  contributions_cagnotte: ["lire"],
  demandes_pro: ["lire"],
  demandes_contact: ["lire"],
  codes_influence: ["lire", "ajouter", "modifier"],
  utilisations_code: ["lire", "modifier"],
  evenements: ["lire", "ajouter", "modifier", "supprimer"],
  demandes_retractation: ["lire", "modifier"],
};

function autorise(table, action) {
  return AUTORISATIONS[table]?.includes(action);
}

// GET /api/admin-donnees?table=articles_blog&tri=created_at&croissant=false&egal_statut=payee
// (les paramètres "egal_<colonne>" filtrent sur une valeur exacte)
export async function GET(req) {
  if (!(await verifierAdmin(req))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const table = params.get("table");
  if (!autorise(table, "lire")) {
    return NextResponse.json({ error: "Table non autorisée" }, { status: 403 });
  }

  let requete = supabaseAdmin.from(table).select("*");
  for (const [cle, valeur] of params.entries()) {
    const colonne = cle.startsWith("egal_") ? cle.slice(5) : null;
    if (colonne && /^[a-z_]+$/.test(colonne)) requete = requete.eq(colonne, valeur);
  }
  const tri = params.get("tri");
  if (tri && /^[a-z_]+$/.test(tri)) {
    requete = requete.order(tri, { ascending: params.get("croissant") !== "false" });
  }

  const { data, error } = await requete;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ donnees: data || [] });
}

// POST { action: "ajouter" | "modifier" | "supprimer", table, id?, donnees? }
export async function POST(req) {
  if (!(await verifierAdmin(req))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { action, table, id, donnees } = await req.json();
    if (!autorise(table, action)) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }

    let resultat;
    if (action === "ajouter") {
      resultat = await supabaseAdmin.from(table).insert(donnees);
    } else if (action === "modifier") {
      if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
      resultat = await supabaseAdmin.from(table).update(donnees).eq("id", id);
    } else if (action === "supprimer") {
      if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });
      resultat = await supabaseAdmin.from(table).delete().eq("id", id);
    }

    if (resultat.error) {
      return NextResponse.json({ error: resultat.error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
