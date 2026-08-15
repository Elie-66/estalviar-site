import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { entreprise, contact, email, telephone, quantite, message, destinataires } = await req.json();

    const { error } = await supabase.from('demandes_pro').insert({
      entreprise,
      contact,
      email,
      telephone: telephone || null,
      quantite: quantite ? parseInt(quantite) : null,
      message: message || null,
      destinataires: destinataires && destinataires.length > 0 ? destinataires : null,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const listeDestinatairesHtml =
      destinataires && destinataires.length > 0
        ? `<p><strong>Destinataires fournis (${destinataires.length}) :</strong></p>
           <ul>${destinataires.map((d) => `<li>${d.nom || "—"} — ${d.email || "—"}</li>`).join('')}</ul>`
        : '';

    await resend.emails.send({
      from: 'Estalviar <onboarding@resend.dev>',
      to: 'info@estalviar.com',
      subject: `Nouvelle demande pro : ${entreprise}`,
      html: `
        <div style="font-family: sans-serif;">
          <h2>Nouvelle demande de devis</h2>
          <p><strong>Entreprise :</strong> ${entreprise}</p>
          <p><strong>Contact :</strong> ${contact}</p>
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Téléphone :</strong> ${telephone || "—"}</p>
          <p><strong>Quantité estimée :</strong> ${quantite || "—"}</p>
          <p><strong>Message :</strong> ${message || "—"}</p>
          ${listeDestinatairesHtml}
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}