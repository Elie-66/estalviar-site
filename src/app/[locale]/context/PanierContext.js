"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { suivre } from "../../../lib/analytics";

const PanierContext = createContext(null);

export function PanierProvider({ children }) {
  const [articles, setArticles] = useState([]);
  const [charge, setCharge] = useState(false);

  useEffect(() => {
    const sauvegarde = localStorage.getItem("estalviar-panier");
    if (sauvegarde) {
      setArticles(JSON.parse(sauvegarde));
    }
    setCharge(true);
  }, []);

  useEffect(() => {
    if (charge) {
      localStorage.setItem("estalviar-panier", JSON.stringify(articles));
    }
  }, [articles, charge]);

  const ajouterArticle = (article) => {
    setArticles((prev) => [...prev, { ...article, id: Date.now() }]);
    // Jamais le bénéficiaire ni le message : seulement la marque, le montant et le design
    suivre("carte_ajoutee_panier", {
      marque: article.marque,
      slug: article.slug,
      montant: article.montant,
      design: article.design,
      envoi_programme: !!article.dateEnvoi,
    });
  };

  const retirerArticle = (id) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const videPanier = () => {
    setArticles([]);
  };

  const total = articles.reduce((somme, a) => somme + a.montant, 0);

  return (
    <PanierContext.Provider value={{ articles, ajouterArticle, retirerArticle, videPanier, total, charge }}>
      {children}
    </PanierContext.Provider>
  );
}

export function usePanier() {
  return useContext(PanierContext);
}