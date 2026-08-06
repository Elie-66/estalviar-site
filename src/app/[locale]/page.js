import Header from "./components/Header";
import Footer from "./components/Footer";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-ink">
      <Header />
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16">
        <h1 className="text-4xl font-semibold uppercase tracking-wide text-ivory">
          Estalviar<span className="text-gold">.</span>
        </h1>
        <p className="mt-4 text-lg text-ivory/70">
          Le site est en construction.
        </p>
      </main>
      <Footer />
    </div>
  );
}