import { defineRouting } from 'next-intl/routing';

export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: 'ru',
  // Always prefix so /ru/... and /en/... are canonical, shareable URLs.
  localePrefix: 'always',
  // Remember the user's explicit choice; never auto-switch afterwards.
  localeDetection: true
});
