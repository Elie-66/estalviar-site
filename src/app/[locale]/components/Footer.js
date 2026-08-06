export default function Footer() {
  return (
    <footer className="bg-ink-secondary border-t border-ivory/10 mt-auto">
      <div className="max-w-[1240px] mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-4 gap-10">

        <div>
          <p className="text-lg uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
            Estalviar<span className="text-gold">.</span>
          </p>
          <p className="mt-3 text-sm text-ivory/60">
            La carte cadeau, offerte simplement.
          </p>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">Boutique</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href="/boutique" className="hover:text-ivory">Toutes les enseignes</a></li>
            <li><a href="/professionnels" className="hover:text-ivory">Offre professionnelle</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">Mon compte</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href="/connexion" className="hover:text-ivory">Connexion</a></li>
            <li><a href="/fidelite" className="hover:text-ivory">Programme fidélité</a></li>
          </ul>
        </div>

        <div>
          <p className="text-sm uppercase tracking-wide text-ivory/50 mb-3">Aide</p>
          <ul className="space-y-2 text-sm text-ivory/80">
            <li><a href="/aide" className="hover:text-ivory">Centre d'aide</a></li>
            <li><a href="/contact" className="hover:text-ivory">Contact</a></li>
          </ul>
        </div>

      </div>

      <div className="border-t border-ivory/10">
        <div className="max-w-[1240px] mx-auto px-6 py-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-ivory/50">
          <p>&copy; 2026 Estalviar. Tous droits réservés.</p>
          <div className="flex gap-4">
            <a href="/mentions-legales" className="hover:text-ivory/80">Mentions légales</a>
            <a href="/cgv" className="hover:text-ivory/80">CGV</a>
            <a href="/confidentialite" className="hover:text-ivory/80">Confidentialité</a>
            <a href="/cookies" className="hover:text-ivory/80">Cookies</a>
          </div>
          <p>Paiement sécurisé</p>
        </div>
      </div>
    </footer>
  );
}