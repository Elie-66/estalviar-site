import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAcces } from "../../../lib/verifierAdmin";

const arrondi = (n) => Math.round(n * 100) / 100;

// GET /api/admin-cashback            → soldes de tous les clients + totaux
// GET /api/admin-cashback?profil=ID  → historique d'un client
// Réservé à l'admin.
export async function GET(req) {
  if (!(await verifierAcces(req, "clients"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const profil = new URL(req.url).searchParams.get("profil");

  if (profil) {
    const { data, error } = await supabaseAdmin
      .from("cashback_mouvements")
      .select("type, montant, restant, statut, disponible_le, expire_le, description, created_at")
      .eq("profil_id", profil)
      .neq("statut", "libere")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ historique: data || [] });
  }

  // Supabase renvoie au maximum 1000 lignes par requête : on lit tout, page par page
  const data = [];
  for (let debut = 0; ; debut += 1000) {
    const { data: page, error } = await supabaseAdmin
      .from("cashback_mouvements")
      .select("profil_id, type, montant, restant, statut, disponible_le, expire_le")
      .order("created_at", { ascending: true })
      .range(debut, debut + 999);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    data.push(...(page || []));
    if (!page || page.length < 1000) break;
  }

  const maintenant = new Date();
  const dans30Jours = new Date(maintenant.getTime() + 30 * 86400000);
  const parClient = {};
  const totaux = { disponible: 0, enAttente: 0, expire30Jours: 0, gagne: 0, utilise: 0, expire: 0, annule: 0 };

  for (const m of data) {
    const c = (parClient[m.profil_id] ||= {
      disponible: 0, enAttente: 0, gagne: 0, utilise: 0, expire: 0, annule: 0, prochaineExpiration: null,
    });
    const montant = Number(m.montant) || 0;
    const restant = Number(m.restant) || 0;

    if (m.type === "gain") {
      c.gagne += montant;
      const disponibleLe = new Date(m.disponible_le);
      const expireLe = new Date(m.expire_le);
      if (restant > 0 && disponibleLe > maintenant) c.enAttente += restant;
      if (restant > 0 && disponibleLe <= maintenant && expireLe > maintenant) {
        c.disponible += restant;
        if (expireLe <= dans30Jours) totaux.expire30Jours += restant;
        if (!c.prochaineExpiration || expireLe < new Date(c.prochaineExpiration.date)) {
          c.prochaineExpiration = { montant: restant, date: m.expire_le };
        }
      }
    } else if (m.type === "utilisation" && m.statut === "confirme") {
      c.utilise += montant;
    } else if (m.type === "expiration") {
      c.expire += montant;
    } else if (m.type === "annulation" && m.statut === "actif") {
      c.annule += montant; // carte remboursée
    }
  }

  for (const c of Object.values(parClient)) {
    for (const cle of ["disponible", "enAttente", "gagne", "utilise", "expire", "annule"]) {
      c[cle] = arrondi(c[cle]);
      totaux[cle] += c[cle];
    }
  }
  for (const cle of Object.keys(totaux)) totaux[cle] = arrondi(totaux[cle]);

  return NextResponse.json({ parClient, totaux });
}
