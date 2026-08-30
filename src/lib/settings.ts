import { createSupabaseAdminClient } from './supabase/server';

/**
 * Operational numbers that live in the database rather than in code.
 *
 * The grace period before a lapsed student loses access, how long an
 * invite stays good, how long an unpaid registration holds its place —
 * these get argued about and changed, and none of them is worth a deploy.
 * Defaults here are the starting values seeded by migration 0003.
 *
 * VAT is deliberately not here. It lives in ALLPAY_VAT_RATE, and a second
 * place claiming to hold it would be a second place to be wrong.
 */

export const SETTING_DEFAULTS = {
  grace_period_days: 3,
  invite_ttl_days: 7,
  pending_ttl_minutes: 60
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

// Settings change rarely and are read on every webhook, so a short cache
// keeps the hot path to one round trip without making edits feel stuck.
const CACHE_MS = 60_000;
let cache: { at: number; values: Record<string, number> } | null = null;

export async function getNumericSettings(): Promise<
  Record<SettingKey, number>
> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return { ...SETTING_DEFAULTS, ...cache.values };
  }

  try {
    const db = createSupabaseAdminClient();
    const { data } = await db.from('settings').select('key, value');
    const values: Record<string, number> = {};
    for (const row of data ?? []) {
      const parsed = Number(row.value);
      if (Number.isFinite(parsed)) values[row.key as string] = parsed;
    }
    cache = { at: Date.now(), values };
    return { ...SETTING_DEFAULTS, ...values };
  } catch {
    // A settings table that cannot be read must not stop a payment from
    // being honoured. Defaults are safe values, not placeholders.
    return { ...SETTING_DEFAULTS };
  }
}

export function invalidateSettingsCache(): void {
  cache = null;
}
