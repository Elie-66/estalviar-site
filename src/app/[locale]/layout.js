import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
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

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return {
    title: messages.seo?.accueilTitre || "Estalviar",
    description: messages.seo?.accueilDescription || "Cartes cadeaux personnalisables",
    openGraph: {
      title: messages.seo?.accueilTitre || "Estalviar",
      description: messages.seo?.accueilDescription || "Cartes cadeaux personnalisables",
      siteName: "Estalviar",
      locale: locale,
      type: "website",
    },
  };
}

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <PanierProvider>
            <Header />
            {children}
            <Footer />
            <BanniereCookies />
            <GestionSession />
          </PanierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}