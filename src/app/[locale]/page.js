const apercus = [
  {
    nom: "Steam",
    slug: "steam",
    montant: 20,
    beneficiaire: "Lucas",
    message: "GG bien joué !",
    image: "/logos/steam.svg",
    background: "linear-gradient(150deg, #1b3a5c 0%, #0d1022 100%)",
    rotate: -18,
    translate: "-110px",
  },
  {
    nom: "Fnac",
    slug: "fnac",
    montant: 30,
    beneficiaire: "Camille",
    message: "Joyeux anniversaire !",
    image: "/logos/fnac.svg",
    background: "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)",
    rotate: 12,
    translate: "60px",
  },
  {
    nom: "Amazon",
    slug: "amazon",
    montant: 75,
    beneficiaire: "Sarah",
    message: "Pour te faire plaisir",
    image: "/logos/amazon.svg",
    background: "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)",
    rotate: -4,
    translate: "-25px",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-ink overflow-hidden">
      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 pt-40 pb-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold mb-4 flex items-center gap-2">
            <span className="w-6 h-px bg-gold" /> Cartes cadeaux personnalisables
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold text-ivory leading-tight">
            Le bon cadeau,<br />
            <span className="italic text-gold">personnalisé pour de vrai.</span>
          </h1>
          <p className="mt-6 text-ivory/60 leading-relaxed max-w-md">
            Choisissez le montant, ajoutez un nom et un message, et offrez une carte cadeau qui a l'air faite pour la personne — pas une carte cadeau générique de plus.
          </p>
          <a
            href="/fr/boutique"
            className="inline-block mt-8 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
          >
            Découvrir la boutique
          </a>
        </div>

        <div className="relative h-[360px] flex items-center justify-center">
          {apercus.map((c, i) => (
            <a
              key={c.nom}
              href={`/fr/boutique/${c.slug}`}
              className="absolute w-[260px] aspect-[1.6/1] rounded-2xl p-5 flex flex-col justify-between border border-gold/20 transition-transform duration-300 hover:!rotate-0 hover:!-translate-y-3 hover:z-50"
              style={{
                background: c.background,
                transform: `translateX(${c.translate}) rotate(${c.rotate}deg)`,
                zIndex: i,
                boxShadow: "0 25px 50px -15px #00000080",
              }}
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-[0.07]"
                style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }}
              />
              <div className="relative flex items-center justify-between">
                <img src={c.image} alt={c.nom} className="h-6 object-contain drop-shadow-md" />
                <span className="text-gold/70 text-[9px] uppercase tracking-[0.15em] font-[family-name:var(--font-space-mono)]">
                  Estalviar
                </span>
              </div>
              <div className="relative">
                <p className="text-white text-xs font-medium">Pour {c.beneficiaire}</p>
                <p className="text-white/50 text-xs italic mb-2">"{c.message}"</p>
                <div className="h-px bg-gradient-to-r from-gold/40 via-gold/10 to-transparent mb-2" />
                <p className="text-white text-2xl font-semibold font-[family-name:var(--font-fraunces)]">
                  {c.montant}<span className="text-sm text-gold ml-0.5">€</span>
                </p>
              </div>
            </a>
          ))}
        </div>

      </main>
    </div>
  );
}