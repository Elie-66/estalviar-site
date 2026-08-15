"use client";

import { usePanier } from "../context/PanierContext";

export default function Panier() {
  const { articles, retirerArticle, total } = usePanier();

  if (articles.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20 text-center">
        <h1 className="text-3xl font-semibold text-ivory">Votre panier</h1>
        <p className="mt-4 text-ivory/60">Votre panier est vide pour le moment.</p>
        <a
          href="/fr/boutique"
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
        >
          Découvrir la boutique
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-10">Votre panier</h1>

      <div className="space-y-4">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex items-center gap-5 border border-ivory/10 rounded-xl p-4 hover:border-gold/20 transition-colors"
          >
            <div
              className="relative overflow-hidden w-32 aspect-[1.6/1] rounded-lg flex flex-col justify-between p-3 flex-shrink-0 border border-gold/20"
              style={{
                background: article.background,
                boxShadow: "0 10px 25px -10px #00000066",
              }}
            >
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }}
              />
              <img src={article.image} alt={article.marque} className="relative h-4 object-contain drop-shadow-md" />
              <p className={`relative text-sm font-semibold font-[family-name:var(--font-fraunces)] ${article.texteFonce ? "text-ink" : "text-white"}`}>
                {article.montant}<span className="text-xs text-gold ml-0.5">€</span>
              </p>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-ivory font-medium">{article.marque}</p>
              <p className="text-sm text-ivory/50">Design {article.design}</p>
              {article.beneficiaire && (
                <p className="text-sm text-ivory/50 truncate">Pour {article.beneficiaire}</p>
              )}
              {article.message && (
                <p className="text-sm text-ivory/40 italic truncate">"{article.message}"</p>
              )}
              {article.dateEnvoi && (
                <p className="text-sm text-gold/70 mt-1">
                  Envoi le {new Date(article.dateEnvoi).toLocaleDateString("fr-FR")} à {article.heureEnvoi}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <p className="text-ivory font-semibold text-lg">{article.montant} €</p>
              <button
                onClick={() => retirerArticle(article.id)}
                className="text-ivory/40 hover:text-corail transition-colors text-xs"
              >
                Retirer
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t border-ivory/10 pt-6 flex items-center justify-between">
        <p className="text-ivory/70">Total</p>
        <p className="text-2xl font-semibold text-ivory">{total} €</p>
      </div>

      <a
        href="/fr/paiement"
        className="mt-8 block text-center w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors"
      >
        Passer au paiement
      </a>
    </div>
  );
}