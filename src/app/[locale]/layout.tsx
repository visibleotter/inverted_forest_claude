import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import {
  getMessages,
  getTranslations,
  setRequestLocale
} from 'next-intl/server';
import { locales, routing } from '@/i18n/routing';
import { siteConfig } from '@/lib/config';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
  display: 'swap'
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-display',
  display: 'swap'
});

// Applies the saved theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`;

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
    icons: { icon: '/favicon.svg' },
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`]))
    },
    openGraph: {
      type: 'website',
      siteName: t('siteName'),
      locale: locale === 'ru' ? 'ru_RU' : 'en_US'
    },
    twitter: { card: 'summary_large_image' }
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
      className={`${inter.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
