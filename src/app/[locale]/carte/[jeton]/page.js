import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getTranslations } from "next-intl/server";
import { dechiffrerCode } from "../../../../lib/chiffrement";
import { trouverDesign } from "../../../../lib/designs";
import { logoEnBlanc } from "../../../../lib/couleursCartes";
import { CopierCode, BoutonImprimer } from "../../components/ActionsCarte";

// Page personnelle : jamais en cache, jamais indexée
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUTS_EXCLUS = ["annulee", "remboursee"];

/**
 * Retrouve une carte à partir de son lien secret (jeton reçu par email).
 * Renvoie null si le lien est faux ou si la carte n'est plus valable.
 */
async function chargerCarte(jeton) {
  if (!UUID.test(jeton || "")) return null;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: commande } = await supabase
    .from("commandes")
    .select("marque, montant, beneficiaire, message, design, code, statut, created_at")
    .eq("jeton_carte", jeton)
    .maybeSingle();
  if (!commande?.code || STATUTS_EXCLUS.includes(commande.statut)) return null;

  let code;
  try {
    code = dechiffrerCode(commande.code);
  } catch {
    return null;
  }

  const nomMarque = String(commande.marque || "").replace(/^Cagnotte\s*/i, "").trim();
  const { data: fiche } = await supabase
    .from("catalogue")
    .select("*")
    .ilike("nom", nomMarque.replace(/[\\%_]/g, (c) => `\\${c}`))
    .maybeSingle();

  const design = trouverDesign(commande.design, fiche?.couleur);
  return { commande, code, fiche, marque: fiche?.nom || nomMarque, design };
}

export async function generateMetadata({ params }) {
  const { locale, jeton } = await params;
  const t = await getTranslations({ locale, namespace: "maCarte" });
  const carte = await chargerCarte(jeton);
  return {
    title: { absolute: carte ? `${t("metaTitre", { marque: carte.marque })} | Estalviar` : "Estalviar" },
    robots: { index: false, follow: false },
    // Le lien secret ne doit pas partir vers les sites ouverts depuis cette page
    referrer: "no-referrer",
  };
}

export default async function MaCarte({ params }) {
  const { locale, jeton } = await params;
  const carte = await chargerCarte(jeton);
  if (!carte) notFound();

  const t = await getTranslations({ locale, namespace: "maCarte" });
  const { commande, code, fiche, marque, design } = carte;
  const montant = Number(commande.montant).toLocaleString(locale, { maximumFractionDigits: 2 });
  const date = new Date(commande.created_at).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const description = (locale !== "fr" && fiche?.[`description_${locale}`]) || fiche?.description;
  const couleurTexte = design.texteFonce ? "text-ink" : "text-white";
  const blanc = logoEnBlanc(fiche);

  return (
    <div className="px-5 sm:px-6 pt-28 md:pt-36 pb-24 print:p-0">
      <div className="max-w-[560px] mx-auto">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ivory print:text-ink">
          {commande.beneficiaire ? t("titrePour", { prenom: commande.beneficiaire }) : t("titre")}
        </h1>
        <p className="mt-2 text-ivory/55 print:text-ink/60">{t("intro", { marque, date })}</p>

        {/* La carte */}
        <div className={`imprimer-couleurs mt-9 relative aspect-[1.586/1] rounded-2xl overflow-hidden p-6 sm:p-7 flex flex-col shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)] print:shadow-none ${couleurTexte}`}
          style={{ background: design.background }}>
          <div className="flex items-start justify-between gap-4">
            {fiche?.image ? (
              blanc ? (
                <img src={fiche.image} alt={marque} className="h-9 sm:h-10 max-w-[55%] object-contain object-left brightness-0 invert" />
              ) : (
                <span className="bg-white rounded-lg px-3 py-2 inline-flex">
                  <img src={fiche.image} alt={marque} className="h-7 sm:h-8 max-w-[140px] object-contain" />
                </span>
              )
            ) : (
              <span className="text-2xl font-semibold font-[family-name:var(--font-fraunces)]">{marque}</span>
            )}
            <span className="opacity-60 text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
          </div>

          <div className="mt-auto">
            {commande.message && (
              <p className="text-sm sm:text-[15px] italic opacity-80 leading-snug line-clamp-2 mb-3 max-w-[85%]">« {commande.message} »</p>
            )}
            <p className="text-4xl sm:text-5xl font-semibold font-[family-name:var(--font-fraunces)] leading-none">
              {montant}<span className="text-gold text-2xl sm:text-3xl ml-1.5">€</span>
            </p>
          </div>
        </div>

        {/* Le code */}
        <section className="mt-9 rounded-xl border border-ivory/15 print:border-ink/25 p-5 sm:p-6">
          <h2 className="text-sm font-sans font-medium text-ivory/60 print:text-ink/60">{t("codeTitre")}</h2>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <p className="text-[22px] sm:text-2xl text-ivory print:text-ink tracking-[0.08em] font-[family-name:var(--font-space-mono)] break-all select-all">
              {code}
            </p>
            <CopierCode code={code} texte={t("copier")} texteCopie={t("copie")} />
          </div>
          <p className="mt-4 text-sm text-ivory/50 print:text-ink/60 leading-relaxed">{t("prudence")}</p>
        </section>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
          <BoutonImprimer texte={t("imprimer")} />
          <p className="print:hidden text-xs text-ivory/45">{t("astucePdf")}</p>
        </div>

        {/* Mode d'emploi */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-ivory print:text-ink">{t("utiliserTitre")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ivory/75 print:text-ink/80">{t("utiliser", { marque })}</p>
          {description && (
            <p className="mt-3 text-[15px] leading-relaxed text-ivory/60 print:text-ink/70 whitespace-pre-line">{description}</p>
          )}
          <p className="mt-5 text-sm text-ivory/55 print:text-ink/60">
            {t.rich("aide", {
              mail: (m) => <a href="mailto:info@estalviar.com" className="text-gold print:text-ink underline underline-offset-[3px]">{m}</a>,
            })}
          </p>
        </section>

        <div className="print:hidden mt-14 pt-8 border-t border-ivory/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-ivory/70">{t("offrirTexte")}</p>
          <a href={`/${locale}/boutique`} className="text-sm text-gold underline decoration-gold/50 underline-offset-4 hover:decoration-gold">
            {t("offrir")}
          </a>
        </div>

        <p className="hidden print:block mt-10 text-xs text-ink/50">estalviar.com</p>
      </div>
    </div>
  );
}
