import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { classerEnseignes } from "../../../lib/classement";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Champs envoyés au navigateur : jamais la marge ni le score
const CHAMPS_PUBLICS =
  "id, slug, nom, categorie, image, couleur, montant_min, montant_max, suggestions, description, description_en, description_de, description_es, description_it, ordre, made_in_france, etiquettes";

export async function GET() {
  try {
    const { data: cartes, error } = await supabase
      .from("catalogue")
      .select(`${CHAMPS_PUBLICS}, notoriete, mise_en_avant`)
      .eq("actif", true);
    if (error) throw error;

    // Marges (table privée)
    const { data: lignesMarges } = await supabase.from("marges_marques").select("slug, marge");
    const marges = {};
    (lignesMarges || []).forEach((m) => { marges[m.slug] = m.marge; });

    // Ventes payées des 30 derniers jours (la commande stocke le nom de la marque)
    const ventes = {};
    const depuis = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: commandes } = await supabase
      .from("commandes")
      .select("marque, montant")
      .eq("statut", "payee")
      .gte("created_at", depuis);

    const slugParNom = {};
    (cartes || []).forEach((c) => { slugParNom[c.nom.toLowerCase()] = c.slug; });
    (commandes || []).forEach((cmd) => {
      const nom = (cmd.marque || "").replace(/^Cagnotte\s*/i, "").trim().toLowerCase();
      const slug = slugParNom[nom];
      if (slug) ventes[slug] = (ventes[slug] || 0) + (Number(cmd.montant) || 0);
    });

    const aujourdhui = new Date().toISOString().slice(0, 10);
    const classees = classerEnseignes(cartes || [], marges, ventes, aujourdhui);

    // On retire notoriété et mise en avant de la réponse (inutiles côté client)
    const reponse = classees.map(({ notoriete, mise_en_avant, ...publique }) => publique);

    return NextResponse.json(
      { cartes: reponse },
      { headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=3600" } }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Classement indisponible" }, { status: 500 });
  }
}
