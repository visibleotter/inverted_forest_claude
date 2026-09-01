import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminTable } from '@/components/admin/admin-table';
import { EnrollmentActions } from '@/components/admin/enrollment-actions';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt, weekdayName } from '@/lib/utils';

/**
 * Enrollments, not students.
 *
 * The unit of work here is one person in one group: a parent with two
 * children has one email and two enrollments, and every action on this
 * page — grant, revoke, cancel — applies to an enrollment, never to a
 * person. Listing people instead would make those two children a single
 * ambiguous row.
 */
export default async function AdminEnrollmentsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const data = getData();
  const [enrollments, orphans, groups, courses] = await Promise.all([
    data.getEnrollments(),
    data.getOrphanPayments(),
    data.getAllGroups(),
    data.getCourses()
  ]);

  // A move is only ever to another slot of the same course: a different
  // course is a different price and a different subscription, which is a
  // refund and a new registration, not a move.
  const moveTargetsFor = (courseId: string, groupId: string) =>
    groups
      .filter(
        (group) =>
          group.courseId === courseId &&
          group.id !== groupId &&
          group.status === 'enrolling'
      )
      .map((group) => ({
        id: group.id,
        label: `${group.id} · ${weekdayName(group.weekday, l)} ${group.time}`
      }));

  const dateFormat = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(l === 'ru' ? 'ru-RU' : 'en-US') : '—';

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-6 text-2xl font-semibold">{t('enrollments.title')}</h1>
        <AdminTable
          headers={[
            t('table.name'),
            t('enrollments.participant'),
            t('table.email'),
            t('table.course'),
            t('table.group'),
            t('table.status'),
            t('enrollments.plan'),
            t('enrollments.paidThrough'),
            t('enrollments.access'),
            t('actions.title')
          ]}
          rows={enrollments.map((row) => [
            <span key="n" className="font-medium">
              {row.studentName}
            </span>,
            row.participantName ?? '—',
            <span key="e" className="text-xs">
              {row.email}
            </span>,
            lt(row.courseTitle, l),
            <code key="g" className="text-xs">
              {row.groupId}
            </code>,
            <StatusBadge key="s" status={row.status} />,
            row.plan === 'monthly'
              ? t('enrollments.planMonthly')
              : t('enrollments.planFull'),
            dateFormat(row.paidThrough),
            <StatusBadge key="a" status={row.telegramAccessStatus} />,
            <EnrollmentActions
              key="act"
              enrollmentId={row.id}
              telegramAccessStatus={row.telegramAccessStatus}
              plan={row.plan}
              subscriptionCancellable={
                row.status === 'active' || row.status === 'past_due'
              }
              moveTargets={moveTargetsFor(row.courseId, row.groupId)}
              defaultAmount={
                courses.find((c) => c.id === row.courseId)?.monthlyPrice ?? 0
              }
              currency={
                courses.find((c) => c.id === row.courseId)?.currency ?? 'ILS'
              }
            />
          ])}
        />
      </div>

      <div>
        <h2 className="mb-2 text-lg font-semibold">
          {t('enrollments.orphansTitle')}
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
          {t('enrollments.orphansIntro')}
        </p>
        {orphans.length === 0 ? (
          <p className="rounded-card border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            {t('enrollments.orphansEmpty')}
          </p>
        ) : (
          <AdminTable
            headers={[
              t('table.date'),
              'order_id',
              t('table.amount'),
              t('table.email')
            ]}
            rows={orphans.map((row) => [
              dateFormat(row.createdAt),
              <code key="o" className="text-xs">
                {row.orderId ?? '—'}
              </code>,
              row.amount === null
                ? '—'
                : `${row.amount} ${row.currency ?? ''}`.trim(),
              row.clientEmail ?? '—'
            ])}
          />
        )}
      </div>
    </div>
  );
}
