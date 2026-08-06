"use client";

import { createContext, useContext, useState, useEffect } from "react";

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
  };

  const retirerArticle = (id) => {
    setArticles((prev) => prev.filter((a) => a.id !== id));
  };

  const total = articles.reduce((somme, a) => somme + a.montant, 0);

  return (
    <PanierContext.Provider value={{ articles, ajouterArticle, retirerArticle, total }}>
      {children}
    </PanierContext.Provider>
  );
}

export function usePanier() {
  return useContext(PanierContext);
}