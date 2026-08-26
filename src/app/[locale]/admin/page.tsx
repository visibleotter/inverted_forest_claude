import {
  AlertTriangle,
  CalendarRange,
  CircleDollarSign,
  Users
} from 'lucide-react';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Card, CardContent } from '@/components/ui/card';
import { NumberTicker } from '@/components/magicui/number-ticker';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

export default async function AdminDashboardPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin.dashboard');
  const tTable = await getTranslations('admin.table');
  const stats = await getData().getDashboardStats();

  const intlLocale = l === 'ru' ? 'ru-RU' : 'en-US';
  const cards = [
    { icon: Users, label: t('activeStudents'), value: stats.activeStudents },
    {
      icon: CircleDollarSign,
      label: t('monthlyRevenue'),
      value: stats.monthlyRevenue,
      currency: stats.revenueCurrency
    },
    {
      icon: CalendarRange,
      label: t('upcomingCohorts'),
      value: stats.upcomingCohorts
    },
    {
      icon: AlertTriangle,
      label: t('failedPayments'),
      value: stats.failedPayments
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-card bg-amber/15 text-amber">
                <card.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="font-display text-2xl font-semibold">
                  <NumberTicker
                    value={card.value}
                    locale={intlLocale}
                    currency={card.currency}
                  />
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xl font-semibold">
          {t('recentRegistrations')}
        </h2>
        <AdminTable
          headers={[
            tTable('name'),
            tTable('email'),
            tTable('course'),
            tTable('group'),
            tTable('status')
          ]}
          rows={stats.recentRegistrations.map((row) => [
            `${row.firstName} ${row.lastName}`,
            row.email,
            lt(row.courseTitle, l),
            <code key="g" className="text-xs">{row.groupId}</code>,
            <StatusBadge key="s" status={row.enrollmentStatus} />
          ])}
        />
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">{t('automationLogs')}</h2>
        <div className="space-y-2">
          {stats.logs.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-card border border-border bg-card px-4 py-3 text-sm"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  log.status === 'ok' ? 'bg-emerald-500' : 'bg-red-500'
                }`}
                aria-hidden
              />
              <span className="font-medium">{log.event}</span>
              <span className="text-muted-foreground">{log.detail}</span>
              <span className="ms-auto text-xs text-muted-foreground">
                {log.source} ·{' '}
                {new Date(log.createdAt).toLocaleString(
                  l === 'ru' ? 'ru-RU' : 'en-US'
                )}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
