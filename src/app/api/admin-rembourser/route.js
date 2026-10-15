import { NextResponse } from "next/server";
import { supabaseAdmin, verifierAcces } from "../../../lib/verifierAdmin";
import { etatEnvoi, partPayeeParCarte, executerRemboursement, demanderRemboursement } from "../../../lib/remboursement";

const arrondi = (n) => Math.round(Number(n) * 100) / 100;

// GET ?commande=… → ce qui serait remboursé (pour la fenêtre de confirmation)
export async function GET(req) {
  const acces = await verifierAcces(req, "commandes", "modifier");
  if (!acces) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("commande");
  const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", id).maybeSingle();
  if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  const [{ montant, panier }, { data: demande }] = await Promise.all([
    partPayeeParCarte(commande),
    supabaseAdmin.from("demandes_remboursement").select("id, demande_par, cree_le").eq("commande_id", String(commande.id)).eq("statut", "en_attente").maybeSingle(),
  ]);
  return NextResponse.json({
    etatEnvoi: etatEnvoi(commande),
    montantCarte: montant,
    partCashback: arrondi(Number(commande.montant) - montant),
    stripePossible: !!panier?.stripe_session_id,
    dejaRembourse: commande.statut === "remboursee",
    // Seul le propriétaire rembourse directement ; les autres font une demande à valider
    validationRequise: !acces.proprietaire,
    demandeEnAttente: demande || null,
  });
}

// POST { commandeId, viaStripe, malgreEnvoi, motif }
// → propriétaire : remboursement immédiat ; autre membre : demande envoyée au propriétaire pour validation
export async function POST(req) {
  const acces = await verifierAcces(req, "commandes", "modifier");
  if (!acces) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const { commandeId, viaStripe, malgreEnvoi, motif } = await req.json();
    const { data: commande } = await supabaseAdmin.from("commandes").select("*").eq("id", commandeId).maybeSingle();
    if (!commande) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });

    const resultat = acces.proprietaire
      ? await executerRemboursement({ commande, viaStripe, malgreEnvoi, acces })
      : await demanderRemboursement({ commande, viaStripe, malgreEnvoi, motif, acces });
    if (!resultat.ok) return NextResponse.json({ error: resultat.erreur, codeEnvoye: resultat.codeEnvoye }, { status: resultat.code || 400 });
    return NextResponse.json(resultat);
  } catch (e) {
    console.error("Remboursement", e);
    const message = e?.type?.startsWith?.("Stripe") ? `Stripe a refusé le remboursement : ${e.message}` : "Le remboursement n'a pas pu être fait";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
