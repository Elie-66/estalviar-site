"use client";

import { useState } from "react";

export default function Contact() {
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [sujet, setSujet] = useState("");
  const [message, setMessage] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnvoi(true);
    setErreur("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nom, email, sujet, message }),
    });

    const data = await res.json();
    setEnvoi(false);
    if (res.ok) {
      setSucces(true);
    } else {
      setErreur(data.error || "Une erreur est survenue, réessayez.");
    }
  };

  if (succes) {
    return (
      <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h1 className="text-3xl font-semibold text-ivory">Message envoyé</h1>
        <p className="mt-4 text-ivory/60">Nous vous répondrons dans les meilleurs délais.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Contact</p>
      <h1 className="text-3xl font-semibold text-ivory mb-8">Une question ?</h1>

      <form onSubmit={handleSubmit}>
        <label className="block text-sm text-ivory/70 mb-2">Nom</label>
        <input
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Sujet</label>
        <input
          type="text"
          value={sujet}
          onChange={(e) => setSujet(e.target.value)}
          required
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory"
        />

        <label className="block text-sm text-ivory/70 mb-2 mt-4">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          rows={5}
          className="w-full bg-transparent border border-ivory/20 rounded-lg px-4 py-3 text-ivory resize-none"
        />

        <button
          type="submit"
          disabled={envoi}
          className="mt-6 w-full bg-gold text-ink font-semibold rounded-lg px-6 py-4 hover:bg-gold/90 transition-colors disabled:opacity-40"
        >
          {envoi ? "Envoi..." : "Envoyer"}
        </button>

        {erreur && <p className="mt-3 text-sm text-corail">{erreur}</p>}
      </form>
    </div>
  );
}