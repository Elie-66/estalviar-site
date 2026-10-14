// Tâche automatique quotidienne (tous les jours à 7h30 UTC) :
// prévient les clients 7 jours avant l'anniversaire d'un de leurs bénéficiaires.
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { EXPEDITEUR, SITE } from '../../src/lib/emailCarte.js';
import { enveloppeEmail, titreEmail, texteEmail, boutonEmail } from '../../src/lib/emailTemplate.js';
import { echapperHtml } from '../../src/lib/designs.js';
import { aujourdhuiParis } from '../../src/lib/evenements.js';
import { anniversaireARappeler, formaterJourMois, JOURS_AVANT_RAPPEL } from '../../src/lib/rappelsAnniversaire.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function envoyerRappelsAnniversaire(maintenant = new Date()) {
  const aujourdhui = aujourdhuiParis(maintenant);
  const { jour, mois, aussi29Fevrier } = anniversaireARappeler(aujourdhui);

  const jours = aussi29Fevrier ? [jour, 29] : [jour];
  const { data: beneficiaires, error } = await supabase
    .from('beneficiaires')
    .select('id, nom, profil_id, anniversaire_jour, anniversaire_mois, dernier_rappel')
    .eq('anniversaire_mois', mois)
    .in('anniversaire_jour', jours);
  if (error) throw error;

  // Jamais deux rappels pour le même anniversaire (si la tâche tourne deux fois)
  const ilYA300Jours = new Date(maintenant.getTime() - 300 * 86400000).toISOString().slice(0, 10);
  const aRappeler = (beneficiaires || []).filter((b) => !b.dernier_rappel || b.dernier_rappel < ilYA300Jours);
  if (aRappeler.length === 0) return { envoyes: 0, erreurs: 0 };

  const { data: profils } = await supabase
    .from('profils')
    .select('id, email, prenom')
    .in('id', [...new Set(aRappeler.map((b) => b.profil_id))]);
  const profilParId = new Map((profils || []).map((p) => [p.id, p]));

  const bilan = { envoyes: 0, erreurs: 0 };
  for (const b of aRappeler) {
    const profil = profilParId.get(b.profil_id);
    if (!profil?.email) continue;

    const nom = echapperHtml(b.nom);
    const date = formaterJourMois(b.anniversaire_jour, b.anniversaire_mois);
    const lien = `${SITE}/fr/boutique?pour=${encodeURIComponent(b.nom)}`;
    const { error: erreurEmail } = await resend.emails.send({
      from: EXPEDITEUR,
      to: profil.email,
      replyTo: 'info@estalviar.com',
      subject: `L'anniversaire de ${b.nom}, c'est dans ${JOURS_AVANT_RAPPEL} jours`,
      html: enveloppeEmail({
        titre: `L'anniversaire de ${nom}`,
        siteUrl: SITE,
        contenuHtml:
          titreEmail(`L'anniversaire de ${nom} approche`) +
          texteEmail(`${profil.prenom ? `Bonjour ${echapperHtml(profil.prenom)},` : 'Bonjour,'}`) +
          texteEmail(`C'est le <strong>${date}</strong>, dans ${JOURS_AVANT_RAPPEL} jours. Il est encore temps de lui offrir une carte cadeau personnalisée, et même de choisir le jour et l'heure où elle arrivera.`) +
          boutonEmail({ texte: `Choisir une carte pour ${nom}`, lien }) +
          texteEmail(`<span style="color:#999; font-size:12px;">Vous recevez ce rappel car vous avez enregistré cet anniversaire dans votre compte. Pour ne plus le recevoir, retirez la date dans <a href="${SITE}/fr/profil?onglet=beneficiaires" style="color:#999;">Mon compte › Bénéficiaires</a>.</span>`),
      }),
    });

    if (erreurEmail) {
      console.error('Rappel d\'anniversaire non envoyé', b.id, erreurEmail);
      bilan.erreurs += 1;
      continue;
    }
    await supabase.from('beneficiaires').update({ dernier_rappel: aujourdhui }).eq('id', b.id);
    bilan.envoyes += 1;
  }
  return bilan;
}

export default async function handler() {
  try {
    const bilan = await envoyerRappelsAnniversaire();
    return new Response(JSON.stringify(bilan), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export const config = {
  schedule: '30 7 * * *',
};
