import { isSupabaseConfigured } from '../config';
import type { DataProvider } from './provider';
import { SeedProvider } from './seed-provider';

let provider: DataProvider | null = null;

/**
 * Returns the active data provider. Supabase when configured,
 * otherwise the zero-config seed provider (demo mode).
 */
export function getData(): DataProvider {
  if (!provider) {
    if (isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      // Lazy import keeps supabase out of the bundle in demo mode.
      const { SupabaseProvider } =
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        require('./supabase-provider') as typeof import('./supabase-provider');
      provider = new SupabaseProvider();
    } else {
      provider = new SeedProvider();
    }
  }
  return provider;
}

export function isDemoMode(): boolean {
  return !(isSupabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
