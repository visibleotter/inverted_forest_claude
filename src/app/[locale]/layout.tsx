import type { Metadata } from 'next';
import { Inter, Literata } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale
} from 'next-intl/server';
import { CookieConsent } from '@/components/consent/cookie-consent';
import { locales, routing } from '@/i18n/routing';
import { siteConfig } from '@/lib/config';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap'
});

// A book face drawn for long reading on screens, with a proper Cyrillic.
// Variable, so the optical-size axis tightens headings and opens text.
const literata = Literata({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-serif',
  display: 'swap',
  axes: ['opsz']
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });

  return {
    metadataBase: new URL(siteConfig.url),
    title: {
      default: t('home.title'),
      template: `%s · ${t('siteName')}`
    },
    description: t('home.description'),
    // SVG for browsers that take it, ICO for the ones that ask for
    // /favicon.ico regardless (it used to 404), PNG for iOS home screens.
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon.ico', sizes: 'any' }
      ],
      apple: '/apple-touch-icon.png'
    },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`]))
    },
    // The fallback preview: without an image, a link to the home page
    // posted in Telegram renders as bare text. Course pages set their own.
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale: locale === 'ru' ? 'ru_RU' : 'en_US',
      images: [{ url: '/images/og-home.jpg', width: 1200, height: 630 }]
    },
    twitter: { card: 'summary_large_image', images: ['/images/og-home.jpg'] }
  };
}

export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as never)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${literata.variable}`}
    >
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
