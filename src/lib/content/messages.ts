import { isDemoMode } from '../data';
import {
  flattenMessages,
  setByPath,
  type MessageTree
} from './message-tree';
import { createSupabaseAdminClient } from '../supabase/server';
import type { Locale } from '../types';

export {
  flattenMessages,
  setByPath,
  placeholdersIn,
  placeholdersMatch
} from './message-tree';
export type { MessageTree } from './message-tree';

/**
 * Site copy: JSON defaults with database overrides on top.
 *
 * The catalogues in `src/messages` remain the source of *structure* — they
 * define which keys exist, they ship with the code, and they are what the
 * site falls back to when there is no database. The `ui_messages` table
 * holds only what an editor has actually changed.
 *
 * That split is what makes the admin editor safe: an override can always
 * be removed to get the shipped wording back, a key that no longer exists
 * in the code is simply ignored, and demo mode needs no database at all.
 */

export async function loadDefaults(locale: Locale): Promise<MessageTree> {
  return (await import(`../../messages/${locale}.json`)).default as MessageTree;
}

/**
 * Every override for a locale, as a flat map.
 *
 * Cached briefly. The site reads this on every server render, and copy
 * changes a few times a month — but a save should still show up quickly,
 * so the window is short and `invalidateMessagesCache` clears it outright.
 * On a serverless host that clears the instance that handled the save;
 * the rest catch up when the window elapses.
 */
const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; values: Record<string, string> }>();

export async function loadOverrides(
  locale: Locale
): Promise<Record<string, string>> {
  if (isDemoMode()) return {};

  const cached = cache.get(locale);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.values;

  try {
    const db = createSupabaseAdminClient();
    const { data } = await db
      .from('ui_messages')
      .select('key, value')
      .eq('locale', locale);

    const values: Record<string, string> = {};
    for (const row of data ?? []) values[row.key as string] = row.value as string;

    cache.set(locale, { at: Date.now(), values });
    return values;
  } catch (error) {
    // Copy that cannot be loaded must never blank the site. Fall back to
    // what shipped with the code.
    console.error(`[content] could not load overrides for ${locale}`, error);
    return {};
  }
}

export function invalidateMessagesCache(): void {
  cache.clear();
}

/** Defaults with overrides applied — what next-intl actually renders. */
export async function loadMessages(locale: Locale): Promise<MessageTree> {
  const defaults = await loadDefaults(locale);
  const overrides = await loadOverrides(locale);
  if (Object.keys(overrides).length === 0) return defaults;

  const merged = structuredClone(defaults);
  const shipped = flattenMessages(defaults);

  for (const [key, value] of Object.entries(overrides)) {
    // A key the code no longer has is stale data, not a new string: adding
    // it back would resurrect copy nothing renders.
    if (shipped[key] === undefined) continue;
    setByPath(merged, key, value);
  }

  return merged;
}
