import { headers } from 'next/headers';
import { isDemoMode } from './data';
import { createSupabaseServerClient } from './supabase/server';

export type AdminAccess =
  | { allowed: true; demo: boolean; email: string | null }
  | { allowed: false };

/**
 * Is this request coming from the machine the server is running on?
 *
 * Used only to decide whether demo mode may open the admin panel. Host
 * headers are client-supplied and trivially forged, so this is not a
 * security boundary anywhere it matters — but in demo mode there is no
 * database, nothing can be written, and the alternative is publishing the
 * dashboard to anyone who types /admin.
 */
function isLocalRequest(): boolean {
  const host = headers().get('host') ?? '';
  const name = host.split(':')[0]?.toLowerCase() ?? '';
  return (
    name === 'localhost' ||
    name === '127.0.0.1' ||
    name === '::1' ||
    name === '[::1]'
  );
}

/**
 * Admin access rules:
 *
 *  - **Demo mode** (no database) on localhost: open, with a visible banner.
 *    The whole point of demo mode is that the project runs and can be
 *    explored with zero configuration.
 *
 *  - **Demo mode on a deployed URL**: closed. A public deployment that has
 *    not been given its Supabase variables would otherwise serve the
 *    dashboard, the student list and every group's configuration to anyone
 *    who guessed the path. Nothing there can be written, but none of it is
 *    anyone else's business either.
 *
 *  - **Supabase mode**: an authenticated user whose email is listed in
 *    `ADMIN_EMAILS`. Authenticating with any other address gets a session
 *    and nothing else.
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  if (isDemoMode()) {
    return isLocalRequest()
      ? { allowed: true, demo: true, email: null }
      : { allowed: false };
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
