"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { SECTIONS, aLeDroit } from "../../../lib/admin";
import { lireAccesAdmin } from "../../../lib/accesAdmin";
import { adminLire } from "../../../lib/adminDb";

export default function Admin() {
  const [chargement, setChargement] = useState(true);
  const [acces, setAcces] = useState(null);
  const [stats, setStats] = useState({ commandes: null, ca: null, demandesPro: null, cagnottes: null });

  useEffect(() => {
    const verifier = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const monAcces = user ? await lireAccesAdmin() : null;
      if (!monAcces) {
        window.location.href = "/fr";
        return;
      }
      setAcces(monAcces);

      // Chaque chiffre n'est chargé que si la personne a accès à la section correspondante
      const [commandes, demandesPro, cagnottes] = await Promise.all([
        aLeDroit(monAcces, ["commandes", "statistiques"]) ? adminLire("commandes") : { data: null },
        aLeDroit(monAcces, "demandes-pro") ? adminLire("demandes_pro") : { data: null },
        aLeDroit(monAcces, "cagnottes") ? adminLire("cagnottes") : { data: null },
      ]);
      setStats({
        commandes: commandes.data ? commandes.data.length : null,
        ca: commandes.data ? commandes.data.reduce((s, c) => s + Number(c.montant || 0), 0) : null,
        demandesPro: demandesPro.data ? demandesPro.data.length : null,
        cagnottes: cagnottes.data ? cagnottes.data.length : null,
      });
      setChargement(false);
    };
    verifier();
  }, []);

  if (chargement || !acces) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const chiffres = [
    { nom: "Commandes", valeur: stats.commandes },
    { nom: "Chiffre d'affaires", valeur: stats.ca === null ? null : `${new Intl.NumberFormat("fr-FR").format(stats.ca)} €` },
    { nom: "Demandes pro", valeur: stats.demandesPro },
    { nom: "Cagnottes", valeur: stats.cagnottes },
  ].filter((c) => c.valeur !== null);
  const sections = SECTIONS.filter((s) => !s.sansPage && aLeDroit(acces, s.cle));

  return (
    <div className="max-w-[1100px] mx-auto px-6 pt-32 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-ivory">Tableau de bord</h1>
          <p className="mt-1 text-sm text-ivory/50">
            Connecté en tant que {acces.email}{acces.proprietaire ? " (propriétaire)" : ""}
          </p>
        </div>
        {acces.proprietaire && (
          <a href="/fr/admin/equipe" className="text-sm text-gold underline decoration-gold/40 underline-offset-4 hover:decoration-gold">
            Équipe et accès
          </a>
        )}
      </div>

      {chiffres.length > 0 && (
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {chiffres.map((c) => (
            <div key={c.nom} className="border border-ivory/10 rounded-xl p-5">
              <dt className="text-sm text-ivory/55">{c.nom}</dt>
              <dd className="text-2xl font-semibold text-ivory mt-1">{c.valeur}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sections.map((s) => (
          <a key={s.cle} href={`/fr/admin/${s.cle}`} className="border border-ivory/10 rounded-xl p-7 hover:border-gold/40 hover:bg-ivory/[0.02] transition-colors">
            <p className="text-ivory font-medium text-lg">{s.nom}</p>
            <p className="text-sm text-ivory/50 mt-2 leading-relaxed">{s.description}</p>
            {!acces.proprietaire && acces.sections[s.cle] === "voir" && (
              <p className="mt-3 text-xs text-ivory/40">Consultation seulement</p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}
