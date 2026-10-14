// Back-office : jamais indexé par les moteurs de recherche
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function DispositionAdmin({ children }) {
  return children;
}
