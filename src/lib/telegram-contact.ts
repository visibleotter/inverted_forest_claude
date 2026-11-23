/**
 * How a student is found on Telegram: a username, or the phone number the
 * account is registered to.
 *
 * Both are accepted because both are how people actually answer the
 * question. Many never set a username; anyone who has Telegram has a
 * number. Either one is enough to find the person and add them by hand if
 * the invite link goes astray — which is what this field is for.
 *
 * Normalised so the admin list reads one way: `@username` or `+972…`.
 * Shared by the form and the server action, so the browser can never
 * accept something the server then rejects.
 */

const USERNAME = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const LINK = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/([^/?#]+)\/?$/i;

export function normalizeTelegramContact(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  // A link copied from the profile: t.me/name
  const link = value.match(LINK);
  const handle = link ? link[1]! : value.replace(/^@/, '');
  if (USERNAME.test(handle)) return `@${handle}`;
  if (link) return null;

  // Otherwise it has to be a phone number. Separators are how people type
  // numbers, not part of them.
  const compact = value.replace(/[\s\-().]/g, '');
  if (!/^\+?\d{9,15}$/.test(compact)) return null;

  const digits = compact.replace(/^\+/, '');
  if (compact.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('972')) return `+${digits}`;
  // Israeli local format: 050-123-4567 → +972501234567
  if (digits.startsWith('0') && digits.length === 10) {
    return `+972${digits.slice(1)}`;
  }
  return digits;
}
