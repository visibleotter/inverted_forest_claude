import { NextResponse, type NextRequest } from 'next/server';
import { isDemoMode } from '@/lib/data';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Where a magic link lands.
 *
 * Lives under /api so the locale middleware leaves it alone — Supabase
 * needs one fixed redirect URL, and a path that gets a locale prefixed to
 * it is not fixed.
 *
 * Nothing from the query string is trusted as a URL. An open redirect on
 * an authentication callback is how a phishing page borrows your domain,
 * so only the locale is read and the destination is rebuilt from the
 * origin this request actually arrived on.
 *
 * That origin, rather than NEXT_PUBLIC_SITE_URL, is what makes signing in
 * work wherever the app happens to be running — localhost during
 * development, a Vercel preview URL, or production. The session cookie is
 * set for the host that served the request; sending the browser to a
 * different host afterwards would land it there signed out.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get('code');
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ru';
  const destination = new URL(`/${locale}/admin`, origin);

  if (isDemoMode() || !code) {
    return NextResponse.redirect(destination);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failed = new URL(`/${locale}/admin-login`, origin);
    failed.searchParams.set('error', '1');
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(destination);
}
