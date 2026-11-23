import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/** Request-scoped client (respects RLS, carries the user session). */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — middleware refreshes sessions.
          }
        }
      }
    }
  );
}

/**
 * Service-role client for trusted server-side work (webhooks, admin
 * mutations). Never import from client components.
 *
 * A 60-second lifetime on every request. Next 14 puts server-side `fetch`
 * in its Data Cache by default, with no expiry, and supabase-js fetches
 * like anything else. The public pages were therefore serving whatever the
 * database said the first time they asked, refreshed only when an admin
 * save happened to call `revalidatePath`. Anything changed another way
 * never showed: a direct SQL edit and, once payments run, the seat counts
 * the webhook updates.
 *
 * Not `no-store`: that makes every locale page dynamic, and the pages that
 * are prerendered (contacts, the sitemap) then fail the build. A minute of
 * staleness is fine for copy and seat counts; the webhook re-checks
 * capacity itself. Admin routes are `force-dynamic`, which overrides this
 * with no caching at all.
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, next: { revalidate: 60 } })
      }
    }
  );
}
