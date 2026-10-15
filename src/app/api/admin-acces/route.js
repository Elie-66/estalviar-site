import { NextResponse } from "next/server";
import { accesAdmin } from "../../../lib/verifierAdmin";

// GET : les sections de l'admin auxquelles la personne connectée a accès
export async function GET(req) {
  const acces = await accesAdmin(req);
  if (!acces) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ email: acces.email, proprietaire: acces.proprietaire, sections: acces.sections });
}
