import { NextResponse } from "next/server";
import { supabaseAdmin, verifierProprietaire, journaliser } from "../../../lib/verifierAdmin";
import { CLES_SECTIONS, estProprietaire } from "../../../lib/admin";

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Gestion de l'équipe : réservé au propriétaire
// GET → membres + 100 dernières actions du journal
export async function GET(req) {
  if (!(await verifierProprietaire(req))) return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 403 });
  const [{ data: membres, error }, { data: journal }] = await Promise.all([
    supabaseAdmin.from("equipe_admin").select("email, sections, ajoute_le, modifie_le").order("ajoute_le"),
    supabaseAdmin.from("journal_admin").select("cree_le, email, action, details").order("cree_le", { ascending: false }).limit(100),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ membres: membres || [], journal: journal || [] });
}

// POST { email, sections } → ajoute ou modifie un membre
export async function POST(req) {
  const acces = await verifierProprietaire(req);
  if (!acces) return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 403 });

  const { email: brut, sections: demandees } = await req.json().catch(() => ({}));
  const email = String(brut || "").trim().toLowerCase();
  if (!EMAIL_VALIDE.test(email)) return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  if (estProprietaire(email)) return NextResponse.json({ error: "Le propriétaire a déjà accès à tout" }, { status: 400 });

  // On ne garde que des sections connues et des niveaux valides
  const sections = Object.fromEntries(
    Object.entries(demandees || {}).filter(([cle, n]) => CLES_SECTIONS.includes(cle) && ["voir", "modifier"].includes(n))
  );
  if (Object.keys(sections).length === 0) {
    return NextResponse.json({ error: "Cochez au moins une section (ou retirez la personne de l'équipe)" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("equipe_admin")
    .upsert({ email, sections, modifie_le: new Date().toISOString() }, { onConflict: "email" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await journaliser(acces, "modifier accès", { membre: email, sections });
  return NextResponse.json({ ok: true });
}

// DELETE ?email=… → retire un membre
export async function DELETE(req) {
  const acces = await verifierProprietaire(req);
  if (!acces) return NextResponse.json({ error: "Réservé au propriétaire" }, { status: 403 });
  const email = String(new URL(req.url).searchParams.get("email") || "").trim().toLowerCase();
  const { error } = await supabaseAdmin.from("equipe_admin").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await journaliser(acces, "retirer accès", { membre: email });
  return NextResponse.json({ ok: true });
}
