import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SITE_URL, alternates } from '../../lib/seo';
import { RESEAUX } from '../../lib/reseaux';
// Polices hébergées par le site lui-même (aucune requête vers Google Fonts : RGPD)
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/inter";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PanierProvider } from "./context/PanierContext";
import BanniereCookies from "./components/BanniereCookies";
import GestionSession from "./components/GestionSession";
import MesureAudience from "./components/MesureAudience";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const titre = messages.seo?.accueilTitre || "Estalviar";
  const description = messages.seo?.accueilDescription || "Cartes cadeaux personnalisables";

  return {
    metadataBase: new URL(SITE_URL),
    // Chaque page fournit son titre ; « | Estalviar » est ajouté automatiquement
    title: { default: titre, template: "%s | Estalviar" },
    description,
    alternates: alternates(locale),
    openGraph: { title: titre, description, siteName: "Estalviar", locale, type: "website" },
    twitter: { card: "summary_large_image", title: titre, description },
  };
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {/* Pour Google : qui est Estalviar et où le trouver */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Estalviar",
          url: SITE_URL,
          logo: `${SITE_URL}/apple-icon.png`,
          email: "info@estalviar.com",
          sameAs: RESEAUX.map((r) => r.url),
        }) }} />
        <NextIntlClientProvider messages={messages}>
          <PanierProvider>
            <Header />
            {/* Bloc normal (pas flex) : les pages occupent toute la largeur et ne débordent jamais sur téléphone */}
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <BanniereCookies />
            <GestionSession />
            <MesureAudience />
          </PanierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}