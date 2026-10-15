"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { supabase } from "../../../lib/supabase";
import { fetchSession } from "../../../lib/fetchSession";
import SoldeCashback from "../components/SoldeCashback";
import { ChampMotDePasse, motDePasseValide } from "../components/CadreCompte";
import { anniversaireValide, JOURS_AVANT_RAPPEL } from "../../../lib/rappelsAnniversaire";
import { POINTS_NEWSLETTER } from "../../../lib/newsletter";

const ONGLETS = ["infos", "commandes", "cashback", "beneficiaires", "cagnottes", "securite"];
const PALIERS = [
  { cle: "bronze", seuil: 0, couleur: "#B08D57" },
  { cle: "argent", seuil: 100, couleur: "#C0C0C0" },
  { cle: "or", seuil: 300, couleur: "#C9A227" },
  { cle: "platine", seuil: 700, couleur: "#E5E4E2" },
];
const COULEURS_AVATAR = ["#C9A227", "#E5604D", "#5B3A5C", "#2E7D6B", "#3A5A8C", "#B5563F", "#8C6A3A", "#4A4A6A"];
const AVATARS = Array.from({ length: 7 }, (_, i) => `/avatars/avatar-${i + 1}.svg`);

const champ = "w-full bg-ivory/[0.04] border border-ivory/20 rounded-lg px-4 py-3 text-ivory outline-none focus:border-gold/60 transition-colors";
const libelle = "block text-sm text-ivory/70 mb-2";

/** Deux listes (jour, mois) pour l'anniversaire d'un bénéficiaire */
function ChampAnniversaire({ jour, mois, onChange, id }) {
  const t = useTranslations("profil");
  const locale = useLocale();
  const classe = "bg-ivory/[0.04] border border-ivory/20 rounded-lg px-3 py-2.5 text-ivory text-sm [color-scheme:dark]";
  const nomsMois = Array.from({ length: 12 }, (_, i) =>
    new Date(Date.UTC(2000, i, 15)).toLocaleDateString(locale, { month: "long", timeZone: "UTC" })
  );
  return (
    <div className="flex gap-2">
      <select id={id} aria-label={t("jour")} value={jour} onChange={(e) => onChange(e.target.value, mois)} className={classe}>
        <option value="" className="bg-ink">{t("jour")}</option>
        {Array.from({ length: 31 }, (_, i) => i + 1).map((j) => <option key={j} value={j} className="bg-ink">{j}</option>)}
      </select>
      <select aria-label={t("mois")} value={mois} onChange={(e) => onChange(jour, e.target.value)} className={`${classe} flex-1`}>
        <option value="" className="bg-ink">{t("mois")}</option>
        {nomsMois.map((m, i) => <option key={m} value={i + 1} className="bg-ink">{m}</option>)}
      </select>
    </div>
  );
}

export default function Profil() {
  const t = useTranslations("profil");
  const tFid = useTranslations("fideliteAccueil");
  const tCompte = useTranslations("compte");
  const locale = useLocale();
  const euros = (n) => new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" }).format(Number(n) || 0);
  const dateLongue = (d) => new Date(d).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
  const jourMois = (j, m) => new Date(Date.UTC(2000, m - 1, j)).toLocaleDateString(locale, { day: "numeric", month: "long", timeZone: "UTC" });

  const [utilisateur, setUtilisateur] = useState(null);
  const [onglet, setOnglet] = useState("infos");
  const [chargement, setChargement] = useState(true);

  // Infos perso
  const [pseudo, setPseudo] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [genre, setGenre] = useState("");
  const [enseigneFavorite, setEnseigneFavorite] = useState("");
  const [catalogue, setCatalogue] = useState([]);
  const [accepteMarketing, setAccepteMarketing] = useState(false);
  const [couleurAvatar, setCouleurAvatar] = useState("#C9A227");
  const [avatarIllustration, setAvatarIllustration] = useState(null);
  const [enregistrementInfos, setEnregistrementInfos] = useState(false);
  const [messageInfos, setMessageInfos] = useState(null); // { texte, ok }

  // Commandes et points
  const [commandes, setCommandes] = useState([]);
  const [points, setPoints] = useState(0);

  // Bénéficiaires
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouvelEmailBenef, setNouvelEmailBenef] = useState("");
  const [ajoutBenef, setAjoutBenef] = useState(false);
  const [nouvelAnniv, setNouvelAnniv] = useState({ jour: "", mois: "" });
  const [erreurBenef, setErreurBenef] = useState("");
  const [annivEnEdition, setAnnivEnEdition] = useState(null); // { id, jour, mois }

  // Cagnottes
  const [cagnottes, setCagnottes] = useState([]);

  // Sécurité
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [messageSecurite, setMessageSecurite] = useState(null); // { texte, ok }
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [suppression, setSuppression] = useState(false);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `/${locale}/connexion`;
        return;
      }
      setUtilisateur(user);
      // Lien direct vers un onglet (ex. depuis l'email de rappel : ?onglet=beneficiaires)
      const ongletDemande = new URLSearchParams(window.location.search).get("onglet");
      if (ONGLETS.includes(ongletDemande)) setOnglet(ongletDemande);

      let { data: profil } = await supabase.from("profils").select("*").eq("id", user.id).maybeSingle();
      if (!profil) {
        await supabase.from("profils").insert({ id: user.id, email: user.email });
        profil = { email: user.email };
      } else if (profil.email !== user.email) {
        await supabase.from("profils").update({ email: user.email }).eq("id", user.id);
      }
      setPrenom(profil.prenom || "");
      setNom(profil.nom || "");
      setTelephone(profil.telephone || "");
      setPseudo(profil.pseudo || "");
      setAccepteMarketing(profil.accepte_marketing || false);
      setCouleurAvatar(profil.couleur_avatar || "#C9A227");
      setAvatarIllustration(profil.avatar_illustration || null);
      setDateNaissance(profil.date_naissance || "");
      setGenre(profil.genre || "");
      setEnseigneFavorite(profil.enseigne_favorite || "");
      setPoints(profil.points || 0);

      const [{ data: mesCommandes }, { data: mesBeneficiaires }, { data: cagnottesCreees }, { data: contribs }, { data: catalogueData }] =
        await Promise.all([
          supabase.from("commandes").select("*").eq("email_acheteur", user.email).order("created_at", { ascending: false }),
          supabase.from("beneficiaires").select("*").eq("profil_id", user.id).order("created_at", { ascending: false }),
          supabase.from("cagnottes").select("*").eq("email_createur", user.email),
          supabase.from("contributions_cagnotte").select("cagnotte_id").eq("email_contributeur", user.email).eq("statut", "payee"),
          supabase.from("catalogue").select("nom, slug").eq("actif", true).order("nom", { ascending: true }),
        ]);
      setCommandes(mesCommandes || []);
      setBeneficiaires(mesBeneficiaires || []);
      setCatalogue(catalogueData || []);

      let cagnottesContribuees = [];
      if (contribs?.length) {
        const ids = [...new Set(contribs.map((c) => c.cagnotte_id))];
        const { data } = await supabase.from("cagnottes").select("*").in("id", ids);
        cagnottesContribuees = data || [];
      }
      const toutes = [...(cagnottesCreees || []), ...cagnottesContribuees].filter(
        (c, i, liste) => liste.findIndex((x) => x.id === c.id) === i
      );
      const avecContributeurs = await Promise.all(
        toutes.map(async (c) => {
          const { count } = await supabase
            .from("contributions_cagnotte")
            .select("*", { count: "exact", head: true })
            .eq("cagnotte_id", c.id)
            .eq("statut", "payee");
          return { ...c, nombreContributeurs: count || 0 };
        })
      );
      setCagnottes(avecContributeurs);
      setChargement(false);
    };
    charger();
  }, [locale]);

  const changerOnglet = (o) => {
    setOnglet(o);
    const url = new URL(window.location.href);
    url.searchParams.set("onglet", o);
    window.history.replaceState(null, "", url);
  };

  const handleEnregistrerInfos = async (e) => {
    e.preventDefault();
    setEnregistrementInfos(true);
    setMessageInfos(null);
    const { data: profilEnregistre, error } = await supabase.from("profils").upsert({
      id: utilisateur.id,
      prenom,
      nom,
      telephone,
      pseudo,
      accepte_marketing: accepteMarketing,
      couleur_avatar: couleurAvatar,
      avatar_illustration: avatarIllustration,
      date_naissance: dateNaissance || null,
      genre: genre || null,
      enseigne_favorite: enseigneFavorite || null,
    }).select("points").single();
    if (error) {
      console.error(error);
      setMessageInfos({ texte: t("erreur"), ok: false });
    } else {
      setMessageInfos({ texte: t("infosOk"), ok: true });
      // Les points peuvent changer (bonus newsletter)
      if (profilEnregistre) setPoints(profilEnregistre.points || 0);
    }
    setEnregistrementInfos(false);
  };

  const handleChangerMotDePasse = async (e) => {
    e.preventDefault();
    setMessageSecurite(null);
    if (!motDePasseValide(nouveauMotDePasse)) return setMessageSecurite({ texte: tCompte("mdpRegle"), ok: false });
    setEnregistrementMdp(true);
    try {
      const res = await fetchSession("/api/changer-mot-de-passe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motDePasseActuel, nouveauMotDePasse }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessageSecurite({ texte: t.has(`mdpErreur_${data.code}`) ? t(`mdpErreur_${data.code}`) : t("erreur"), ok: false });
      } else {
        setMessageSecurite({ texte: t("mdpOk"), ok: true });
        setNouveauMotDePasse("");
        setMotDePasseActuel("");
      }
    } catch {
      setMessageSecurite({ texte: t("erreur"), ok: false });
    }
    setEnregistrementMdp(false);
  };

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = `/${locale}`;
  };

  const handleSupprimerCompte = async () => {
    setSuppression(true);
    const res = await fetchSession("/api/supprimer-compte", { method: "POST" });
    if (res.ok) {
      await supabase.auth.signOut();
      window.location.href = `/${locale}`;
    } else {
      setSuppression(false);
      setMessageSecurite({ texte: t("suppressionErreur"), ok: false });
    }
  };

  // Jour/mois saisis → valeurs à enregistrer (null si vide), ou false si la date n'existe pas
  const lireAnniversaire = ({ jour, mois }) => {
    if (!jour && !mois) return { anniversaire_jour: null, anniversaire_mois: null };
    const j = Number(jour), m = Number(mois);
    return anniversaireValide(j, m) ? { anniversaire_jour: j, anniversaire_mois: m } : false;
  };

  const handleAjouterBeneficiaire = async (e) => {
    e.preventDefault();
    setErreurBenef("");
    const anniversaire = lireAnniversaire(nouvelAnniv);
    if (!anniversaire) return setErreurBenef(t("annivInvalide"));
    setAjoutBenef(true);
    const { data } = await supabase
      .from("beneficiaires")
      .insert({ profil_id: utilisateur.id, nom: nouveauNom, email: nouvelEmailBenef || null, ...anniversaire })
      .select()
      .single();
    if (data) {
      setBeneficiaires((prev) => [data, ...prev]);
      setNouveauNom("");
      setNouvelEmailBenef("");
      setNouvelAnniv({ jour: "", mois: "" });
    } else {
      setErreurBenef(t("benefErreur"));
    }
    setAjoutBenef(false);
  };

  const handleEnregistrerAnniversaire = async () => {
    setErreurBenef("");
    const anniversaire = lireAnniversaire(annivEnEdition);
    if (!anniversaire) return setErreurBenef(t("annivInvalide"));
    const { data } = await supabase
      .from("beneficiaires")
      .update({ ...anniversaire, dernier_rappel: null })
      .eq("id", annivEnEdition.id)
      .select()
      .single();
    if (data) {
      setBeneficiaires((prev) => prev.map((b) => (b.id === data.id ? data : b)));
      setAnnivEnEdition(null);
    } else {
      setErreurBenef(t("benefErreur"));
    }
  };

  const handleSupprimerBeneficiaire = async (id) => {
    await supabase.from("beneficiaires").delete().eq("id", id);
    setBeneficiaires((prev) => prev.filter((b) => b.id !== id));
  };

  if (chargement) {
    return (
      <div className="max-w-[440px] mx-auto px-6 pt-40 pb-24 text-center" role="status">
        <div className="mx-auto w-10 h-10 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-hidden />
        <p className="mt-6 text-ivory/60">{t("chargement")}</p>
      </div>
    );
  }

  const palierActuel = [...PALIERS].reverse().find((p) => points >= p.seuil) || PALIERS[0];
  const prochainPalier = PALIERS.find((p) => p.seuil > points);
  const progression = prochainPalier
    ? Math.min(100, ((points - palierActuel.seuil) / (prochainPalier.seuil - palierActuel.seuil)) * 100)
    : 100;
  const initiale = (pseudo || prenom || utilisateur?.email || "?").charAt(0).toUpperCase();
  const statutCommande = (c) => {
    if (["a_programmer", "envoi_en_cours"].includes(c.statut)) return t("statut_programmee");
    return t.has(`statut_${c.statut}`) ? t(`statut_${c.statut}`) : c.statut;
  };

  return (
    <div className="max-w-[760px] mx-auto px-6 pt-28 md:pt-32 pb-20">
      {/* En-tête : avatar, nom, palier */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full overflow-hidden shrink-0 flex items-center justify-center text-2xl font-semibold text-ink font-[family-name:var(--font-fraunces)]"
          style={{ backgroundColor: couleurAvatar }}>
          {avatarIllustration ? <img src={avatarIllustration} alt="" className="w-full h-full object-cover" /> : initiale}
        </div>
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold text-ivory truncate">{pseudo || prenom ? t("bonjour", { nom: pseudo || prenom }) : t("titre")}</h1>
          <p className="text-sm text-ivory/55 truncate">{utilisateur.email}</p>
        </div>
      </div>

      <a href={`/${locale}/fidelite`} className="mt-6 block rounded-2xl border border-ivory/15 bg-ivory/[0.03] p-5 hover:border-ivory/30 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center text-ink font-semibold font-[family-name:var(--font-fraunces)]"
              style={{ background: `radial-gradient(circle at 30% 30%, #fff8, transparent 45%), ${palierActuel.couleur}` }}>
              {tFid(`${palierActuel.cle}Nom`).charAt(0)}
            </span>
            <div>
              <p className="text-ivory font-semibold">{tFid(`${palierActuel.cle}Nom`)}</p>
              <p className="text-sm text-ivory/60">{t("points", { n: points })}</p>
            </div>
          </div>
          <span className="text-sm text-gold whitespace-nowrap">{t("voirProgramme")} ›</span>
        </div>
        <div className="mt-4 h-1.5 rounded-full bg-ivory/10 overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${progression}%`, background: prochainPalier?.couleur || palierActuel.couleur }} />
        </div>
        <p className="mt-2 text-xs text-ivory/50">
          {prochainPalier ? t("encore", { n: prochainPalier.seuil - points, palier: tFid(`${prochainPalier.cle}Nom`) }) : t("max")}
        </p>
      </a>

      {/* Onglets (défilent à l'horizontale sur téléphone) */}
      <div className="-mx-6 px-6 mt-8 mb-8 overflow-x-auto [scrollbar-width:none]">
        <div role="tablist" className="flex gap-6 min-w-full w-max border-b border-ivory/10">
          {ONGLETS.map((o) => (
            <button key={o} role="tab" aria-selected={onglet === o} onClick={() => changerOnglet(o)}
              className={`relative pb-3 text-[15px] whitespace-nowrap transition-colors ${
                onglet === o ? "text-ivory font-medium" : "text-ivory/50 hover:text-ivory/85"
              }`}>
              {t(`onglet_${o}`)}
              <span aria-hidden className={`absolute left-0 right-0 -bottom-px h-[2px] bg-gold transition-opacity ${onglet === o ? "opacity-100" : "opacity-0"}`} />
            </button>
          ))}
        </div>
      </div>

      {onglet === "infos" && (
        <form onSubmit={handleEnregistrerInfos} className="space-y-6">
          <div>
            <p className={libelle}>{t("avatar")}</p>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setAvatarIllustration(null)} aria-pressed={!avatarIllustration} aria-label={t("avatarInitiale")}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold text-ink font-[family-name:var(--font-fraunces)] transition-all ${
                  !avatarIllustration ? "ring-2 ring-offset-2 ring-offset-ink ring-gold" : "opacity-70 hover:opacity-100"
                }`} style={{ backgroundColor: couleurAvatar }}>
                {initiale}
              </button>
              {AVATARS.map((src, i) => (
                <button key={src} type="button" onClick={() => setAvatarIllustration(src)} aria-pressed={avatarIllustration === src}
                  aria-label={t("avatarNumero", { n: i + 1 })}
                  className={`w-14 h-14 rounded-full overflow-hidden transition-all ${
                    avatarIllustration === src ? "ring-2 ring-offset-2 ring-offset-ink ring-gold" : "opacity-70 hover:opacity-100"
                  }`} style={{ backgroundColor: couleurAvatar }}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className={`${libelle} mt-5`}>{t("couleurFond")}</p>
            <div className="flex flex-wrap gap-3">
              {COULEURS_AVATAR.map((c) => (
                <button key={c} type="button" onClick={() => setCouleurAvatar(c)} aria-pressed={couleurAvatar === c}
                  aria-label={t("couleur", { c })}
                  className={`w-9 h-9 rounded-full transition-all ${couleurAvatar === c ? "ring-2 ring-offset-2 ring-offset-ink ring-gold" : "opacity-70 hover:opacity-100"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="pf-pseudo" className={libelle}>{t("pseudo")}</label>
              <input id="pf-pseudo" type="text" value={pseudo} onChange={(e) => setPseudo(e.target.value)} maxLength={20} className={champ} />
            </div>
            <div>
              <label htmlFor="pf-tel" className={libelle}>{t("telephone")}</label>
              <input id="pf-tel" type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} autoComplete="tel" className={champ} />
            </div>
            <div>
              <label htmlFor="pf-prenom" className={libelle}>{t("prenom")}</label>
              <input id="pf-prenom" type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)} autoComplete="given-name" className={champ} />
            </div>
            <div>
              <label htmlFor="pf-nom" className={libelle}>{t("nom")}</label>
              <input id="pf-nom" type="text" value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="family-name" className={champ} />
            </div>
            <div>
              <label htmlFor="pf-naissance" className={libelle}>{t("dateNaissance")}</label>
              <input id="pf-naissance" type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)}
                className={`${champ} [color-scheme:dark]`} />
              <p className="mt-1 text-xs text-ivory/45">{t("dateNaissanceAide")}</p>
            </div>
            <div>
              <label htmlFor="pf-genre" className={libelle}>{t("genre")}</label>
              <select id="pf-genre" value={genre} onChange={(e) => setGenre(e.target.value)} className={`${champ} [color-scheme:dark]`}>
                <option value="" className="bg-ink">{t("genreNon")}</option>
                <option value="femme" className="bg-ink">{t("genreFemme")}</option>
                <option value="homme" className="bg-ink">{t("genreHomme")}</option>
                <option value="autre" className="bg-ink">{t("genreAutre")}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="pf-enseigne" className={libelle}>{t("enseigneFavorite")}</label>
            <select id="pf-enseigne" value={enseigneFavorite} onChange={(e) => setEnseigneFavorite(e.target.value)} className={`${champ} [color-scheme:dark]`}>
              <option value="" className="bg-ink">{t("aucunePreference")}</option>
              {catalogue.map((c) => <option key={c.slug} value={c.nom} className="bg-ink">{c.nom}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 text-sm text-ivory/75 cursor-pointer">
            <input type="checkbox" checked={accepteMarketing} onChange={(e) => setAccepteMarketing(e.target.checked)}
              className="mt-1 w-4 h-4 shrink-0 accent-[#C9A227]" />
            <span>
              {t("newsletter")}
              <span className="block text-xs text-gold/80 mt-0.5">{t("newsletterBonus", { points: POINTS_NEWSLETTER })}</span>
            </span>
          </label>

          <button type="submit" disabled={enregistrementInfos}
            className="w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40">
            {enregistrementInfos ? t("enregistrement") : t("enregistrer")}
          </button>
          {messageInfos && <p role="status" className={`text-sm ${messageInfos.ok ? "text-vert" : "text-corail"}`}>{messageInfos.texte}</p>}
        </form>
      )}

      {onglet === "cashback" && <SoldeCashback />}

      {onglet === "commandes" && (
        commandes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-ivory/60">{t("aucuneCommande")}</p>
            <a href={`/${locale}/boutique`} className="inline-block mt-5 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90">{t("offrir")}</a>
          </div>
        ) : (
          <ul className="space-y-3">
            {commandes.map((c) => {
              const programmee = c.date_envoi && (c.statut === "a_programmer" || new Date(`${c.date_envoi}T${c.heure_envoi || "00:00"}`) > new Date());
              return (
                <li key={c.id} className="border border-ivory/10 rounded-xl p-4 flex justify-between items-start gap-4">
                  <div className="min-w-0">
                    <p className="text-ivory font-medium truncate">{c.marque}</p>
                    {c.beneficiaire && <p className="text-sm text-ivory/55 truncate">{t("pour", { prenom: c.beneficiaire })}</p>}
                    <p className="text-xs text-ivory/45 mt-1">{t("commandeeLe", { date: dateLongue(c.created_at) })}</p>
                    <p className={`text-xs mt-1 ${programmee ? "text-gold/85" : "text-vert/85"}`}>
                      {c.date_envoi
                        ? t(programmee ? "envoiPrevu" : "envoyeeLe", {
                            date: new Date(`${c.date_envoi}T12:00:00Z`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }),
                            heure: c.heure_envoi || "",
                          })
                        : t("envoyeeImmediatement")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-ivory font-semibold">{euros(c.montant)}</p>
                    <span className="text-xs text-gold/80">{statutCommande(c)}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}

      {onglet === "beneficiaires" && (
        <div>
          <p className="text-sm text-ivory/60 mb-5">{t("benefIntro", { jours: JOURS_AVANT_RAPPEL })}</p>
          <form onSubmit={handleAjouterBeneficiaire} className="mb-8 border border-ivory/10 rounded-xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="b-nom" className={libelle}>{t("benefNom")}</label>
                <input id="b-nom" type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} required
                  placeholder={t("benefNomExemple")} className={champ} />
              </div>
              <div>
                <label htmlFor="b-email" className={libelle}>{t("benefEmail")}</label>
                <input id="b-email" type="email" value={nouvelEmailBenef} onChange={(e) => setNouvelEmailBenef(e.target.value)}
                  placeholder={t("benefEmailExemple")} className={champ} />
              </div>
            </div>
            <div>
              <label htmlFor="anniv-nouveau" className={libelle}>{t("benefAnniv")}</label>
              <ChampAnniversaire id="anniv-nouveau" jour={nouvelAnniv.jour} mois={nouvelAnniv.mois}
                onChange={(jour, mois) => setNouvelAnniv({ jour, mois })} />
              <p className="mt-1.5 text-xs text-ivory/45">{t("benefRappel", { jours: JOURS_AVANT_RAPPEL })}</p>
            </div>
            <button type="submit" disabled={ajoutBenef}
              className="bg-gold text-ink text-sm font-semibold rounded-lg px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40">
              {ajoutBenef ? t("ajout") : t("ajouter")}
            </button>
          </form>
          {erreurBenef && <p className="-mt-4 mb-6 text-sm text-corail">{erreurBenef}</p>}

          {beneficiaires.length === 0 ? (
            <p className="text-ivory/55 text-sm">{t("aucunBenef")}</p>
          ) : (
            <ul className="space-y-3">
              {beneficiaires.map((b) => (
                <li key={b.id} className="border border-ivory/10 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-ivory font-medium truncate">{b.nom}</p>
                      {b.email && <p className="text-sm text-ivory/55 truncate">{b.email}</p>}
                      {annivEnEdition?.id !== b.id && (
                        b.anniversaire_mois ? (
                          <button type="button" onClick={() => setAnnivEnEdition({ id: b.id, jour: String(b.anniversaire_jour), mois: String(b.anniversaire_mois) })}
                            className="mt-1 text-xs text-gold/85 hover:text-gold">
                            {t("annivLe", { date: jourMois(b.anniversaire_jour, b.anniversaire_mois) })}<span className="ml-2 underline underline-offset-2">{t("modifier")}</span>
                          </button>
                        ) : (
                          <button type="button" onClick={() => setAnnivEnEdition({ id: b.id, jour: "", mois: "" })}
                            className="mt-1 text-xs text-ivory/50 hover:text-gold underline underline-offset-2">
                            {t("ajouterAnniv")}
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <a href={`/${locale}/boutique?pour=${encodeURIComponent(b.nom)}`} className="text-sm text-gold/85 hover:text-gold">{t("offrirCourt")}</a>
                      <button onClick={() => handleSupprimerBeneficiaire(b.id)} className="text-ivory/45 hover:text-corail transition-colors text-sm">{t("retirer")}</button>
                    </div>
                  </div>
                  {annivEnEdition?.id === b.id && (
                    <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
                      <div className="sm:w-72">
                        <ChampAnniversaire jour={annivEnEdition.jour} mois={annivEnEdition.mois}
                          onChange={(jour, mois) => setAnnivEnEdition({ ...annivEnEdition, jour, mois })} />
                      </div>
                      <div className="flex gap-3 items-center">
                        <button type="button" onClick={handleEnregistrerAnniversaire}
                          className="bg-gold text-ink text-sm font-medium rounded-lg px-4 py-2 hover:bg-gold/90">{t("enregistrer")}</button>
                        <button type="button" onClick={() => setAnnivEnEdition(null)} className="text-sm text-ivory/55 hover:text-ivory">{t("annuler")}</button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {onglet === "cagnottes" && (
        cagnottes.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-ivory/60">{t("aucuneCagnotte")}</p>
            <a href={`/${locale}/cagnotte/creer`} className="inline-block mt-5 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90">{t("creerCagnotte")}</a>
          </div>
        ) : (
          <div className="space-y-4">
            {cagnottes.map((c) => {
              const pourcentage = c.montant_libre ? 100 : Math.min(100, Math.round((c.montant_collecte / c.montant_objectif) * 100));
              const statut = c.statut === "cloturee" ? t("cagnotteCloturee") : c.statut === "attente_choix" ? t("cagnotteAttente") : t("cagnotteOuverte");
              const fonce = c.texte_fonce;
              return (
                <a key={c.id} href={`/${locale}/cagnotte/${c.slug}`}
                  className="block border border-ivory/10 rounded-xl overflow-hidden hover:border-gold/30 transition-colors">
                  <div className="relative p-5" style={{ background: c.background || "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)" }}>
                    <div aria-hidden className="absolute inset-0 opacity-[0.07]" style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }} />
                    <div className="relative flex items-center justify-between">
                      <span className={`text-sm font-medium ${fonce ? "text-ink" : "text-white"}`}>{t("pour", { prenom: c.beneficiaire })}</span>
                      <span className="text-gold/80 text-[10px] tracking-[0.2em] font-[family-name:var(--font-space-mono)]">ESTALVIAR</span>
                    </div>
                    <div className="relative mt-4">
                      <p className={`text-3xl font-semibold font-[family-name:var(--font-fraunces)] ${fonce ? "text-ink" : "text-white"}`}>
                        {euros(c.montant_collecte)}
                        {!c.montant_libre && <span className={`text-sm font-sans ml-2 ${fonce ? "text-ink/45" : "text-white/45"}`}>/ {euros(c.montant_objectif)}</span>}
                      </p>
                      <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-gold rounded-full" style={{ width: `${pourcentage}%` }} />
                      </div>
                      <p className={`text-xs mt-2 ${fonce ? "text-ink/45" : "text-white/50"}`}>{t("contributeurs", { n: c.nombreContributeurs || 0 })}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-5 py-3 bg-ivory/[0.03]">
                    <p className="text-xs text-ivory/50">{c.email_createur === utilisateur.email ? t("creeeParVous") : t("vousAvezContribue")}</p>
                    <span className="text-xs text-gold/80">{statut}</span>
                  </div>
                </a>
              );
            })}
          </div>
        )
      )}

      {onglet === "securite" && (
        <div className="space-y-10">
          <div>
            <p className={libelle}>{t("adresseEmail")}</p>
            <p className="w-full bg-ivory/5 border border-ivory/10 rounded-lg px-4 py-3 text-ivory/65 break-all">{utilisateur.email}</p>
            <p className="mt-2 text-xs text-ivory/45">{t("emailFixe")}</p>
          </div>

          <form onSubmit={handleChangerMotDePasse}>
            <h2 className="text-lg font-semibold text-ivory mb-4">{t("changerMdp")}</h2>
            <label htmlFor="s-actuel" className={libelle}>{t("mdpActuel")}</label>
            <ChampMotDePasse id="s-actuel" value={motDePasseActuel} onChange={(e) => setMotDePasseActuel(e.target.value)} />
            <label htmlFor="s-nouveau" className={`${libelle} mt-4`}>{t("mdpNouveau")}</label>
            <ChampMotDePasse id="s-nouveau" value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} autoComplete="new-password" minLength={8} />
            <p className="mt-1.5 text-xs text-ivory/45">{tCompte("mdpRegle")}</p>
            <button type="submit" disabled={enregistrementMdp || !nouveauMotDePasse || !motDePasseActuel}
              className="mt-4 border border-gold text-gold font-medium rounded-lg px-6 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40">
              {enregistrementMdp ? t("enregistrement") : t("changerMdp")}
            </button>
          </form>

          {messageSecurite && <p role="status" className={`text-sm ${messageSecurite.ok ? "text-vert" : "text-corail"}`}>{messageSecurite.texte}</p>}

          <div className="border-t border-ivory/10 pt-8 flex flex-wrap items-center justify-between gap-4">
            <button onClick={handleDeconnexion} className="text-sm text-ivory/60 hover:text-ivory transition-colors">{t("deconnexion")}</button>
            {!confirmationSuppression ? (
              <button onClick={() => setConfirmationSuppression(true)} className="text-sm text-corail/75 hover:text-corail transition-colors">
                {t("supprimer")}
              </button>
            ) : (
              <div className="w-full rounded-xl border border-corail/40 bg-corail/10 p-4">
                <p className="text-sm text-ivory/80">{t("supprimerAvertissement")}</p>
                <div className="mt-3 flex gap-4">
                  <button onClick={handleSupprimerCompte} disabled={suppression} className="text-sm text-corail font-medium hover:underline disabled:opacity-40">
                    {suppression ? t("suppression") : t("supprimerOui")}
                  </button>
                  <button onClick={() => setConfirmationSuppression(false)} className="text-sm text-ivory/60 hover:text-ivory">{t("annuler")}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
