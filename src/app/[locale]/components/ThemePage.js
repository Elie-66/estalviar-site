"use client";

import { usePathname } from "next/navigation";

// Toutes les pages passent en clair, sauf l'accueil (qui a son propre design)
// et le back-office (qui reste en sombre).
export default function ThemePage({ children }) {
  const segments = (usePathname() || "/").split("/").filter(Boolean);
  const accueil = segments.length <= 1;
  const admin = segments[1] === "admin";
  const clair = !accueil && !admin;

  return (
    <main className={`flex-1 w-full ${clair ? "theme-clair" : ""}`}>{children}</main>
  );
}
