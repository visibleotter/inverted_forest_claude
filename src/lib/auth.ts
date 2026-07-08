import { isDemoMode } from './data';
import { createSupabaseServerClient } from './supabase/server';

export type AdminAccess =
  | { allowed: true; demo: boolean; email: string | null }
  | { allowed: false };

/**
 * Admin access rules:
 *  - Demo mode (no database): open, with a visible demo banner.
 *  - Supabase mode: requires an authenticated user whose email is
 *    listed in ADMIN_EMAILS (comma-separated).
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  if (isDemoMode()) {
    return { allowed: true, demo: true, email: null };
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user?.email) return { allowed: false };

  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!admins.includes(user.email.toLowerCase())) return { allowed: false };

  return { allowed: true, demo: false, email: user.email };
}
