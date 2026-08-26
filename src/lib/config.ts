/** Central site configuration. Everything env-driven, nothing hardcoded. */
export const siteConfig = {
  name: 'Inverted Forest',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  contactEmail:
    process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'hello@invertedforest.com',
  telegramUrl:
    process.env.NEXT_PUBLIC_TELEGRAM_URL ?? 'https://t.me/invertedforest',
  whatsappUrl:
    process.env.NEXT_PUBLIC_WHATSAPP_URL ?? 'https://wa.me/972000000000'
};

/**
 * Registered business details named in the Terms and Conditions.
 * Set these before publishing — the opening clause of the Terms
 * identifies the contracting party and is incomplete without them.
 */
export const legalEntity = {
  name: process.env.NEXT_PUBLIC_LEGAL_NAME ?? siteConfig.name,
  registrationNumber: process.env.NEXT_PUBLIC_LEGAL_REG_NUMBER ?? '',
  address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? ''
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
