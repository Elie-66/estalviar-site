
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const CLE = process.env.TILLO_API_KEY;
const SECRET = process.env.TILLO_API_SECRET;
const BASE = (process.env.TILLO_BASE_URL || "https://sandbox.tillo.dev/api/v2").replace(/\/$/, "");
const DOSSIER_LOGOS = path.join(process.cwd(), "public", "logos");

if (!CLE || !SECRET) {
  console.error("❌ TILLO_API_KEY et TILLO_API_SECRET manquent dans .env.local");
  process.exit(1);
}

// Même règle de nommage que l'import du catalogue : "adidas France" → "adidas"
function nomPropre(nom) {
  let n = nom.trim();
  const steam = n.match(/^STEAM France €(\d+)$/);
  if (steam) return `Steam France (carte ${steam[1]} €)`;
  if (n === "Steam Europe") return "Steam (Europe)";
  if (n === "Inspire Travel Europe") return "Inspire Travel (Europe)";
  for (const suffixe of [" France", " FR", " EUR", " EU", " Europe"]) {
    if (n.endsWith(suffixe)) { n = n.slice(0, -suffixe.length); break; }
  }
  const corrections = {
    "e-carte Google Play": "Google Play", DUOLINGO: "Duolingo", GYMSHARK: "Gymshark", MANGO: "Mango",
    ENEBA: "Eneba", GEMO: "Gémo", ERAM: "Éram", "Marriott USA": "Marriott (USA)", "Digitale C&A": "C&A",
    "IFly Paris - Baptême 360° VR": "iFly Paris (chute libre indoor)",
  };
  return (corrections[n] || n).trim();
}

function slugEstalviar(nom) {
  return nom.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function signer(...morceaux) {
  return crypto.createHmac("sha256", SECRET).update(morceaux.join("-")).digest("hex");
}

const EXTENSIONS = { "image/png": "png", "image/svg+xml": "svg", "image/jpeg": "jpg", "image/webp": "webp" };

async function main() {
  const horodatage = String(Date.now());
  const res = await fetch(`${BASE}/brands?detail=true&country=FR`, {
    headers: {
      "API-Key": CLE,
      Signature: signer(CLE, "GET", "brands", horodatage),
      Timestamp: horodatage,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.status !== "success") {
    console.error("❌ Réponse Tillo :", res.status, JSON.stringify(json).slice(0, 400));
    process.exit(1);
  }

  const marques = Object.values(json.data?.brands || {});
  console.log(`📦 ${marques.length} marques reçues de Tillo\n`);
  await fs.mkdir(DOSSIER_LOGOS, { recursive: true });

  const sql = [
    "-- Logos et identifiants Tillo — généré par scripts/recuperer-logos-tillo.mjs",
    "alter table marges_marques add column if not exists code_tillo text;",
    "",
  ];
  let ok = 0;
  const sansLogo = [];

  for (const m of marques) {
    const slug = slugEstalviar(nomPropre(m.name || ""));
    sql.push(`update marges_marques set code_tillo = '${m.slug}' where slug = '${slug}';`);

    const urlLogo = m.detail?.assets?.logo_url;
    if (!urlLogo) { sansLogo.push(m.name); continue; }

    try {
      const img = await fetch(urlLogo);
      if (!img.ok) throw new Error(`HTTP ${img.status}`);
      const type = (img.headers.get("content-type") || "").split(";")[0].trim();
      const ext = EXTENSIONS[type] || path.extname(new URL(urlLogo).pathname).slice(1) || "png";
      const fichier = `${slug}.${ext}`;
      await fs.writeFile(path.join(DOSSIER_LOGOS, fichier), Buffer.from(await img.arrayBuffer()));
      // On ne remplace pas un logo que tu as déjà mis à la main
      sql.push(`update catalogue set image = '/logos/${fichier}' where slug = '${slug}' and coalesce(image, '') = '';`);
      ok++;
      console.log(`✅ ${m.name} → ${fichier}`);
    } catch (e) {
      sansLogo.push(`${m.name} (${e.message})`);
    }
  }

  await fs.writeFile(path.join(process.cwd(), "logos-tillo.sql"), sql.join("\n") + "\n");
  console.log(`\n🎉 ${ok} logos téléchargés dans public/logos/`);
  if (sansLogo.length) console.log(`⚠️  Sans logo (${sansLogo.length}) : ${sansLogo.join(", ")}`);
  console.log("➡️  Lance maintenant le fichier logos-tillo.sql dans Supabase > SQL Editor.");
}

main().catch((e) => { console.error("❌", e); process.exit(1); });
