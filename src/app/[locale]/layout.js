import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Fraunces, Inter, Space_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import { PanierProvider } from "./context/PanierContext";
import BanniereCookies from "./components/BanniereCookies";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: "variable",
  axes: ["SOFT"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "ESTALVIAR",
  description: "Cartes cadeaux personnalisables",
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${spaceMono.variable} h-full antialiased`}
    >
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