import Tricolore from "../Tricolore";

// Section « Fabriqué en France » : l'argument qui distingue Estalviar
export default function SectionFrance({ locale, marques, traduireCategorie, tx }) {
  // Toujours 4 emplacements : les places libres annoncent les prochaines marques
  const places = [...marques.slice(0, 4)];
  while (places.length < 4) places.push(null);

  return (
    <section className="bg-white border-y border-[#E4E1D9]">
      <div className="max-w-[1240px] mx-auto px-6 py-16">
        <div className="rounded-2xl bg-[#F3EEE3] border border-[#E6DECC] p-6 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 lg:gap-14 items-center">
          {/* Le texte */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-[#E6DECC] rounded-full pl-2.5 pr-3.5 py-1.5">
              <Tricolore className="w-5 h-3.5" />
              <span className="text-xs font-semibold tracking-[0.06em] text-[#12172B]">{tx.franceBadge}</span>
            </div>
            <h2 className="mt-5 font-[family-name:var(--font-titre)] font-medium text-[34px] md:text-[42px] leading-[1.08] text-[#12172B]">
              {tx.franceAccroche}
            </h2>
            <p className="mt-4 text-base md:text-[17px] leading-relaxed text-[#4A4F5E] max-w-[32rem]">{tx.franceTexte}</p>

            <ul className="mt-6 flex flex-col gap-3">
              {tx.franceArguments.map((a) => (
                <li key={a} className="flex items-start gap-3 text-[15px] text-[#12172B]">
                  <span aria-hidden className="mt-0.5 w-5 h-5 rounded-full bg-[#12172B] text-white flex items-center justify-center shrink-0">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12l5 5 9-10" />
                    </svg>
                  </span>
                  {a}
                </li>
              ))}
            </ul>

            <a
              href={`/${locale}/boutique?onglet=francaises`}
              className="mt-8 inline-flex items-center gap-2 bg-[#12172B] text-white text-[15px] font-semibold rounded px-6 py-3.5 hover:bg-[#12172B]/85 transition-colors"
            >
              {tx.franceLien}
              <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>

          {/* Les marques */}
          <div className="grid grid-cols-2 gap-4">
            {places.map((carte, i) =>
              carte ? (
                <a
                  key={carte.slug}
                  href={`/${locale}/boutique/${carte.slug}`}
                  className="group bg-white rounded-xl border border-[#E6DECC] overflow-hidden flex flex-col hover:shadow-[0_10px_28px_rgba(17,22,43,0.10)] hover:-translate-y-0.5 transition-all"
                >
                  <div className="relative aspect-[4/3] flex items-center justify-center px-6">
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-[#F3EEE3] rounded-full px-2 py-1">
                      <Tricolore className="w-3.5 h-2.5" />
                      <span className="text-[10px] font-semibold text-[#12172B]">{tx.franceBadgeCourt}</span>
                    </span>
                    {carte.image ? (
                      <img src={carte.image} alt={carte.nom} className="max-h-[42%] max-w-[65%] object-contain" />
                    ) : (
                      <span className="text-xl font-bold text-[#12172B]">{carte.nom}</span>
                    )}
                  </div>
                  <div className="px-4 py-3.5 border-t border-[#EFECE5] flex items-center justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold text-[#12172B] truncate">{carte.nom}</span>
                      <span className="block text-[13px] text-[#4A4F5E] truncate">
                        {traduireCategorie(carte.categorie)} · {tx.des(carte.montant_min)}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-semibold text-[#12172B] underline decoration-[#12172B]/30 underline-offset-4 group-hover:decoration-[#12172B]">
                      {tx.franceOffrir}
                    </span>
                  </div>
                </a>
              ) : (
                <div
                  key={`bientot-${i}`}
                  className="rounded-xl border border-dashed border-[#D6CBB3] bg-[#F3EEE3] flex flex-col items-center justify-center text-center px-4 py-10 min-h-[180px]"
                >
                  <Tricolore className="w-7 h-5" />
                  <span className="mt-3 text-sm font-semibold text-[#12172B]">{tx.franceBientot}</span>
                  <span className="mt-1 text-[13px] text-[#6B6F7C]">{tx.franceBientotTexte}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
