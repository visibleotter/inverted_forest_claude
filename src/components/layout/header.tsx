'use client';

import { Menu, TreePine, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeToggle } from './theme-toggle';

const navItems = [
  { href: '/courses', key: 'courses' },
  { href: '/teachers', key: 'teachers' },
  { href: '/about', key: 'about' },
  { href: '/faq', key: 'faq' },
  { href: '/contacts', key: 'contacts' }
] as const;

export function Header() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-content flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold"
          onClick={() => setOpen(false)}
        >
          <TreePine className="h-5 w-5 rotate-180 text-amber" aria-hidden />
          Inverted Forest
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-btn px-3 py-2 text-sm transition-colors hover:bg-muted',
                pathname.startsWith(item.href)
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground'
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-1 md:flex">
          <LocaleSwitcher label={t('switchLocale')} />
          <ThemeToggle label={t('toggleTheme')} />
          <Link
            href="/courses"
            className={cn(buttonVariants({ variant: 'accent', size: 'sm' }), 'ms-2')}
          >
            {t('explore')}
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <LocaleSwitcher label={t('switchLocale')} />
          <ThemeToggle label={t('toggleTheme')} />
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-btn hover:bg-muted"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? t('closeMenu') : t('menu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          className="border-t border-border bg-background md:hidden"
          aria-label="Mobile"
        >
          <div className="container-content flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-btn px-3 py-2.5 text-sm font-medium hover:bg-muted"
              >
                {t(item.key)}
              </Link>
            ))}
            <Link
              href="/courses"
              onClick={() => setOpen(false)}
              className={cn(buttonVariants({ variant: 'accent' }), 'mt-3')}
            >
              {t('explore')}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
