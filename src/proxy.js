import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['fr', 'en', 'de', 'es', 'it'],
  defaultLocale: 'fr'
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
};