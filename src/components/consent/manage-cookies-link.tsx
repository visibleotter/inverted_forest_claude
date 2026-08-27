'use client';

import { useTranslations } from 'next-intl';
import { openCookieSettings } from '@/lib/consent';

/** The "Manage cookies" control the Privacy Policy promises. */
export function ManageCookiesLink() {
  const t = useTranslations('cookies');

  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="text-linen/80 transition-colors hover:text-linen"
    >
      {t('manage')}
    </button>
  );
}
