/** Central site configuration. Everything env-driven, nothing hardcoded. */

/**
 * `??` only falls back on undefined, so a variable that exists but is blank —
 * which is exactly what a hosting dashboard produces when you add the key and
 * leave the value empty — passes an empty string straight through. That took
 * a deploy down with `new URL('')`. Treat blank and whitespace as unset.
 */
function envOr(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Resolve the public origin, tolerating the two things people actually type:
 * a bare host with no protocol, and a trailing slash. Falls back to the
 * current Vercel deployment before localhost, so an unset variable still
 * yields real URLs in sitemaps and canonical tags rather than localhost ones.
 */
function resolveSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercel = process.env.VERCEL_URL?.trim();
  const candidate = raw || (vercel ? `https://${vercel}` : '');
  if (!candidate) return 'http://localhost:3000';

  const withProtocol = /^https?:\/\//i.test(candidate)
    ? candidate
    : `https://${candidate}`;
  try {
    return new URL(withProtocol).origin; // drops any trailing slash or path
  } catch {
    return 'http://localhost:3000';
  }
}

export const siteConfig = {
  name: 'Inverted Forest',
  url: resolveSiteUrl(),
  contactEmail: envOr(
    process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    'hello@invertedforest.com'
  ),
  telegramUrl: envOr(
    process.env.NEXT_PUBLIC_TELEGRAM_URL,
    'https://t.me/invertedforest'
  ),
  whatsappUrl: envOr(
    process.env.NEXT_PUBLIC_WHATSAPP_URL,
    'https://wa.me/972000000000'
  )
};

/**
 * Registered business details named in the Terms and Conditions.
 * Set these before publishing — the opening clause of the Terms
 * identifies the contracting party and is incomplete without them.
 */
export const legalEntity = {
  name: envOr(process.env.NEXT_PUBLIC_LEGAL_NAME, siteConfig.name),
  registrationNumber: envOr(process.env.NEXT_PUBLIC_LEGAL_REG_NUMBER, ''),
  address: envOr(process.env.NEXT_PUBLIC_LEGAL_ADDRESS, '')
};

/** Renders "Name, 12345678, Some St 1, Tel Aviv" skipping unset parts. */
export function legalEntityLine(): string {
  return [
    legalEntity.name,
    legalEntity.registrationNumber,
    legalEntity.address
  ]
    .filter(Boolean)
    .join(', ');
}

/** Last revision date shown under each legal document's title. */
export const legalLastUpdated = '2026-08-26';

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
