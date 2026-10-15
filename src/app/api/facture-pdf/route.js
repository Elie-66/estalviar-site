import { supabaseAdmin, verifierAdmin } from "../../../lib/verifierAdmin";
import { utilisateurConnecte } from "../../../lib/utilisateurServeur";
import { pdfFacture, nomFichierFacture } from "../../../lib/factures";

// GET /api/facture-pdf?numero=F2026-00001 → le PDF, pour son propriétaire ou un admin
export async function GET(req) {
  const numero = new URL(req.url).searchParams.get("numero") || "";
  if (!/^F\d{4}-\d{5,}$/.test(numero)) return new Response("Facture introuvable", { status: 404 });

  const [client, admin] = await Promise.all([utilisateurConnecte(req), verifierAdmin(req)]);
  if (!client && !admin) return new Response("Non connecté", { status: 401 });

  const { data: facture } = await supabaseAdmin.from("factures").select("*").eq("numero", numero).maybeSingle();
  const proprietaire = facture && client && facture.email_client.toLowerCase() === client.email.toLowerCase();
  if (!facture || (!proprietaire && !admin)) return new Response("Facture introuvable", { status: 404 });

  const pdf = await pdfFacture(facture);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nomFichierFacture(facture)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
