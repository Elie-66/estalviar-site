"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function Profil() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [onglet, setOnglet] = useState("infos");
  const [chargement, setChargement] = useState(true);

  // Infos perso
  const [pseudo, setPseudo] = useState("");
  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [accepteMarketing, setAccepteMarketing] = useState(false);
  const [enregistrementInfos, setEnregistrementInfos] = useState(false);
  const [succesInfos, setSuccesInfos] = useState(false);

  // Commandes
  const [commandes, setCommandes] = useState([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);
  const [points, setPoints] = useState(0);

  // Bénéficiaires
  const [beneficiaires, setBeneficiaires] = useState([]);
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouvelEmailBenef, setNouvelEmailBenef] = useState("");
  const [ajoutBenef, setAjoutBenef] = useState(false);

  // Cagnottes
  const [cagnottes, setCagnottes] = useState([]);

  // Sécurité
  const [nouvelEmail, setNouvelEmail] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [enregistrementEmail, setEnregistrementEmail] = useState(false);
  const [succesEmail, setSuccesEmail] = useState(false);
  const [enregistrementMdp, setEnregistrementMdp] = useState(false);
  const [succesMdp, setSuccesMdp] = useState(false);
  const [erreurSecurite, setErreurSecurite] = useState("");
  const [confirmationSuppression, setConfirmationSuppression] = useState(false);
  const [suppression, setSuppression] = useState(false);

  useEffect(() => {
    const charger = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/fr/connexion";
        return;
      }

      setUtilisateur(user);
      setNouvelEmail(user.email);

      let { data: profil } = await supabase
        .from("profils")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profil) {
        await supabase.from("profils").insert({ id: user.id, email: user.email });
        profil = { email: user.email };
      } else if (profil.email !== user.email) {
        await supabase.from("profils").update({ email: user.email }).eq("id", user.id);
      }

      if (profil) {
        setPrenom(profil.prenom || "");
        setNom(profil.nom || "");
        setTelephone(profil.telephone || "");
        setPseudo(profil.pseudo || "");
        setAccepteMarketing(profil.accepte_marketing || false);
      }

      setPoints(profil?.points || 0);

      const { data: mesCommandes } = await supabase
        .from("commandes")
        .select("*")
        .eq("email_acheteur", user.email)
        .order("created_at", { ascending: false });

      setCommandes(mesCommandes || []);
      setChargementCommandes(false);

      const { data: mesBeneficiaires } = await supabase
        .from("beneficiaires")
        .select("*")
        .eq("profil_id", user.id)
        .order("created_at", { ascending: false });

      setBeneficiaires(mesBeneficiaires || []);

      const { data: cagnottesCreees } = await supabase
        .from("cagnottes")
        .select("*")
        .eq("email_createur", user.email);

      const { data: contribs } = await supabase
        .from("contributions_cagnotte")
        .select("cagnotte_id")
        .eq("email_contributeur", user.email)
        .eq("statut", "payee");

      let cagnottesContribuees = [];
      if (contribs && contribs.length > 0) {
        const ids = [...new Set(contribs.map((c) => c.cagnotte_id))];
        const { data } = await supabase.from("cagnottes").select("*").in("id", ids);
        cagnottesContribuees = data || [];
      }

      const toutesCagnottes = [...(cagnottesCreees || []), ...cagnottesContribuees].filter(
        (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i
      );

      const cagnottesAvecContributeurs = await Promise.all(
        toutesCagnottes.map(async (c) => {
          const { count } = await supabase
            .from("contributions_cagnotte")
            .select("*", { count: "exact", head: true })
            .eq("cagnotte_id", c.id)
            .eq("statut", "payee");
          return { ...c, nombreContributeurs: count || 0 };
        })
      );

      setCagnottes(cagnottesAvecContributeurs);

      setChargement(false);
    };

    charger();
  }, []);

  const handleEnregistrerInfos = async (e) => {
    e.preventDefault();
    setEnregistrementInfos(true);
    setSuccesInfos(false);
    setErreurSecurite("");

    const { error } = await supabase.from("profils").upsert({
      id: utilisateur.id,
      prenom,
      nom,
      telephone,
      pseudo,
      accepte_marketing: accepteMarketing,
    });

    if (error) {
      console.error(error);
      setErreurSecurite(error.message);
    } else {
      setSuccesInfos(true);
    }
    setEnregistrementInfos(false);
  };

  const handleChangerEmail = async (e) => {
    e.preventDefault();
    setEnregistrementEmail(true);
    setErreurSecurite("");
    setSuccesEmail(false);

    const { error } = await supabase.auth.updateUser({ email: nouvelEmail });

    if (error) {
      setErreurSecurite(error.message);
    } else {
      setSuccesEmail(true);
    }
    setEnregistrementEmail(false);
  };

  const handleChangerMotDePasse = async (e) => {
    e.preventDefault();
    setEnregistrementMdp(true);
    setErreurSecurite("");
    setSuccesMdp(false);

    const { error } = await supabase.auth.updateUser({ password: nouveauMotDePasse });

    if (error) {
      setErreurSecurite(error.message);
    } else {
      setSuccesMdp(true);
      setNouveauMotDePasse("");
    }
    setEnregistrementMdp(false);
  };

  const handleDeconnexion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/fr";
  };

  const handleSupprimerCompte = async () => {
    setSuppression(true);
    const res = await fetch('/api/supprimer-compte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: utilisateur.id }),
    });
    if (res.ok) {
      await supabase.auth.signOut();
      window.location.href = '/fr';
    } else {
      setSuppression(false);
      setErreurSecurite('Une erreur est survenue lors de la suppression.');
    }
  };

  const handleAjouterBeneficiaire = async (e) => {
    e.preventDefault();
    setAjoutBenef(true);

    const { data } = await supabase
      .from("beneficiaires")
      .insert({ profil_id: utilisateur.id, nom: nouveauNom, email: nouvelEmailBenef || null })
      .select()
      .single();

    if (data) {
      setBeneficiaires((prev) => [data, ...prev]);
      setNouveauNom("");
      setNouvelEmailBenef("");
    }
    setAjoutBenef(false);
  };

  const handleSupprimerBeneficiaire = async (id) => {
    await supabase.from("beneficiaires").delete().eq("id", id);
    setBeneficiaires((prev) => prev.filter((b) => b.id !== id));
  };

  const paliers = [
    { nom: "Bronze", seuil: 0, couleur: "#B08D57" },
    { nom: "Argent", seuil: 100, couleur: "#C0C0C0" },
    { nom: "Or", seuil: 300, couleur: "#C9A227" },
    { nom: "Platine", seuil: 700, couleur: "#E5E4E2" },
  ];

  const palierActuel = [...paliers].reverse().find((p) => points >= p.seuil) || paliers[0];
  const prochainPalier = paliers.find((p) => p.seuil > points);

  if (chargement) {
    return (
      <div className="max-w-[440px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  const statutLabel = {
    payee: "Payée",
    a_programmer: "Programmée",
  };

  return (
    <div className="max-w-[700px] mx-auto px-6 pt-32 pb-20">
      <h1 className="text-3xl font-semibold text-ivory mb-1">Mon compte</h1>
      <p className="text-sm text-ivory/50 mb-6">{utilisateur.email}</p>

      <div className="border border-ivory/10 rounded-xl p-5 mb-8 flex items-center justify-between">
        <div>
          <span
            className="text-xs uppercase tracking-wide font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${palierActuel.couleur}20`, color: palierActuel.couleur }}
          >
            {palierActuel.nom}
          </span>
          <p className="mt-2 text-ivory text-lg font-semibold">{points} points</p>
          {prochainPalier && (
            <p className="text-xs text-ivory/40 mt-1">
              Encore {prochainPalier.seuil - points} points avant {prochainPalier.nom}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-2 border border-ivory/10 rounded-lg p-1 mb-10 flex-wrap">
        <button
          onClick={() => setOnglet("infos")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            onglet === "infos" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          Infos
        </button>
        <button
          onClick={() => setOnglet("commandes")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            onglet === "commandes" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          Commandes
        </button>
        <button
          onClick={() => setOnglet("beneficiaires")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            onglet === "beneficiaires" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          Bénéficiaires
        </button>
        <button
          onClick={() => setOnglet("cagnottes")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            onglet === "cagnottes" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          Cagnottes
        </button>
        <button
          onClick={() => setOnglet("securite")}
          className={`flex-1 text-sm py-2 rounded-md transition-colors ${
            onglet === "securite" ? "bg-gold text-ink font-medium" : "text-ivory/60 hover:text-ivory"
          }`}
        >
          Sécurité
        </button>
      </div>

      {onglet === "infos" && (
        <form onSubmit={handleEnregistrerInfos}>
          <label className="block text-sm text-ivory/70 mb-2">Pseudo</label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
            maxLength={20}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />

          <label className="block text-sm text-ivory/70 mb-2 mt-6">Prénom</label>
          <input
            type="text"
            value={prenom}
            onChange={(e) => setPrenom(e.target.value)}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />

          <label className="block text-sm text-ivory/70 mb-2 mt-6">Nom</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />

          <label className="block text-sm text-ivory/70 mb-2 mt-6">Téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
          />

          <label className="flex items-start gap-2 mt-6 text-sm text-ivory/70">
            <input
              type="checkbox"
              checked={accepteMarketing}
              onChange={(e) => setAccepteMarketing(e.target.checked)}
              className="mt-0.5"
            />
            Recevoir des emails pour les fêtes, occasions et offres spéciales
          </label>

          <button
            type="submit"
            disabled={enregistrementInfos}
            className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
          >
            {enregistrementInfos ? "Enregistrement..." : "Enregistrer"}
          </button>

          {succesInfos && <p className="mt-3 text-sm text-vert">Profil mis à jour !</p>}
          {erreurSecurite && <p className="mt-3 text-sm text-corail">{erreurSecurite}</p>}
        </form>
      )}

      {onglet === "commandes" && (
        <div>
          {chargementCommandes ? (
            <p className="text-ivory/50 text-sm">Chargement des commandes...</p>
          ) : commandes.length === 0 ? (
            <p className="text-ivory/50 text-sm">Aucune commande pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {commandes.map((c) => (
                <div key={c.id} className="border border-ivory/10 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-ivory font-medium">{c.marque}</p>
                      {c.beneficiaire && (
                        <p className="text-sm text-ivory/50">Pour {c.beneficiaire}</p>
                      )}
                      <p className="text-xs text-ivory/40 mt-1">
                        Commandée le {new Date(c.created_at).toLocaleDateString("fr-FR")}
                      </p>
                      {c.date_envoi ? (
                        <p className="text-xs text-gold/70 mt-1">
                          {c.statut === "a_programmer" ? "Envoi prévu" : "Envoyée"} le{" "}
                          {new Date(c.date_envoi).toLocaleDateString("fr-FR")}
                          {c.heure_envoi && ` à ${c.heure_envoi}`}
                        </p>
                      ) : (
                        <p className="text-xs text-vert/70 mt-1">Envoyée immédiatement</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-ivory font-semibold">{c.montant} €</p>
                      <span className="text-xs text-gold/70">
                        {statutLabel[c.statut] || c.statut}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === "beneficiaires" && (
        <div>
          <form onSubmit={handleAjouterBeneficiaire} className="mb-8 border border-ivory/10 rounded-lg p-4">
            <label className="block text-sm text-ivory/70 mb-2">Nom</label>
            <input
              type="text"
              value={nouveauNom}
              onChange={(e) => setNouveauNom(e.target.value)}
              required
              placeholder="Ex : Camille"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
            <label className="block text-sm text-ivory/70 mb-2 mt-4">Email (facultatif)</label>
            <input
              type="email"
              value={nouvelEmailBenef}
              onChange={(e) => setNouvelEmailBenef(e.target.value)}
              placeholder="camille@exemple.com"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-2.5 text-ivory text-sm"
            />
            <button
              type="submit"
              disabled={ajoutBenef}
              className="mt-4 bg-gold text-ink text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-gold/90 transition-colors disabled:opacity-40"
            >
              {ajoutBenef ? "Ajout..." : "Ajouter"}
            </button>
          </form>

          {beneficiaires.length === 0 ? (
            <p className="text-ivory/50 text-sm">Aucun bénéficiaire enregistré pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {beneficiaires.map((b) => (
                <div key={b.id} className="flex items-center justify-between border border-ivory/10 rounded-lg p-4">
                  <div>
                    <p className="text-ivory font-medium">{b.nom}</p>
                    {b.email && <p className="text-sm text-ivory/50">{b.email}</p>}
                  </div>
                  <button
                    onClick={() => handleSupprimerBeneficiaire(b.id)}
                    className="text-ivory/40 hover:text-corail transition-colors text-sm"
                  >
                    Retirer
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {onglet === "cagnottes" && (
        <div>
          {cagnottes.length === 0 ? (
            <p className="text-ivory/50 text-sm">Aucune cagnotte pour le moment.</p>
          ) : (
            <div className="space-y-4">
              {cagnottes.map((c) => {
                const pourcentage = c.montant_libre
                  ? 100
                  : Math.min(100, Math.round((c.montant_collecte / c.montant_objectif) * 100));
                const statutLabelCagnotte =
                  c.statut === "cloturee" ? "Clôturée" : c.statut === "attente_choix" ? "En attente de choix" : "Ouverte";

                return (
                  <a
                  
                    key={c.id}
                    href={`/fr/cagnotte/${c.slug}`}
                    className="block border border-ivory/10 rounded-xl overflow-hidden hover:border-gold/30 transition-colors"
                  >
                    <div
                      className="relative p-5"
                      style={{
                        background: c.background || "linear-gradient(150deg, #5B3A5C 0%, #0d1022 100%)",
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.07]"
                        style={{ background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)" }}
                      />
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm font-medium ${c.texte_fonce ? "text-ink" : "text-white"}`}>
                          Pour {c.beneficiaire}
                        </span>
                        <span className="text-gold/70 text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-space-mono)]">
                          Estalviar
                        </span>
                      </div>
                      <div className="relative mt-4">
                        <div className="flex items-end justify-between mb-2">
                          <p className={`text-3xl font-semibold font-[family-name:var(--font-fraunces)] ${c.texte_fonce ? "text-ink" : "text-white"}`}>
                            {c.montant_collecte}<span className="text-lg text-gold ml-1">€</span>
                            {!c.montant_libre && (
                              <span className={`text-sm font-sans ml-2 ${c.texte_fonce ? "text-ink/40" : "text-white/40"}`}>
                                / {c.montant_objectif} €
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-gold rounded-full" style={{ width: `${pourcentage}%` }} />
                        </div>
                        <p className={`text-xs mt-2 ${c.texte_fonce ? "text-ink/40" : "text-white/40"}`}>
                          {c.nombreContributeurs || 0} contributeur{(c.nombreContributeurs || 0) > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-5 py-3 bg-ink-secondary/50">
                      <p className="text-xs text-ivory/40">
                        {c.email_createur === utilisateur.email ? "Créée par vous" : "Vous avez contribué"}
                      </p>
                      <span className="text-xs text-gold/70">{statutLabelCagnotte}</span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      )}

      {onglet === "securite" && (
        <div className="space-y-10">
          <form onSubmit={handleChangerEmail}>
            <label className="block text-sm text-ivory/70 mb-2">Adresse email</label>
            <input
              type="email"
              value={nouvelEmail}
              onChange={(e) => setNouvelEmail(e.target.value)}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
            <button
              type="submit"
              disabled={enregistrementEmail}
              className="mt-4 bg-transparent border border-gold text-gold font-medium rounded-lg px-6 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40"
            >
              {enregistrementEmail ? "Envoi..." : "Changer l'email"}
            </button>
            {succesEmail && (
              <p className="mt-3 text-sm text-vert">
                Vérifiez votre nouvelle adresse pour confirmer le changement.
              </p>
            )}
          </form>

          <form onSubmit={handleChangerMotDePasse}>
            <label className="block text-sm text-ivory/70 mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              minLength={6}
              placeholder="Minimum 6 caractères"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
            <button
              type="submit"
              disabled={enregistrementMdp || !nouveauMotDePasse}
              className="mt-4 bg-transparent border border-gold text-gold font-medium rounded-lg px-6 py-2.5 hover:bg-gold/10 transition-colors disabled:opacity-40"
            >
              {enregistrementMdp ? "Enregistrement..." : "Changer le mot de passe"}
            </button>
            {succesMdp && <p className="mt-3 text-sm text-vert">Mot de passe mis à jour !</p>}
          </form>

          {erreurSecurite && <p className="text-sm text-corail">{erreurSecurite}</p>}

          <div className="border-t border-ivory/10 pt-8 flex items-center justify-between">
            <button
              onClick={handleDeconnexion}
              className="text-sm text-ivory/50 hover:text-ivory transition-colors"
            >
              Se déconnecter
            </button>

            {!confirmationSuppression ? (
              <button
                onClick={() => setConfirmationSuppression(true)}
                className="text-sm text-corail/70 hover:text-corail transition-colors"
              >
                Supprimer mon compte
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-xs text-ivory/50">Confirmer ?</span>
                <button
                  onClick={handleSupprimerCompte}
                  disabled={suppression}
                  className="text-sm text-corail font-medium hover:underline disabled:opacity-40"
                >
                  {suppression ? "Suppression..." : "Oui, supprimer"}
                </button>
                <button
                  onClick={() => setConfirmationSuppression(false)}
                  className="text-sm text-ivory/50 hover:text-ivory"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}