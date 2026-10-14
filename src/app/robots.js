export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/*/admin", "/*/paiement", "/*/profil", "/*/confirmation"],
    },
    sitemap: "https://estalviar.com/sitemap.xml",
  };
}