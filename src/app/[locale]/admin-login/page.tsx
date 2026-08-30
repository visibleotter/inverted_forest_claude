import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { AdminLoginForm } from '@/components/admin/admin-login-form';
import { isDemoMode } from '@/lib/data';

/**
 * Sits outside `/admin` on purpose: that route group's layout redirects
 * anyone who is not already an admin, so a login page nested inside it
 * would bounce the very people it exists for.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center font-display text-lg font-semibold">
          Inverted Forest
        </p>
        <AdminLoginForm demo={isDemoMode()} />
      </div>
    </div>
  );
}
