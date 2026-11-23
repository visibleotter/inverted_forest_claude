'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import { NavDrawer } from './nav-drawer';

const links = [
  { href: '/courses', key: 'courses' },
  { href: '/about', key: 'about' },
  { href: '/faq', key: 'faq' },
  { href: '/contacts', key: 'contacts' }
] as const;

/**
 * The name, the four places worth going, and the language.
 *
 * On wide screens the navigation is simply shown: there are four links,
 * and hiding four links behind a "Menu" button is a click for nothing.
 * On phones "Courses" stays visible — it is where nearly everyone is
 * going — and the rest live in the drawer.
 */
export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background">
      <div className="container-content flex h-16 items-center justify-between gap-6">
        <Link
          href="/"
          className="whitespace-nowrap font-serif text-lg font-semibold"
        >
          Inverted Forest
        </Link>

        <nav aria-label={t('menu')} className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] text-foreground underline-offset-4 hover:underline"
            >
              {t(link.key)}
            </Link>
          ))}
          <LocaleSwitcher label={t('switchLocale')} />
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/courses"
            className="px-2 text-[15px] underline-offset-4 hover:underline"
          >
            {t('courses')}
          </Link>
          <NavDrawer />
        </div>
      </div>
    </header>
  );
}
