// Vignette d'enseigne sur fond clair : logo sur blanc, nom, catégorie et prix de départ
export default function VignetteEnseigne({ carte, href, categorie, prix }) {
  return (
    <a
      href={href}
      className="group bg-white border border-[#E4E1D9] rounded-lg overflow-hidden flex flex-col hover:border-ink transition-colors"
    >
      <div className="h-[110px] flex items-center justify-center border-b border-[#EFECE5] px-4">
        {carte.image ? (
          <img
            src={carte.image}
            alt={carte.nom}
            className="max-h-[46%] max-w-[70%] object-contain"
          />
        ) : (
          <span className="text-xl font-bold text-ink">{carte.nom}</span>
        )}
      </div>
      <div className="px-3.5 py-3">
        <div className="text-sm font-semibold text-ink group-hover:underline underline-offset-4">{carte.nom}</div>
        <div className="text-[13px] text-[#4A4F5E] mt-0.5">
          {categorie ? `${categorie} · ` : ""}{prix}
        </div>
      </div>
    </a>
  );
}
