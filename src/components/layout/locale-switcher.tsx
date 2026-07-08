'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';

/**
 * Switches locale while preserving the current path.
 * next-intl stores the choice in a cookie, so the site never
 * auto-switches after an explicit selection.
 */
export function LocaleSwitcher({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const next = locale === 'ru' ? 'en' : 'ru';

  return (
    <button
      type="button"
      onClick={() => router.replace(pathname, { locale: next })}
      className="inline-flex h-9 items-center rounded-btn px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={label}
    >
      {label}
    </button>
  );
}
