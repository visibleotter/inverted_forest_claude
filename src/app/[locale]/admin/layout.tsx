import {
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Send,
  Settings,
  UsersRound,
  Users
} from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { checkAdminAccess } from '@/lib/auth';

const navItems = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', key: 'courses', icon: BookOpen },
  { href: '/admin/groups', key: 'groups', icon: UsersRound },
  { href: '/admin/teachers', key: 'teachers', icon: GraduationCap },
  { href: '/admin/students', key: 'students', icon: Users },
  { href: '/admin/payments', key: 'payments', icon: CreditCard },
  { href: '/admin/telegram', key: 'telegram', icon: Send },
  { href: '/admin/settings', key: 'settings', icon: Settings }
] as const;

export const metadata = { robots: { index: false } };

export default async function AdminLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const access = await checkAdminAccess();
  // Sending them to the home page would look like the admin area does not
  // exist. Send them to the door instead.
  if (!access.allowed) redirect({ href: '/admin-login', locale });

  const t = await getTranslations('admin');

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card md:block">
        <div className="sticky top-0 flex h-screen flex-col p-4">
          <p className="px-3 py-2 font-display text-lg font-semibold">
            Inverted Forest
          </p>
          <p className="px-3 pb-4 text-xs uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </p>
          <nav className="flex flex-1 flex-col gap-0.5" aria-label="Admin">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-btn px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <item.icon className="h-4 w-4" aria-hidden />
                {t(`nav.${item.key}`)}
              </Link>
            ))}
          </nav>
          <Link
            href="/"
            className="rounded-btn px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {t('nav.backToSite')}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {'demo' in access && access.demo && (
          <div className="border-b border-accent/30 bg-accent/10 px-6 py-2.5 text-sm text-foreground">
            {t('demoBanner')}
          </div>
        )}
        <main className="p-6 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
