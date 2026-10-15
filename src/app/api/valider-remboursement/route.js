import { NextResponse } from "next/server";
import { supabaseAdmin, verifierProprietaire } from "../../../lib/verifierAdmin";
import { demandeDepuisLien, validerDemande, refuserDemande } from "../../../lib/remboursement";

// Validation d'une demande de remboursement par le propriétaire :
// soit avec le lien secret reçu par email, soit connecté en propriétaire dans l'admin.
async function retrouver(req, id, jeton) {
  if (jeton) return { demande: await demandeDepuisLien(id, jeton), acces: (await verifierProprietaire(req)) || { email: "lien email (propriétaire)" } };
  const acces = await verifierProprietaire(req);
  if (!acces) return { demande: null, acces: null };
  const { data: demande } = await supabaseAdmin.from("demandes_remboursement").select("*").eq("id", id).maybeSingle();
  return { demande, acces };
}

// GET ?id=…&jeton=… → le détail, pour la page de validation
export async function GET(req) {
  const params = new URL(req.url).searchParams;
  const { demande } = await retrouver(req, params.get("id"), params.get("jeton"));
  if (!demande) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  const { data: commande } = await supabaseAdmin
    .from("commandes")
    .select("marque, montant, beneficiaire, email_acheteur, email_destinataire, created_at, statut")
    .eq("id", demande.commande_id)
    .maybeSingle();
  return NextResponse.json({
    demande: {
      statut: demande.statut, demande_par: demande.demande_par, cree_le: demande.cree_le, expire_le: demande.expire_le,
      via_stripe: demande.via_stripe, malgre_envoi: demande.malgre_envoi, motif: demande.motif, montant: demande.montant,
      traitee_le: demande.traitee_le, traitee_par: demande.traitee_par,
    },
    commande,
  });
}

// POST { id, jeton?, action: "valider" | "refuser" }
export async function POST(req) {
  try {
    const { id, jeton, action } = await req.json();
    const { demande, acces } = await retrouver(req, id, jeton);
    if (!demande) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
    const resultat = action === "valider"
      ? await validerDemande({ demande, acces })
      : action === "refuser"
        ? await refuserDemande({ demande, acces })
        : { ok: false, code: 400, erreur: "Action inconnue" };
    if (!resultat.ok) return NextResponse.json({ error: resultat.erreur }, { status: resultat.code || 400 });
    return NextResponse.json(resultat);
  } catch (e) {
    console.error("Validation de remboursement", e);
    const message = e?.type?.startsWith?.("Stripe") ? `Stripe a refusé le remboursement : ${e.message}` : "L'opération n'a pas pu être faite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
