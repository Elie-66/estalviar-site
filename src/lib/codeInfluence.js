// Codes influenceuses — côté serveur uniquement (manipule les marges).
//
// L'abonné reçoit du cashback sur son compte (à la place du cashback fidélité),
// l'influenceuse touche une commission. Les deux dépendent de la marge de chaque marque,
// pour que la vente reste toujours rentable (frais Stripe compris).

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Grille (en % du montant de la carte), selon ta marge sur la marque.
// Même grille que le fichier Estalviar_code_influenceuse.xlsx.
export const GRILLE_CODE = [
  { margeMin: 12, abonne: 4, commission: 4.5 },
  { margeMin: 10, abonne: 3.5, commission: 3.5 },
  { margeMin: 8, abonne: 3, commission: 2.5 },
  { margeMin: 7, abonne: 2.5, commission: 2 },
  { margeMin: 6, abonne: 2, commission: 1.5 },
  { margeMin: 5, abonne: 1.5, commission: 1 },
  { margeMin: 4, abonne: 1, commission: 1 },
  { margeMin: 3, abonne: 0.5, commission: 0.5 },
];

export function tauxPourMarge(marge) {
  const m = Number(marge) || 0;
  return GRILLE_CODE.find((t) => m >= t.margeMin) || { margeMin: 0, abonne: 0, commission: 0 };
}

const arrondiInferieur = (euros) => Math.floor(euros * 100 + 1e-6) / 100;

export const normaliserCode = (code) =>
  String(code || "").trim().toUpperCase().replace(/\s+/g, "");

// Frais Stripe France (cartes standard EEE) : 1,5 % + 0,25 € par paiement
const FRAIS_STRIPE = { pourcent: 1.5, fixe: 0.25 };

/**
 * Cartes concernées par un code : toutes (rien de coché), ou seulement certaines
 * catégories du catalogue et/ou certaines marques.
 * @param fiche              ligne codes_influence (categories, marques)
 * @param categoriesParSlug  { slug: "Sport", … }
 * @returns fonction slug → true/false
 */
export function filtreCartes(fiche, categoriesParSlug = {}) {
  const categories = fiche?.categories || [];
  const marques = fiche?.marques || [];
  if (categories.length === 0 && marques.length === 0) return () => true;
  return (slug) => marques.includes(slug) || categories.includes(categoriesParSlug[slug]);
}

/**
 * Cashback abonné + commission pour une liste d'articles.
 * Sécurité : si la commande est petite, les frais fixes Stripe pourraient te faire perdre
 * quelques centimes ; dans ce cas cashback et commission sont réduits pour que tu restes à ≥ 0 €.
 * @param articles [{ slug, montant }]
 * @param marges   { slug: marge en % }
 * @param concerne fonction slug → true si le code s'applique à cette carte (voir filtreCartes)
 */
export function calculerCode(articles, marges, concerne = () => true) {
  let abonne = 0;
  let commission = 0;
  let margeEuros = 0;
  let total = 0;
  let articlesEligibles = 0;
  for (const a of articles) {
    const montant = Number(a.montant) || 0;
    total += montant;
    margeEuros += (montant * (Number(marges[a.slug]) || 0)) / 100;
    if (!concerne(a.slug)) continue;
    const t = tauxPourMarge(marges[a.slug]);
    if (t.abonne === 0 && t.commission === 0) continue;
    articlesEligibles += 1;
    abonne += (montant * t.abonne) / 100;
    commission += (montant * t.commission) / 100;
  }

  const frais = (total * FRAIS_STRIPE.pourcent) / 100 + FRAIS_STRIPE.fixe;
  const disponible = Math.max(0, margeEuros - frais);
  if (abonne + commission > disponible) {
    const ratio = disponible / (abonne + commission);
    abonne *= ratio;
    commission *= ratio;
  }

  return {
    cashbackAbonne: arrondiInferieur(abonne),
    commission: arrondiInferieur(commission),
    articlesEligibles,
  };
}

export async function margesPour(slugs) {
  const { data } = await supabase.from("marges_marques").select("slug, marge").in("slug", slugs);
  const marges = {};
  (data || []).forEach((m) => { marges[m.slug] = Number(m.marge); });
  return marges;
}

const dateFr = (d) => new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" });

// Messages affichés au client selon la raison du refus
export function messageRefus(raison, fiche) {
  switch (raison) {
    case "inactif": return "Ce code n'existe pas ou n'est plus actif.";
    case "pas_commence": return `Ce code sera valable à partir du ${dateFr(fiche.valide_du)}.`;
    case "expire": return "Ce code a expiré.";
    case "epuise": return "Ce code a atteint son nombre maximum d'utilisations.";
    case "deja_utilise":
      return fiche.max_par_compte > 1
        ? `Vous avez déjà utilisé ce code ${fiche.max_par_compte} fois (maximum par client).`
        : "Vous avez déjà utilisé ce code.";
    default: return "Code invalide.";
  }
}

// Conditions d'utilisation (lecture seule — l'enregistrement définitif est vérifié par la base)
async function raisonRefus(fiche, profilId, date = new Date()) {
  if (!fiche.actif) return "inactif";
  if (fiche.valide_du && date < new Date(fiche.valide_du)) return "pas_commence";
  if (fiche.valide_jusqu_au && date > new Date(fiche.valide_jusqu_au)) return "expire";

  if (fiche.max_utilisations) {
    const { count } = await supabase
      .from("utilisations_code")
      .select("id", { count: "exact", head: true })
      .eq("code_id", fiche.id)
      .neq("statut", "annulee");
    if ((count || 0) >= fiche.max_utilisations) return "epuise";
  }
  if (fiche.max_par_compte) {
    const { count } = await supabase
      .from("utilisations_code")
      .select("id", { count: "exact", head: true })
      .eq("code_id", fiche.id)
      .eq("profil_id", profilId)
      .neq("statut", "annulee");
    if ((count || 0) >= fiche.max_par_compte) return "deja_utilise";
  }
  return null;
}

/**
 * Vérifie qu'un client peut utiliser ce code sur ces articles.
 * Renvoie { ok: true, code, cashbackAbonne, commission } ou { ok: false, erreur }.
 */
export async function evaluerCode(codeSaisi, articles, profilId) {
  const code = normaliserCode(codeSaisi);
  if (!/^[A-Z0-9_-]{3,20}$/.test(code)) return { ok: false, erreur: "Code invalide." };
  if (!profilId) {
    return { ok: false, erreur: "Connectez-vous ou créez un compte pour utiliser un code : le cashback est crédité sur votre compte." };
  }

  const { data: fiche } = await supabase
    .from("codes_influence")
    .select("id, code, influenceuse, actif, max_par_compte, max_utilisations, valide_du, valide_jusqu_au, categories, marques")
    .eq("code", code)
    .maybeSingle();
  if (!fiche) return { ok: false, erreur: messageRefus("inactif") };

  const raison = await raisonRefus(fiche, profilId);
  if (raison) return { ok: false, erreur: messageRefus(raison, fiche) };

  const slugs = articles.map((a) => a.slug);
  const [marges, { data: fiches }] = await Promise.all([
    margesPour(slugs),
    supabase.from("catalogue").select("slug, nom, categorie").in("slug", slugs),
  ]);
  const categoriesParSlug = {};
  const nomParSlug = {};
  (fiches || []).forEach((f) => {
    categoriesParSlug[f.slug] = f.categorie;
    nomParSlug[f.slug] = f.nom;
  });
  const concerne = filtreCartes(fiche, categoriesParSlug);
  const calcul = calculerCode(articles, marges, concerne);
  if (calcul.cashbackAbonne <= 0) {
    return { ok: false, erreur: "Ce code ne s'applique pas aux cartes de votre panier." };
  }

  // Si le code ne concerne qu'une partie du panier, on dit au client lesquelles
  const concernees = [...new Set(articles.filter((a) => concerne(a.slug)).map((a) => nomParSlug[a.slug] || a.slug))];
  const toutLePanier = articles.every((a) => concerne(a.slug));
  return {
    ok: true,
    code: fiche,
    ...calcul,
    cartesConcernees: toutLePanier ? null : concernees,
  };
}
