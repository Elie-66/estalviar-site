"use client";

import { useTranslations } from "next-intl";
import LogoEstalviar from "./LogoEstalviar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePanier } from "../context/PanierContext";
import { supabase } from "../../../lib/supabase";
import RechercheHeader from "./RechercheHeader";

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
  const [couleurAvatar, setCouleurAvatar] = useState("#C9A227");
  const [avatarIllustration, setAvatarIllustration] = useState(null);
  const [menuOuvert, setMenuOuvert] = useState(false);

  const tPalier = useTranslations("fideliteAccueil");
  const paliers = [
    { nom: tPalier("bronzeNom"), seuil: 0, couleur: "#B08D57" },
    { nom: tPalier("argentNom"), seuil: 100, couleur: "#C0C0C0" },
    { nom: tPalier("orNom"), seuil: 300, couleur: "#C9A227" },
    { nom: tPalier("platineNom"), seuil: 700, couleur: "#E5E4E2" },
  ];
  const palierActuel = [...paliers].reverse().find((p) => points >= p.seuil) || paliers[0];
  const initiale = (prenom || utilisateur?.email || "?").charAt(0).toUpperCase();

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUtilisateur(user);

      if (user) {
        const { data: profil } = await supabase
          .from("profils")
          .select("prenom, points, couleur_avatar, pseudo, avatar_illustration")
          .eq("id", user.id)
          .single();

        if (profil) {
          setPrenom(profil.prenom || "");
          setPoints(profil.points || 0);
          setCouleurAvatar(profil.couleur_avatar || "#C9A227");
          setAvatarIllustration(profil.avatar_illustration || null);
        }
      }
    };

    charger();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      charger();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setMenuOuvert(false);
  }, [pathname]);

  const langues = [
    { code: "fr", label: "FR" },
    { code: "en", label: "EN" },
    { code: "de", label: "DE" },
    { code: "es", label: "ES" },
    { code: "it", label: "IT" },
  ];

  const liensNav = [
    { href: `/${segments[1]}/boutique`, label: t("boutique") },
    { href: `/${segments[1]}/cagnotte/creer`, label: t("cagnotte") },
    { href: `/${segments[1]}/professionnels`, label: t("professionnels") },
    { href: `/${segments[1]}/fidelite`, label: t("fidelite") },
    { href: `/${segments[1]}/aide`, label: t("aide") },
  ];

  return (
    <header className="print:hidden fixed top-0 left-0 right-0 h-[74px] bg-ink border-b border-ivory/10 z-50">
      <div className="max-w-[1240px] mx-auto h-full px-6 flex items-center gap-6">

        <LogoEstalviar
          href={`/${segments[1]}`}
          className="shrink-0 text-xl font-semibold uppercase tracking-wide text-ivory font-[family-name:var(--font-logo)]"
        />

        {/* Recherche d'enseigne, entre le logo et le menu (grands écrans) */}
        <div className="hidden lg:block flex-1 min-w-0 max-w-[360px]">
          <RechercheHeader locale={segments[1]} />
        </div>

        <nav className="hidden md:flex items-center gap-6 ml-auto shrink-0 text-[15px] text-ivory/80">
          {liensNav.map((lien) => (
            <a key={lien.href} href={lien.href} className="hover:text-ivory transition-colors">
              {lien.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4 shrink-0 ml-auto md:ml-0">
          <select
            defaultValue={segments[1]}
            onChange={(e) => {
              router.push(`/${e.target.value}${pathWithoutLocale}`);
            }}
            className="hidden sm:block bg-transparent text-ivory/80 hover:text-ivory text-sm border border-ivory/20 rounded px-2 py-1"
          >
            {langues.map((l) => (
              <option key={l.code} value={l.code} className="bg-ink text-ivory">
                {l.label}
              </option>
            ))}
          </select>
          <a href={`/${segments[1]}/panier`} aria-label={t.has("panier") ? t("panier") : "Panier"} className="relative text-ivory/80 hover:text-ivory flex items-center min-h-11">
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2" />
              <circle cx="9.5" cy="20" r="1.3" />
              <circle cx="17" cy="20" r="1.3" />
            </svg>
            {articles.length > 0 && (
              <span className="absolute top-0 -right-2 bg-gold text-ink text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                {articles.length}
              </span>
            )}
          </a>
          {utilisateur ? (
            <a href={`/${segments[1]}/profil`} className="hidden sm:flex items-center gap-2 hover:opacity-90 transition-opacity" title={prenom || utilisateur.email.split("@")[0]}>
              {avatarIllustration ? (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: couleurAvatar }}>
                  <img src={avatarIllustration} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-ink flex-shrink-0 font-[family-name:var(--font-titre)]"
                  style={{ backgroundColor: couleurAvatar }}
                >
                  {initiale}
                </div>
              )}
            </a>
          ) : (
            <a href={`/${segments[1]}/connexion`} className="hidden sm:block text-ivory/80 hover:text-ivory text-sm">{t("connexion")}</a>
          )}

          <button
            onClick={() => setMenuOuvert(!menuOuvert)}
            className="md:hidden text-ivory p-1"
            aria-label={menuOuvert ? t("fermerMenu") : t("ouvrirMenu")}
            aria-expanded={menuOuvert}
          >
            {menuOuvert ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
                <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>

      </div>

      {menuOuvert && (
        <div className="md:hidden absolute inset-x-0 top-full h-[calc(100dvh-74px)] overflow-y-auto bg-ink border-t border-ivory/10 px-6 py-6">
          <div className="mb-4">
            <RechercheHeader locale={segments[1]} id="recherche-menu" onChoix={() => setMenuOuvert(false)} />
          </div>
          <nav className="flex flex-col gap-1">
            {liensNav.map((lien) => (
              <a
                key={lien.href}
                href={lien.href}
                className="text-ivory/80 hover:text-ivory py-3 border-b border-ivory/5 transition-colors"
              >
                {lien.label}
              </a>
            ))}
          </nav>

          <div className="mt-4 pt-4 border-t border-ivory/10 flex items-center justify-between">
            {utilisateur ? (
              <a href={`/${segments[1]}/profil`} className="flex items-center gap-2">
                {avatarIllustration ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0" style={{ backgroundColor: couleurAvatar }}>
                    <img src={avatarIllustration} alt="Avatar" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-ink flex-shrink-0 font-[family-name:var(--font-titre)]"
                    style={{ backgroundColor: couleurAvatar }}
                  >
                    {initiale}
                  </div>
                )}
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

            <select
              defaultValue={segments[1]}
              onChange={(e) => {
                router.push(`/${e.target.value}${pathWithoutLocale}`);
              }}
              className="bg-transparent text-ivory/80 text-sm border border-ivory/20 rounded px-2 py-1"
            >
              {langues.map((l) => (
                <option key={l.code} value={l.code} className="bg-ink text-ivory">
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}