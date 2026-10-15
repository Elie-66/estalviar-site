import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { trouverDesign } from '../../../lib/designs';
import { utilisateurConnecte } from '../../../lib/utilisateurServeur';
import { calculerCashbackUtilisable } from '../../../lib/cashback';
import { evaluerCode } from '../../../lib/codeInfluence';
import { VERSION_CGV } from '../../../lib/infosLegales';
import { nettoyerFacturation } from '../../../lib/factures';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL_VALIDE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ARTICLES = 20;
const texteCourt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '') || null;

export async function POST(req) {
  try {
    const { articles, emailAcheteur, emailsBeneficiaires, locale, utiliserCashback, codeInfluence, accepteCgv, facturation } = await req.json();
    const client = await utilisateurConnecte(req);
    const langue = ['fr', 'en', 'de', 'es', 'it'].includes(locale) ? locale : 'fr';

    if (!Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }
    if (articles.length > MAX_ARTICLES) {
      return NextResponse.json({ error: `Maximum ${MAX_ARTICLES} cartes par commande` }, { status: 400 });
    }
    if (!EMAIL_VALIDE.test(emailAcheteur || '')) {
      return NextResponse.json({ error: 'Email acheteur invalide' }, { status: 400 });
    }
    // Obligatoire : acceptation des CGV et demande d'envoi immédiat (enregistrées avec la commande)
    if (accepteCgv !== true) {
      return NextResponse.json({ error: 'Merci d’accepter les conditions générales de vente.' }, { status: 400 });
    }

    const { data: catalogue } = await supabase
      .from('catalogue')
      .select('slug, nom, image, couleur, montant_min, montant_max, actif');

    // Le serveur reconstruit chaque carte à partir du CATALOGUE.
    // Du navigateur, on ne garde que : la marque choisie, le montant, le design et les textes personnels.
    const articlesValides = [];
    for (const article of articles) {
      const nomMarque = String(article.marque || '').replace(/^Cagnotte\s*/i, '').trim().toLowerCase();
      const carte = (catalogue || []).find((c) => c.nom.toLowerCase() === nomMarque);

      if (!carte || !carte.actif) {
        return NextResponse.json({ error: `${article.marque} n'est pas disponible` }, { status: 400 });
      }

      const montant = Number(article.montant);
      const centimes = Math.round(montant * 100);
      const auCentimePres = Number.isFinite(montant) && Math.abs(centimes - montant * 100) < 1e-6;
      if (!auCentimePres || montant < carte.montant_min || montant > carte.montant_max) {
        return NextResponse.json(
          { error: `Montant invalide pour ${carte.nom} (entre ${carte.montant_min} € et ${carte.montant_max} €)` },
          { status: 400 }
        );
      }

      const design = trouverDesign(article.design, carte.couleur);
      const emailBenef = emailsBeneficiaires?.[article.id];

      articlesValides.push({
        slug: carte.slug,
        marque: carte.nom,
        image: carte.image,
        montant,
        design: design.nom,
        background: design.background,
        texteFonce: design.texteFonce,
        beneficiaire: texteCourt(article.beneficiaire, 40),
        message: texteCourt(article.message, 40),
        dateEnvoi: /^\d{4}-\d{2}-\d{2}$/.test(article.dateEnvoi || '') ? article.dateEnvoi : null,
        heureEnvoi: /^\d{2}:\d{2}$/.test(article.heureEnvoi || '') ? article.heureEnvoi : null,
        emailBeneficiaire: EMAIL_VALIDE.test(emailBenef || '') ? emailBenef.trim() : null,
      });
    }

    const montantTotal = articlesValides.reduce((s, a) => s + Math.round(a.montant * 100), 0) / 100;

    // CODE INFLUENCEUSE : revérifié par le serveur (compte, déjà utilisé, marques éligibles)
    let codeInfluenceId = null;
    if (codeInfluence) {
      if (utiliserCashback) {
        return NextResponse.json(
          { error: 'Un code partenaire ne peut pas être combiné avec l\'utilisation de votre cashback.' },
          { status: 400 }
        );
      }
      const evaluation = await evaluerCode(codeInfluence, articlesValides, client?.id);
      if (!evaluation.ok) return NextResponse.json({ error: evaluation.erreur }, { status: 400 });
      codeInfluenceId = evaluation.code.id;
    }

    // Le panier validé est enregistré côté serveur : c'est LUI qui sera livré après le paiement
    const { data: panier, error: erreurPanier } = await supabase
      .from('paniers')
      .insert({
        email_acheteur: emailAcheteur.trim(),
        articles: articlesValides,
        montant_total: montantTotal,
        statut: 'en_attente',
        profil_id: client?.id || null,
        code_influence_id: codeInfluenceId,
        cgv_version: VERSION_CGV,
        cgv_acceptees_le: new Date().toISOString(),
        // Coordonnées de société pour la facture (facultatives)
        facturation: nettoyerFacturation(facturation),
      })
      .select('id')
      .single();

    if (erreurPanier) {
      console.error(erreurPanier);
      return NextResponse.json({ error: 'Impossible de préparer la commande' }, { status: 500 });
    }

    // CASHBACK : calculé et réservé par le serveur (le client ne choisit que « oui / non »)
    let cashbackUtilise = 0;
    if (utiliserCashback && client) {
      const { data: solde } = await supabase.rpc('cashback_solde', { p_profil: client.id });
      const disponible = Number(solde?.[0]?.disponible) || 0;
      const utilisable = calculerCashbackUtilisable(montantTotal, disponible);
      if (utilisable > 0) {
        const { error: erreurReserve } = await supabase.rpc('cashback_reserver', {
          p_profil: client.id,
          p_montant: utilisable,
          p_panier: panier.id,
        });
        if (erreurReserve) {
          console.error(erreurReserve);
          return NextResponse.json({ error: 'Votre cashback n\'a pas pu être appliqué, réessayez.' }, { status: 409 });
        }
        cashbackUtilise = utilisable;
        await supabase.from('paniers').update({ cashback_utilise: cashbackUtilise }).eq('id', panier.id);
      }
    }

    const line_items = articlesValides.map((a) => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Carte cadeau ${a.marque}`,
          description: a.beneficiaire ? `Pour ${a.beneficiaire}` : undefined,
        },
        unit_amount: Math.round(a.montant * 100),
      },
      quantity: 1,
    }));

    const origin = req.headers.get('origin') || 'https://estalviar.com';
    const parametres = {
      line_items,
      mode: 'payment',
      customer_email: emailAcheteur.trim(),
      client_reference_id: panier.id,
      metadata: { type: 'panier', panier_id: panier.id },
      success_url: `${origin}/${langue}/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${langue}/panier`,
      managed_payments: { enabled: false },
    };

    let session;
    try {
      if (cashbackUtilise > 0) {
        // Réduction à usage unique du montant exact du cashback
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(cashbackUtilise * 100),
          currency: 'eur',
          duration: 'once',
          max_redemptions: 1,
          name: 'Cashback Estalviar',
        });
        parametres.discounts = [{ coupon: coupon.id }];
        // Session courte : si le client abandonne, son cashback lui est rendu rapidement
        parametres.expires_at = Math.floor(Date.now() / 1000) + 35 * 60;
      }
      session = await stripe.checkout.sessions.create(parametres);
    } catch (e) {
      if (cashbackUtilise > 0) await supabase.rpc('cashback_liberer', { p_panier: panier.id });
      throw e;
    }

    await supabase.from('paniers').update({ stripe_session_id: session.id }).eq('id', panier.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erreur lors de la préparation du paiement' }, { status: 500 });
  }
}
