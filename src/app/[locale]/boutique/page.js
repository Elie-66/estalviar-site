import Image from "next/image";
const cartes = [
  { slug: "amazon", nom: "Amazon", montantMin: 15, image: "/logos/amazon.svg" },
  { slug: "fnac", nom: "Fnac", montantMin: 15, image: "/logos/fnac.svg" },
  { slug: "steam", nom: "Steam", montantMin: 10, image: "/logos/steam.svg" },
];

export default function Boutique() {
  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-10">Toutes les enseignes</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cartes.map((carte) => (
          
           <a key={carte.slug}
            href={`/fr/boutique/${carte.slug}`}
            className="border border-ivory/10 rounded-lg p-6 text-center hover:border-gold/50 transition-colors"
          >
            <div className="h-24 flex items-center justify-center bg-white rounded-md">
              {carte.image ? (
                <Image src={carte.image} alt={carte.nom} width={80} height={80} className="object-contain" />
              ) : (
                <span className="text-ink text-sm">{carte.nom}</span>
              )}
            </div>
            <p className="mt-4 text-ivory">{carte.nom}</p>
            <p className="text-sm text-ivory/50">à partir de {carte.montantMin} €</p>
          </a>
        ))}
      </div>
    </div>
  );
}