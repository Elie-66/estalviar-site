import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PanierProvider } from "./context/PanierContext";
import BanniereCookies from "./components/BanniereCookies";

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300..900&family=Inter:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <PanierProvider>
            <Header />
            {children}
            <Footer />
            <BanniereCookies />
          </PanierProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}