import { createServerClient, type CookieOptions } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from './lib/config';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

/**
 * Locale routing, plus a Supabase session refresh.
 *
 * The refresh is not optional garnish. Supabase access tokens are short
 * lived, and only a request that can write cookies can renew them — a
 * server component cannot. Without this, an admin session quietly stops
 * working an hour after signing in and the only symptom is being bounced
 * to the home page.
 */
export default async function middleware(request: NextRequest) {
  const response = intlMiddleware(request) ?? NextResponse.next();

  // Demo mode has no auth to refresh.
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options: CookieOptions }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Touching the user is what triggers the refresh; the result is unused.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // Localize everything except API routes, Next internals and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
