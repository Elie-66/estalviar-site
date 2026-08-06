export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[74px] bg-ink/80 backdrop-blur-md border-b border-ivory/10 z-50">
      <div className="max-w-[1240px] mx-auto h-full px-6 flex items-center justify-between">

       <a href="/" className="text-xl font-semibold uppercase tracking-wide text-ivory font-[family-name:var(--font-fraunces)]">
          Estalviar<span className="text-gold">.</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-ivory/80">
          <a href="/boutique" className="hover:text-ivory transition-colors">Boutique</a>
          <a href="/professionnels" className="hover:text-ivory transition-colors">Professionnels</a>
          <a href="/fidelite" className="hover:text-ivory transition-colors">Fidélité</a>
          <a href="/aide" className="hover:text-ivory transition-colors">Aide</a>
        </nav>

        <div className="flex items-center gap-4">
          <button className="text-ivory/80 hover:text-ivory text-sm">FR</button>
          <a href="/panier" className="text-ivory/80 hover:text-ivory">🛒</a>
          <a href="/connexion" className="text-ivory/80 hover:text-ivory text-sm">Connexion</a>
        </div>

      </div>
    </header>
  );
}
