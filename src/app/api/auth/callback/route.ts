import { NextResponse, type NextRequest } from 'next/server';
import { siteConfig } from '@/lib/config';
import { isDemoMode } from '@/lib/data';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Where a magic link lands.
 *
 * Lives under /api so the locale middleware leaves it alone — Supabase
 * needs one fixed redirect URL, and a path that gets a locale prefixed to
 * it is not fixed.
 *
 * The `next` parameter is deliberately not trusted as a URL: an open
 * redirect on an authentication callback is how a phishing page borrows
 * your domain. Only the locale is read from it, and the destination is
 * rebuilt here.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ru';
  const destination = new URL(`/${locale}/admin`, siteConfig.url);

  if (isDemoMode() || !code) {
    return NextResponse.redirect(destination);
  }

  const supabase = createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const failed = new URL(`/${locale}/admin-login`, siteConfig.url);
    failed.searchParams.set('error', '1');
    return NextResponse.redirect(failed);
  }

  return NextResponse.redirect(destination);
}
