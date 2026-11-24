'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { usePathname } from '@/i18n/navigation';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

/** The inverted fir from the favicon, drawn for a 24px box. */
function Mark() {
  return (
    <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
      <rect x="30.5" y="8" width="3" height="11" fill="currentColor" />
      <path
        d="M13 19 H51 L41 29 H47 L38 39 H43 L32 55 L21 39 H26 L17 29 H23 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * A round button in the corner that opens a chat on Telegram — where this
 * audience already is — from any page.
 *
 * On the home page it waits until the hero has begun to open, so it does
 * not compete with the glowing "scroll" hint at the centre of the first
 * screen. Elsewhere it is there from the start. On wide screens hovering
 * slides out a label; on phones it stays a compact circle above the
 * bottom safe area.
 *
 * Not on the registration form: there it sat over the fields, and the
 * form already offers Telegram, WhatsApp and email for help.
 */
export function FloatingContact() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const isHome = pathname === '/';
  const hidden = pathname.startsWith('/register');
  const [visible, setVisible] = useState(!isHome);

  useEffect(() => {
    if (!isHome) {
      setVisible(true);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  if (hidden) return null;

  return (
    <a
      href={siteConfig.telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('writeUs')}
      className={cn(
        'group fixed z-40 flex h-14 items-center gap-0 overflow-hidden rounded-full border border-glow/40 bg-forest pl-[13px] pr-[13px] text-glow shadow-lg shadow-forest/30 transition-all duration-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'bottom-[calc(1.25rem+env(safe-area-inset-bottom))] right-5 sm:bottom-8 sm:right-8',
        '[@media(hover:hover)]:hover:gap-3 [@media(hover:hover)]:hover:pr-6',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      )}
    >
      <Mark />
      <span className="max-w-0 whitespace-nowrap text-sm font-medium text-paper opacity-0 transition-all duration-500 [@media(hover:hover)]:group-hover:max-w-[12rem] [@media(hover:hover)]:group-hover:opacity-100">
        {t('writeUsShort')}
      </span>
    </a>
  );
}
