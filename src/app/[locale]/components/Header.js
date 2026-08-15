"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePanier } from "../context/PanierContext";
import { supabase } from "../../../lib/supabase";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const { articles } = usePanier();
  const segments = pathname.split("/");
  const pathWithoutLocale = "/" + segments.slice(2).join("/");

  const [utilisateur, setUtilisateur] = useState(null);
  const [prenom, setPrenom] = useState("");
  const [points, setPoints] = useState(0);

  const paliers = [
    { nom: "Bronze", seuil: 0, couleur: "#B08D57" },
    { nom: "Argent", seuil: 100, couleur: "#C0C0C0" },
    { nom: "Or", seuil: 300, couleur: "#C9A227" },
    { nom: "Platine", seuil: 700, couleur: "#E5E4E2" },
  ];
  const palierActuel = [...paliers].reverse().find((p) => points >= p.seuil) || paliers[0];

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUtilisateur(user);

      if (user) {
        const { data: profil } = await supabase
          .from("profils")
          .select("prenom, points")
          .eq("id", user.id)
          .single();

        if (profil) {
          setPrenom(profil.prenom || "");
          setPoints(profil.points || 0);
        }
      }
    };

    charger();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      charger();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const langues = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "es", label: "ES" },
    { code: "it", label: "IT" },
  ];
  return (
    <header className="fixed top-0 left-0 right-0 h-[74px] bg-ink/80 backdrop-blur-md border-b border-ivory/10 z-50">
      <div className="max-w-[1240px] mx-auto h-full px-6 flex items-center justify-between">

       <a href={`/${segments[1]}`} className="text-xl font-semibold uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
          Estalviar<span className="text-gold">.</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-ivory/80">
          <a href={`/${segments[1]}/boutique`} className="hover:text-ivory transition-colors">{t("boutique")}</a>
          <a href={`/${segments[1]}/cagnotte/creer`} className="hover:text-ivory transition-colors">{t("cagnotte")}</a>
          <a href={`/${segments[1]}/professionnels`} className="hover:text-ivory transition-colors">{t("professionnels")}</a>
          <a href={`/${segments[1]}/fidelite`} className="hover:text-ivory transition-colors">{t("fidelite")}</a>
          <a href={`/${segments[1]}/aide`} className="hover:text-ivory transition-colors">{t("aide")}</a>
        </nav>

        <div className="flex items-center gap-4">
          <select
            defaultValue={segments[1]}
            onChange={(e) => {
              router.push(`/${e.target.value}${pathWithoutLocale}`);
            }}
            className="bg-transparent text-ivory/80 hover:text-ivory text-sm border border-ivory/20 rounded px-2 py-1"
          >
            {langues.map((l) => (
              <option key={l.code} value={l.code} className="bg-ink text-ivory">
                {l.label}
              </option>
            ))}
          </select>
          <a href={`/${segments[1]}/panier`} className="relative text-ivory/80 hover:text-ivory">
            🛒
            {articles.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold text-ink text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {articles.length}
              </span>
            )}
          </a>
          {utilisateur ? (
            <a href={`/${segments[1]}/profil`} className="flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="text-ivory/90 text-sm">{prenom || utilisateur.email.split("@")[0]}</span>
              <span
                className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${palierActuel.couleur}20`, color: palierActuel.couleur }}
              >
                {palierActuel.nom}
              </span>
            </a>
          ) : (
            <a href={`/${segments[1]}/connexion`} className="text-ivory/80 hover:text-ivory text-sm">{t("connexion")}</a>
          )}
        </div>

      </div>
    </header>
  );
}