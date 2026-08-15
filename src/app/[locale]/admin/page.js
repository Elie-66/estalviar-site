"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { estAdmin } from "../../../lib/admin";

export default function Admin() {
  const [chargement, setChargement] = useState(true);
  const [autorise, setAutorise] = useState(false);
  const [stats, setStats] = useState({ commandes: 0, ca: 0, demandesPro: 0, cagnottes: 0 });

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user || !estAdmin(user.email)) {
        window.location.href = "/fr";
        return;
      }

      setAutorise(true);

      const { data: commandes } = await supabase.from("commandes").select("montant");
      const { count: demandesPro } = await supabase.from("demandes_pro").select("*", { count: "exact", head: true });
      const { count: cagnottes } = await supabase.from("cagnottes").select("*", { count: "exact", head: true });

      const ca = (commandes || []).reduce((s, c) => s + c.montant, 0);

      setStats({
        commandes: commandes?.length || 0,
        ca,
        demandesPro: demandesPro || 0,
        cagnottes: cagnottes || 0,
      });

      setChargement(false);
    };

    verifier();
  }, []);

  if (chargement || !autorise) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Back-office</p>
      <h1 className="text-3xl font-semibold text-ivory mb-10">Tableau de bord</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Commandes</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{stats.commandes}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Chiffre d'affaires</p>
          <p className="text-2xl font-semibold text-gold mt-1">{stats.ca} €</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Demandes pro</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{stats.demandesPro}</p>
        </div>
        <div className="border border-ivory/10 rounded-xl p-5">
          <p className="text-xs text-ivory/50 uppercase tracking-wide">Cagnottes</p>
          <p className="text-2xl font-semibold text-ivory mt-1">{stats.cagnottes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        <a href="/fr/admin/commandes" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Commandes</p>
          <p className="text-sm text-ivory/50 mt-1">Voir et gérer toutes les commandes</p>
        </a>
        <a href="/fr/admin/clients" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Clients</p>
          <p className="text-sm text-ivory/50 mt-1">Comptes, fidélité et historique</p>
        </a>
        <a href="/fr/admin/demandes-pro" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Demandes pro</p>
          <p className="text-sm text-ivory/50 mt-1">Suivre les demandes de devis</p>
        </a>
        <a href="/fr/admin/cagnottes" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Cagnottes</p>
          <p className="text-sm text-ivory/50 mt-1">Suivre les cagnottes en cours</p>
        </a>
        <a href="/fr/admin/catalogue" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Catalogue</p>
          <p className="text-sm text-ivory/50 mt-1">Ajouter, modifier, désactiver des enseignes</p>
        </a>
        <a href="/fr/admin/statistiques" className="border border-ivory/10 rounded-xl p-6 hover:border-gold/40 transition-colors">
          <p className="text-ivory font-medium">Statistiques</p>
          <p className="text-sm text-ivory/50 mt-1">Ventes, top enseignes, top bénéficiaires</p>
        </a>
      </div>
    </div>
  );
}