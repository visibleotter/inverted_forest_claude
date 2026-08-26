'use client';

import { TreePine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import { NavDrawer } from './nav-drawer';
import { ThemeToggle } from './theme-toggle';

/**
 * Header stays to logo + controls + drawer trigger at every breakpoint.
 * The full navigation lives in NavDrawer.
 */
export function Header() {
  const t = useTranslations('nav');

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold"
        >
          <TreePine className="h-5 w-5 rotate-180 text-amber" aria-hidden />
          Inverted Forest
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <LocaleSwitcher label={t('switchLocale')} />
          <ThemeToggle label={t('toggleTheme')} />
          <NavDrawer />
        </div>
      </div>
    </header>
  );
}
