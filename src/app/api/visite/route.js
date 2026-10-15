import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Mesure d'audience anonyme, sans cookie : une page vue = une ligne.
// On ne garde ni l'adresse IP ni le navigateur exact : seulement une empreinte qui change chaque jour.

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const LANGUES = ["fr", "en", "de", "es", "it"];
const ROBOTS = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|curl|wget|python|axios|node-fetch/i;

// Sites connus : leur nom lisible
const SOURCES = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)qwant\.com$/, "Qwant"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)yahoo\./, "Yahoo"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)(facebook\.com|fb\.me|messenger\.com)$/, "Facebook"],
  [/(^|\.)(linkedin\.com|lnkd\.in)$/, "LinkedIn"],
  [/(^|\.)tiktok\.com$/, "TikTok"],
  [/(^|\.)(t\.co|x\.com|twitter\.com)$/, "X (Twitter)"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YouTube"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)snapchat\.com$/, "Snapchat"],
  [/(^|\.)(whatsapp\.com|wa\.me)$/, "WhatsApp"],
  [/(^|\.)(mail\.google\.com|outlook\.live\.com|mail\.yahoo\.com)$/, "Email"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
  [/(^|\.)(claude\.ai|perplexity\.ai)$/, "Assistants IA"],
];

const court = (v, max = 80) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

function nomSource(domaine) {
  for (const [motif, nom] of SOURCES) if (motif.test(domaine)) return nom;
  return domaine;
}

// Nom d'une source utm (« ig » → Instagram…) pour regrouper avec les visites naturelles
function nomUtm(utm) {
  const v = utm.toLowerCase();
  if (["ig", "instagram"].includes(v)) return "Instagram";
  if (["fb", "facebook"].includes(v)) return "Facebook";
  if (["li", "linkedin"].includes(v)) return "LinkedIn";
  if (["tt", "tiktok"].includes(v)) return "TikTok";
  if (["newsletter", "email", "mail"].includes(v)) return "Email";
  if (v === "google") return "Google";
  return utm.slice(0, 40);
}

function appareil(ua) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablette";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "ordinateur";
}

function navigateur(ua) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/firefox|fxios/i.test(ua)) return "Firefox";
  if (/instagram/i.test(ua)) return "Instagram (appli)";
  if (/fban|fbav/i.test(ua)) return "Facebook (appli)";
  if (/chrome|crios/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Autre";
}

// Pays fourni par Netlify (aucune base de géolocalisation chez nous)
function pays(req) {
  const geo = req.headers.get("x-nf-geo");
  if (geo) {
    try {
      const code = JSON.parse(Buffer.from(geo, "base64").toString("utf8"))?.country?.code;
      if (/^[A-Z]{2}$/.test(code || "")) return code;
    } catch {}
  }
  const code = req.headers.get("x-country");
  return /^[A-Z]{2}$/i.test(code || "") ? code.toUpperCase() : null;
}

// Les pages qui contiennent un lien secret ne sont jamais enregistrées telles quelles
function cheminPropre(chemin) {
  return chemin
    .replace(/^\/carte\/[^/]+/, "/carte/…")
    .replace(/^\/cagnotte\/([^/]+)\/choisir.*/, "/cagnotte/…/choisir")
    .replace(/^\/cagnotte\/(?!creer$)[^/]+$/, "/cagnotte/…")
    .slice(0, 120) || "/";
}

export async function POST(req) {
  try {
    const ua = req.headers.get("user-agent") || "";
    // Robots, et visiteurs qui demandent à ne pas être suivis (Do Not Track / Global Privacy Control)
    if (!ua || ROBOTS.test(ua) || req.headers.get("dnt") === "1" || req.headers.get("sec-gpc") === "1") {
      return new Response(null, { status: 204 });
    }

    const corps = await req.json().catch(() => ({}));
    let chemin = typeof corps.chemin === "string" ? corps.chemin.split("?")[0] : "";
    if (!chemin.startsWith("/") || chemin.length > 300) return new Response(null, { status: 204 });

    // Langue = premier morceau du chemin (/fr/boutique → fr, /boutique)
    const morceaux = chemin.split("/");
    const langue = LANGUES.includes(morceaux[1]) ? morceaux[1] : null;
    if (langue) chemin = `/${morceaux.slice(2).join("/")}`;
    if (chemin.startsWith("/admin")) return new Response(null, { status: 204 });
    chemin = cheminPropre(chemin.replace(/\/$/, "") || "/");

    // D'où vient le visiteur ?
    const hote = (req.headers.get("host") || "").replace(/:\d+$/, "").replace(/^www\./, "").toLowerCase();
    let domaineReferent = null;
    try {
      domaineReferent = corps.referent ? new URL(corps.referent).hostname.replace(/^www\./, "").toLowerCase() : null;
    } catch {}
    // Retour du paiement Stripe = suite de la même visite
    const interne = domaineReferent && ((hote && domaineReferent === hote) || /(^|\.)stripe\.com$/.test(domaineReferent));
    const utm = corps.utm && typeof corps.utm === "object" ? corps.utm : {};
    const entree = !interne;
    let source = null;
    if (entree) {
      if (court(utm.source)) source = nomUtm(court(utm.source));
      else if (domaineReferent) source = nomSource(domaineReferent);
    }

    // Empreinte anonyme du jour : IP + navigateur + date + clé secrète, puis hachée
    const ip = req.headers.get("x-nf-client-connection-ip") || (req.headers.get("x-forwarded-for") || "").split(",")[0].trim();
    const jour = new Date().toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
    const visiteur = crypto
      .createHash("sha256")
      .update(`${ip}|${ua}|${jour}|${process.env.CLE_CHIFFREMENT || "estalviar"}`)
      .digest("base64url")
      .slice(0, 22);

    await supabase.from("visites").insert({
      visiteur,
      entree,
      chemin,
      langue: langue || "fr",
      source,
      campagne: entree ? court(utm.campaign, 60) : null,
      support: entree ? court(utm.medium, 40) : null,
      pays: pays(req),
      appareil: appareil(ua),
      navigateur: navigateur(ua),
    });
  } catch (e) {
    console.error("Visite non enregistrée", e);
  }
  return new Response(null, { status: 204 });
}
