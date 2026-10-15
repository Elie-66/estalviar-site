// Petit drapeau bleu-blanc-rouge dessiné (remplace l'émoji 🇫🇷, qui s'affiche différemment selon les appareils)
export default function Tricolore({ className = "w-3.5 h-2.5" }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}>
      <span className="flex-1 bg-[#2f5bd3]" />
      <span className="flex-1 bg-[#f6f2e9]" />
      <span className="flex-1 bg-[#e1293b]" />
    </span>
  );
}
