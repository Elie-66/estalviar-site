import { NextResponse } from "next/server";
import { supabaseAdmin, accesAdmin, journaliser } from "../../../lib/verifierAdmin";
import { SECTIONS } from "../../../lib/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

// La personne a-t-elle, dans au moins une de ses sections, le droit sur cette table ?
function permis(acces, table, action) {
  if (!acces) return false;
  if (acces.proprietaire) return true;
  const niveau = action === "lire" ? "voir" : "modifier";
  return SECTIONS.some((s) => {
    const n = acces.sections[s.cle];
    if (!n || (niveau === "modifier" && n !== "modifier")) return false;
    return s.tables[niveau].includes(table);
  });
}

// GET /api/admin-donnees?table=articles_blog&tri=created_at&croissant=false&egal_statut=payee
// (les paramètres "egal_<colonne>" filtrent sur une valeur exacte)
export async function GET(req) {
  const acces = await accesAdmin(req);
  if (!acces) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const params = new URL(req.url).searchParams;
  const table = params.get("table");
  if (!autorise(table, "lire") || !permis(acces, table, "lire")) {
    return NextResponse.json({ error: "Vous n'avez pas accès à ces données" }, { status: 403 });
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
  const acces = await accesAdmin(req);
  if (!acces) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const { action, table, id, donnees } = await req.json();
    if (!autorise(table, action)) {
      return NextResponse.json({ error: "Action non autorisée" }, { status: 403 });
    }
    if (!permis(acces, table, action)) {
      const message = permis(acces, table, "lire")
        ? "Vous pouvez consulter cette section, mais pas la modifier"
        : "Vous n'avez pas accès à cette section";
      return NextResponse.json({ error: message }, { status: 403 });
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
    // Carte annulée : si son email est programmé chez Resend, on l'annule pour que le code ne parte pas
    if (table === "commandes" && action === "modifier" && ["annulee", "remboursee"].includes(donnees?.statut)) {
      const { data: carte } = await supabaseAdmin.from("commandes").select("email_id, email_statut").eq("id", id).maybeSingle();
      if (carte?.email_statut === "programme" && carte.email_id) {
        const { error: erreurAnnulation } = await resend.emails.cancel(carte.email_id);
        if (!erreurAnnulation) {
          await supabaseAdmin.from("commandes").update({ email_statut: "annule", email_maj_le: new Date().toISOString() }).eq("id", id);
        }
      }
    }
    await journaliser(acces, `${action} ${table}`, { id: id ?? null, champs: donnees ? Object.keys(donnees) : [] });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
