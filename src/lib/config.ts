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

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
