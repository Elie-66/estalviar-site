import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { EXPEDITEUR, SITE } from "../../../lib/emailCarte";
import { enveloppeEmail, titreEmail, texteEmail } from "../../../lib/emailTemplate";
import { echapperHtml } from "../../../lib/designs";
import { RANG_STATUT, STATUTS_PROBLEME } from "../../../lib/suiviEnvoi";

// Resend nous prévient de ce qui arrive à chaque email : délivré, ouvert, rejeté…
// Adresse à indiquer dans Resend › Webhooks : https://estalviar.com/api/resend-webhook

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_ALERTE = "info@estalviar.com";

const EVENEMENTS = {
  "email.sent": "envoye",
  "email.delivered": "delivre",
  "email.delivery_delayed": "retarde",
  "email.opened": "ouvert",
  "email.clicked": "clique",
  "email.bounced": "rejete",
  "email.complained": "signale",
};

/** Vérifie que le message vient bien de Resend (signature Svix) */
function signatureValide(req, corps) {
  const secret = process.env.RESEND_WEBHOOK_SECRET || "";
  const id = req.headers.get("svix-id");
  const horodatage = req.headers.get("svix-timestamp");
  const signatures = req.headers.get("svix-signature") || "";
  if (!secret.startsWith("whsec_") || !id || !horodatage) return false;
  // Message trop vieux (plus de 5 minutes) : refusé
  if (Math.abs(Date.now() / 1000 - Number(horodatage)) > 300) return false;
  const attendue = crypto
    .createHmac("sha256", Buffer.from(secret.slice(6), "base64"))
    .update(`${id}.${horodatage}.${corps}`)
    .digest("base64");
  return signatures.split(" ").some((s) => {
    const valeur = s.split(",")[1] || "";
    return valeur.length === attendue.length && crypto.timingSafeEqual(Buffer.from(valeur), Buffer.from(attendue));
  });
}

// Carte non délivrée : on prévient l'acheteur (s'il n'est pas lui-même le destinataire) et l'équipe
async function prevenirRejet(cartes, detail) {
  for (const c of cartes) {
    const marque = echapperHtml(String(c.marque || "").replace(/^Cagnotte\s*/i, ""));
    const pour = c.beneficiaire ? ` pour ${echapperHtml(c.beneficiaire)}` : "";
    const adresse = echapperHtml(c.email_destinataire || "");
    try {
      if (c.email_acheteur && c.email_acheteur.toLowerCase() !== String(c.email_destinataire || "").toLowerCase()) {
        await resend.emails.send({
          from: EXPEDITEUR,
          to: c.email_acheteur,
          replyTo: EMAIL_ALERTE,
          subject: `Votre carte ${String(c.marque || "").replace(/^Cagnotte\s*/i, "")} n'a pas pu être livrée`,
          html: enveloppeEmail({
            titre: "Carte non livrée",
            siteUrl: SITE,
            contenuHtml:
              titreEmail("Votre carte n'a pas pu être livrée") +
              texteEmail(`La carte cadeau <strong>${marque}</strong>${pour} n'a pas pu être livrée à <strong>${adresse}</strong> : l'adresse semble incorrecte, ou la boîte de réception refuse les messages.`) +
              texteEmail("Répondez simplement à cet email avec la bonne adresse : nous lui renvoyons la carte tout de suite. Le code reste valable, rien n'est perdu."),
          }),
        });
      }
      await resend.emails.send({
        from: EXPEDITEUR,
        to: EMAIL_ALERTE,
        subject: `Carte non livrée : ${String(c.marque || "")} à ${c.email_destinataire}`,
        html: enveloppeEmail({
          titre: "Carte non livrée",
          siteUrl: SITE,
          contenuHtml:
            titreEmail("Carte non livrée") +
            texteEmail(`Carte <strong>${marque}</strong> de ${echapperHtml(c.montant)} €${pour}, achetée par ${echapperHtml(c.email_acheteur)}.`) +
            texteEmail(`Adresse refusée : <strong>${adresse}</strong>${detail ? `<br/>Motif : ${echapperHtml(detail)}` : ""}`) +
            texteEmail(`Pour la renvoyer à une autre adresse : <a href="${SITE}/fr/admin/commandes" style="color:#C9A227;">Admin › Commandes</a>, filtre « Non livrées ».`),
        }),
      });
    } catch (e) {
      console.error("Alerte de carte non livrée non envoyée", c.id, e);
    }
  }
}

export async function POST(req) {
  const corps = await req.text();
  if (!signatureValide(req, corps)) return new Response("Signature invalide", { status: 401 });

  let evenement;
  try {
    evenement = JSON.parse(corps);
  } catch {
    return new Response("JSON invalide", { status: 400 });
  }
  const statut = EVENEMENTS[evenement?.type];
  const emailId = evenement?.data?.email_id;
  if (!statut || !emailId) return new Response(null, { status: 204 });

  const { data: cartes } = await supabase
    .from("commandes")
    .select("id, marque, montant, beneficiaire, email_acheteur, email_destinataire, email_statut")
    .eq("email_id", emailId);
  if (!cartes?.length) return new Response(null, { status: 204 });

  const detail = evenement.data?.bounce?.message || evenement.data?.bounce?.subType || null;
  const probleme = STATUTS_PROBLEME.includes(statut);
  // Un statut ne recule jamais ; un rejet, lui, l'emporte toujours
  const aMettreAJour = cartes.filter((c) =>
    probleme
      ? c.email_statut !== statut
      : !STATUTS_PROBLEME.includes(c.email_statut) && (RANG_STATUT[statut] ?? 0) > (RANG_STATUT[c.email_statut] ?? -1)
  );
  if (aMettreAJour.length === 0) return new Response(null, { status: 204 });

  await supabase
    .from("commandes")
    .update({ email_statut: statut, email_maj_le: evenement.created_at || new Date().toISOString(), email_detail: probleme ? detail : null })
    .in("id", aMettreAJour.map((c) => c.id));

  if (statut === "rejete") await prevenirRejet(aMettreAJour, detail);
  return new Response(null, { status: 204 });
}
