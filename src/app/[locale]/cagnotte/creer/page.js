"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../../lib/supabase";
import SelecteurCarte from "../../components/SelecteurCarte";

const designs = [
  { id: "marque", nom: "Marque", background: (couleur = "#1b3a5c") => `linear-gradient(150deg, ${couleur} 0%, #0d1022 100%)` },
  { id: "or", nom: "Or", background: () => "linear-gradient(150deg, #C9A227 0%, #4a3a10 100%)" },
  { id: "ivoire", nom: "Ivoire", background: () => "linear-gradient(150deg, #F6F2E9 0%, #d9cdae 100%)", texteFonce: true },
  { id: "corail", nom: "Corail", background: () => "linear-gradient(150deg, #E5604D 0%, #5B3A5C 100%)" },
  { id: "ambre", nom: "Ambre", background: () => "linear-gradient(150deg, #C9A227 0%, #E5604D 100%)" },
  { id: "vert", nom: "Vert", background: () => "linear-gradient(150deg, #1f5c45 0%, #0d1022 100%)" },
  { id: "rouge", nom: "Rouge", background: () => "linear-gradient(150deg, #9c2b2b 0%, #0d1022 100%)" },
  { id: "rose", nom: "Rose", background: () => "linear-gradient(150deg, #e8a4c4 0%, #6b2f4d 100%)" },
];

export default function CreerCagnotte() {
  const [cartes, setCartes] = useState({});
  const [chargementCatalogue, setChargementCatalogue] = useState(true);
  const [slugCarte, setSlugCarte] = useState("");
  const [designId, setDesignId] = useState("marque");
  const [carteChoisie, setCarteChoisie] = useState(true);
  const [beneficiaire, setBeneficiaire] = useState("");
  const [message, setMessage] = useState("");
  const [montantLibre, setMontantLibre] = useState(false);
  const [montantObjectif, setMontantObjectif] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [envoiBeneficiaire, setEnvoiBeneficiaire] = useState(false);
  const [emailCreateur, setEmailCreateur] = useState("");
  const [emailBeneficiaire, setEmailBeneficiaire] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [lienCree, setLienCree] = useState(null);
  const [utilisateurConnecte, setUtilisateurConnecte] = useState(null);

  const carte = cartes[slugCarte];
  const designActuel = designs.find((d) => d.id === designId);

  const dateMin = new Date();
  dateMin.setDate(dateMin.getDate() + 1);
  const dateMinStr = dateMin.toISOString().split("T")[0];

  useEffect(() => {
    const charger = async () => {
      const { data } = await supabase
        .from("catalogue")
        .select("*")
        .eq("actif", true)
        .order("ordre", { ascending: true });

      const cartesParSlug = {};
      (data || []).forEach((c) => {
        cartesParSlug[c.slug] = { nom: c.nom, image: c.image, couleur: c.couleur };
      });
      setCartes(cartesParSlug);
      if (data && data.length > 0) setSlugCarte(data[0].slug);
      setChargementCatalogue(false);

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUtilisateurConnecte(user);
        setEmailCreateur(user.email);
      }
    };
    charger();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");

    const res = await fetch("/api/creer-cagnotte", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        marque: carteChoisie ? carte.nom : "Estalviar (à choisir)",
        image: carteChoisie ? carte.image : "/logos/estalviar-icone.svg",
        background: carteChoisie
          ? designActuel.background(carte.couleur)
          : designActuel.background(),
        texteFonce: !!designActuel.texteFonce,
        design: designActuel.nom,
        carteChoisie,
        beneficiaire,
        message,
        montantLibre,
        montantObjectif: montantLibre ? null : parseInt(montantObjectif),
        dateFin,
        envoiBeneficiaire,
        emailCreateur,
        emailBeneficiaire: envoiBeneficiaire ? emailBeneficiaire : null,
      }),
    });

    const data = await res.json();
    setEnvoi(false);

    if (res.ok) {
      setLienCree(data.slug);
    } else {
      setErreur(data.error || "Une erreur est survenue.");
    }
  };

  if (chargementCatalogue || !carte) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center text-ivory/60">
        Chargement...
      </div>
    );
  }

  if (lienCree) {
    const lien = typeof window !== "undefined" ? `${window.location.origin}/fr/cagnotte/${lienCree}` : "";
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-semibold text-ivory">Votre cagnotte est prête !</h1>
        <p className="mt-4 text-ivory/60">Partagez ce lien pour recueillir les contributions :</p>
        <div className="mt-6 border border-ivory/20 rounded-lg p-4 flex items-center justify-between gap-4">
          <span className="text-sm text-gold truncate">{lien}</span>
          <button
            onClick={() => navigator.clipboard.writeText(lien)}
            className="text-xs text-ivory/60 hover:text-ivory flex-shrink-0"
          >
            Copier
          </button>
        </div>
        <a
          href={`/fr/cagnotte/${lienCree}`}
          className="inline-block mt-8 bg-gold text-ink font-semibold rounded-lg px-6 py-3 hover:bg-gold/90 transition-colors"
        >
          Voir ma cagnotte
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Cagnotte</p>
      <h1 className="text-3xl font-semibold text-ivory mb-8">
        Créez une cagnotte pour un cadeau collectif
      </h1>

      <form onSubmit={handleSubmit}>

        <label className="flex items-center gap-2 text-sm text-ivory/70">
          <input
            type="checkbox"
            checked={!carteChoisie}
            onChange={(e) => setCarteChoisie(!e.target.checked)}
          />
          La carte sera choisie à la clôture (le bénéficiaire choisira lui-même)
        </label>

        <div
          className="relative overflow-hidden rounded-2xl p-8 aspect-[1.6/1] flex flex-col justify-between border border-gold/30 mt-6"
          style={{
            background: carteChoisie
              ? designActuel.background(carte.couleur)
              : designActuel.background(),
            boxShadow: `0 25px 60px -15px #00000066, 0 0 0 1px rgba(255,255,255,0.03)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: "linear-gradient(115deg, transparent 30%, white 48%, transparent 65%)",
            }}
          />

          <div className="relative flex items-center justify-between">
            {carteChoisie ? (
              <img
                src={carte.image}
                alt={carte.nom}
                className="h-8 object-contain opacity-95 drop-shadow-md"
              />
            ) : (
              <img
                src="/logos/estalviar-icone.svg"
                alt="Estalviar"
                className="h-6 object-contain opacity-95 drop-shadow-md"
              />
            )}
            {carteChoisie && (
              <span className={`text-[10px] uppercase tracking-[0.2em] font-[family-name:var(--font-space-mono)] ${designActuel.texteFonce ? "text-ink/50" : "text-gold/70"}`}>
                Estalviar
              </span>
            )}
          </div>

          <div className="relative">
            {(beneficiaire || message) && (
              <div className="mb-4">
                {beneficiaire && (
                  <p className={`text-sm font-medium ${designActuel.texteFonce ? "text-ink" : "text-white"}`}>
                    Pour {beneficiaire}
                  </p>
                )}
                {message && (
                  <p className={`text-sm italic line-clamp-2 max-w-[85%] mt-0.5 ${designActuel.texteFonce ? "text-ink/60" : "text-white/60"}`}>
                    "{message}"
                  </p>
                )}
              </div>
            )}

            <div className={`h-px mb-4 ${designActuel.texteFonce ? "bg-ink/20" : "bg-gradient-to-r from-gold/40 via-gold/10 to-transparent"}`} />

            <div className="flex items-end justify-between">
              <p className={`text-5xl font-semibold tracking-tight font-[family-name:var(--font-fraunces)] ${designActuel.texteFonce ? "text-ink" : "text-white"}`}>
                {montantLibre ? "?" : (montantObjectif || 0)}
                <span className="text-2xl text-gold ml-1">€</span>
              </p>
              <span className={`text-[10px] font-[family-name:var(--font-space-mono)] tracking-wider ${designActuel.texteFonce ? "text-ink/40" : "text-white/40"}`}>
                •••• •••• ••••
              </span>
            </div>
          </div>
        </div>

        {carteChoisie && (
          <>
            <label className="block text-sm text-ivory/70 mb-2 mt-6">Enseigne</label>
            <SelecteurCarte cartes={cartes} valeur={slugCarte} onChange={setSlugCarte} />
          </>
        )}

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Design</label>
        <div className="grid grid-cols-4 gap-2">
          {designs.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDesignId(d.id)}
              title={d.nom}
              className={`h-9 rounded-lg border-2 transition-all ${
                designId === d.id ? "border-gold scale-105" : "border-transparent opacity-70"
              }`}
              style={{ background: carteChoisie ? d.background(carte.couleur) : d.background() }}
            />
          ))}
        </div>
        {!carteChoisie && (
          <p className="mt-1 text-xs text-ivory/40">
            Le bénéficiaire pourra garder ce design ou en choisir un autre à la clôture.
          </p>
        )}

        <label className="block text-sm text-ivory/70 mb-2 mt-6">Pour qui ?</label>
        <input
          type="text"
          value={beneficiaire}
          onChange={(e) => setBeneficiaire(e.target.value)}
          required
          maxLength={30}
          placeholder="Ex : Camille"
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
        />

        <div className="flex items-center justify-between mb-2 mt-6">
          <label className="block text-sm text-ivory/70">Message</label>
          <span className="text-xs text-ivory/40">{message.length}/40</span>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={40}
          placeholder="Pourquoi cette cagnotte ?"
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory resize-none"
        />

        <label className="flex items-center gap-2 text-sm text-ivory/70 mt-6">
          <input
            type="checkbox"
            checked={montantLibre}
            onChange={(e) => setMontantLibre(e.target.checked)}
          />
          Pas de montant objectif (les contributions s'accumulent librement)
        </label>

        {!montantLibre && (
          <>
            <label className="block text-sm text-ivory/70 mb-2 mt-4">Montant objectif (€)</label>
            <input
              type="number"
              min="5"
              value={montantObjectif}
              onChange={(e) => setMontantObjectif(e.target.value)}
              required={!montantLibre}
              placeholder="Ex : 100"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
          </>
        )}

        <label className="block text-sm text-ivory/70 mb-2 mt-6">Date de clôture</label>
        <input
          type="date"
          value={dateFin}
          onChange={(e) => setDateFin(e.target.value)}
          min={dateMinStr}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory [color-scheme:dark]"
        />
        <p className="mt-1 text-xs text-ivory/40">
          À cette date, la cagnotte se clôture et la carte est préparée avec le montant collecté.
        </p>

        <label className="block text-sm text-ivory/70 mb-2 mt-6">Envoi de la carte</label>
        <div className="flex gap-2 border border-ivory/10 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setEnvoiBeneficiaire(false)}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              !envoiBeneficiaire ? "bg-gold text-ink font-medium" : "text-ivory/60"
            }`}
          >
            À mon email
          </button>
          <button
            type="button"
            onClick={() => setEnvoiBeneficiaire(true)}
            className={`flex-1 text-sm py-2 rounded-md transition-colors ${
              envoiBeneficiaire ? "bg-gold text-ink font-medium" : "text-ivory/60"
            }`}
          >
            Direct au bénéficiaire
          </button>
        </div>

        {envoiBeneficiaire && (
          <>
            <label className="block text-sm text-ivory/70 mb-2 mt-4">Email du bénéficiaire</label>
            <input
              type="email"
              value={emailBeneficiaire}
              onChange={(e) => setEmailBeneficiaire(e.target.value)}
              required={envoiBeneficiaire}
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
          </>
        )}

        {utilisateurConnecte ? (
          <p className="text-sm text-ivory/60 mt-6">
            Connecté en tant que <span className="text-gold">{emailCreateur}</span>
          </p>
        ) : (
          <>
            <label className="block text-sm text-ivory/70 mb-2 mt-6">Votre email</label>
            <input
              type="email"
              value={emailCreateur}
              onChange={(e) => setEmailCreateur(e.target.value)}
              required
              placeholder="Pour vous prévenir de l'avancement"
              className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
            />
          </>
        )}

        <button
          type="submit"
          disabled={envoi}
          className="mt-8 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {envoi ? "Création..." : "Créer la cagnotte"}
        </button>

        {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
      </form>
    </div>
  );
}