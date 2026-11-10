import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['fr', 'en', 'de', 'es', 'it'],
  defaultLocale: 'fr'
});

export const config = {
  // « ingest » : statistiques PostHog, ne doivent pas être redirigées vers /fr/...
  matcher: ['/((?!api|_next|ingest|.*\\..*).*)']
};