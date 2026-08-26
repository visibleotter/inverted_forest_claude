/**
 * Cookie consent state.
 *
 * The Privacy Policy commits to four categories, to consent being taken
 * before anything non-essential is set, to withdrawal at any time, and to
 * keeping a record of what was chosen and when. This module is that record.
 *
 * What the site actually sets today:
 *  - NEXT_LOCALE (essential) — written when the visitor picks a language.
 *    It falls under "cookies required to provide a feature you explicitly
 *    requested" in the policy's Essentials list, so it needs no consent.
 *  - theme (essential, localStorage) — same reasoning.
 *  - This consent record itself, which the policy also lists as Essential.
 *
 * Nothing in the preferences, analytics or marketing categories is loaded
 * yet. They exist so that adding an analytics or advertising script later
 * is gated by `hasConsent()` rather than requiring this to be revisited.
 */

export const CONSENT_COOKIE = 'if_cookie_consent';

/** Bump to re-ask everyone, e.g. when a new category starts being used. */
export const CONSENT_VERSION = 1;

/** Six months, after which we ask again. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

export type ConsentCategory =
  | 'essentials'
  | 'preferences'
  | 'analytics'
  | 'marketing';

export const OPTIONAL_CATEGORIES: ConsentCategory[] = [
  'preferences',
  'analytics',
  'marketing'
];

/**
 * Categories the site actually loads something for.
 *
 * Empty today: there is no analytics, no advertising pixel and no
 * third-party embed anywhere on the site, and fonts and images are served
 * from our own origin, so a visitor's browser contacts nobody else.
 *
 * Asking consent for things we do not do is friction with no protection
 * behind it, so the banner stays down while this list is empty. Add
 * 'analytics' here the day an analytics script goes in and the banner
 * turns itself back on — nothing else needs changing.
 */
export const ACTIVE_OPTIONAL_CATEGORIES: ConsentCategory[] = [];

/** Whether a visitor must be asked before we set anything. */
export function isBannerRequired(): boolean {
  return ACTIVE_OPTIONAL_CATEGORIES.length > 0;
}

export type ConsentChoices = Record<ConsentCategory, boolean>;

export interface ConsentRecord {
  v: number;
  choices: ConsentChoices;
  /** ISO timestamp — the policy promises we can show when consent was given. */
  ts: string;
}

/** Nothing optional is on until someone says so. */
export const DENY_ALL: ConsentChoices = {
  essentials: true,
  preferences: false,
  analytics: false,
  marketing: false
};

export const ACCEPT_ALL: ConsentChoices = {
  essentials: true,
  preferences: true,
  analytics: true,
  marketing: true
};

export function readConsent(): ConsentRecord | null {
  if (typeof document === 'undefined') return null;

  const raw = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`))
    ?.slice(CONSENT_COOKIE.length + 1);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as ConsentRecord;
    // A record from an older version is treated as absent, so we re-ask.
    if (parsed?.v !== CONSENT_VERSION || !parsed.choices) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeConsent(choices: ConsentChoices): ConsentRecord {
  const record: ConsentRecord = {
    v: CONSENT_VERSION,
    choices: { ...choices, essentials: true },
    ts: new Date().toISOString()
  };

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(record))}` +
    `; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax${secure}`;

  return record;
}

/**
 * Gate for anything non-essential. Call before loading a third-party
 * script rather than loading it and hoping.
 */
export function hasConsent(category: ConsentCategory): boolean {
  if (category === 'essentials') return true;
  return readConsent()?.choices[category] ?? false;
}

/** Footer link and anything else that needs to reopen the panel. */
export const OPEN_COOKIE_SETTINGS_EVENT = 'inverted-forest:open-cookie-settings';

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
}
