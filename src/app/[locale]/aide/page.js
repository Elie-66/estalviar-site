"use client";

const questions = [
  {
    q: "Comment fonctionne l'envoi de ma carte cadeau ?",
    r: "Après paiement, votre carte est envoyée par email immédiatement, ou à la date et l'heure que vous avez choisies lors de la personnalisation.",
  },
  {
    q: "Puis-je envoyer la carte directement au bénéficiaire ?",
    r: "Oui, sur la page de paiement, vous pouvez renseigner l'email du destinataire pour chaque carte de votre panier. Sans cela, c'est vous qui la recevez pour la transmettre.",
  },
  {
    q: "Comment fonctionne le programme de fidélité ?",
    r: "Chaque euro dépensé vous rapporte 1 point. Les points débloquent des paliers (Bronze, Argent, Or, Platine) visibles dans votre profil.",
  },
  {
    q: "Qu'est-ce qu'une cagnotte ?",
    r: "Une cagnotte permet à plusieurs personnes de contribuer ensemble à l'achat d'une carte cadeau pour une même personne, avec un lien à partager.",
  },
  {
    q: "Je n'ai pas reçu ma carte, que faire ?",
    r: "Vérifiez vos spams, puis contactez-nous à info@estalviar.com avec votre email de commande — nous pourrons vous la renvoyer.",
  },
  {
    q: "Puis-je me faire rembourser ?",
    r: "Conformément à nos CGV, le droit de rétractation ne s'applique pas une fois le code de la carte communiqué. Contactez-nous en cas de problème particulier.",
  },
];

export default function Aide() {
  return (
    <div className="max-w-[800px] mx-auto px-6 pt-32 pb-20">
      <p className="text-sm uppercase tracking-wide text-gold mb-2">Centre d'aide</p>
      <h1 className="text-3xl font-semibold text-ivory mb-10">Questions fréquentes</h1>

      <div className="space-y-6">
        {questions.map((item, i) => (
          <div key={i} className="border-b border-ivory/10 pb-6">
            <h2 className="text-ivory font-medium mb-2">{item.q}</h2>
            <p className="text-ivory/60 text-sm leading-relaxed">{item.r}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 border border-gold/20 bg-gold/5 rounded-lg p-6 text-center">
        <p className="text-ivory/80 text-sm">Vous ne trouvez pas de réponse à votre question ?</p>
        <a
          href="/fr/contact"
          className="inline-block mt-4 bg-gold text-ink text-sm font-semibold rounded-lg px-6 py-2.5 hover:bg-gold/90 transition-colors"
        >
          Nous contacter
        </a>
      </div>
    </div>
  );
}