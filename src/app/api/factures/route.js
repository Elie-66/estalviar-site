import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAcces } from "../../../lib/verifierAdmin";
import { utilisateurConnecte } from "../../../lib/utilisateurServeur";

// « _ » et « % » sont des jokers dans ilike : on les neutralise
const emailExact = (email) => String(email).replace(/[\\%_]/g, (c) => `\\${c}`);

const COLONNES = "numero, emise_le, type, email_client, client, lignes, total, paye_cashback, paye_carte, facture_origine";

// GET /api/factures            → les factures du client connecté
// GET /api/factures?admin=1    → toutes les factures (admin uniquement)
export async function GET(req) {
  const admin = new URL(req.url).searchParams.get("admin") === "1";

  if (admin) {
    if (!(await verifierAcces(req, "factures"))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { data, error } = await supabaseAdmin.from("factures").select(COLONNES).order("emise_le", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ factures: data || [] });
  }

  const client = await utilisateurConnecte(req);
  if (!client?.email) return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  const { data, error } = await supabaseAdmin
    .from("factures")
    .select("numero, emise_le, type, total, lignes")
    .ilike("email_client", emailExact(client.email))
    .order("emise_le", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ factures: data || [] });
}
