import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAdmin } from "../../../lib/verifierAdmin";
import { dateHeureParis } from "../../../lib/emailCarte";

const PERIODES = [1, 7, 30, 90, 365];

// GET /api/admin-audience?jours=30 → statistiques de la période + celles de la période précédente (pour comparer)
export async function GET(req) {
  if (!(await verifierAdmin(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const jours = Number(new URL(req.url).searchParams.get("jours"));
  const n = PERIODES.includes(jours) ? jours : 30;

  // La période se termine à la fin d'aujourd'hui (heure de Paris)
  const aujourdhui = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const fin = new Date(dateHeureParis(aujourdhui, "00:00").getTime() + 86400000);
  const debut = new Date(fin.getTime() - n * 86400000);
  const debutAvant = new Date(debut.getTime() - n * 86400000);

  const [actuelle, precedente] = await Promise.all([
    supabaseAdmin.rpc("stats_visites", { p_debut: debut.toISOString(), p_fin: fin.toISOString() }),
    supabaseAdmin.rpc("stats_visites", { p_debut: debutAvant.toISOString(), p_fin: debut.toISOString() }),
  ]);
  if (actuelle.error) return NextResponse.json({ error: actuelle.error.message }, { status: 500 });

  const p = precedente.data || {};
  return NextResponse.json({
    jours: n,
    stats: actuelle.data,
    avant: { visiteurs: p.visiteurs || 0, visites: p.visites || 0, pages: p.pages || 0, commandes: p.commandes || 0, chiffre: p.chiffre || 0 },
  });
}
