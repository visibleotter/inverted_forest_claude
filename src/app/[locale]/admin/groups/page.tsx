import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AdminTable } from '@/components/admin/admin-table';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { formatDate, lt, weekdayName } from '@/lib/utils';

export default async function AdminGroupsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const tCourses = await getTranslations('courses');
  const data = getData();
  const [groups, courses] = await Promise.all([
    data.getAllGroups(),
    data.getCourses()
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t('nav.groups')}</h1>
        <Link
          href="/admin/groups/new"
          className={buttonVariants({ variant: 'accent' })}
        >
          {t('groupForm.new')}
        </Link>
      </div>
      <AdminTable
        headers={[
          'ID',
          t('table.course'),
          t('table.group'),
          t('table.schedule'),
          t('table.start'),
          t('table.capacity'),
          t('table.paymentUrl'),
          t('table.status'),
          t('actions.title')
        ]}
        rows={groups.map((group) => {
          const course = courses.find((c) => c.id === group.courseId);
          return [
            <Link
              key="id"
              href={`/admin/groups/${group.id}`}
              className="font-mono text-xs font-semibold text-accent hover:underline"
            >
              {group.id}
            </Link>,
            course ? lt(course.title, l) : group.courseId,
            tCourses(`ageGroup.${group.audience}`),
            <span key="sch" className="capitalize">
              {weekdayName(group.weekday, l)} {group.time}
            </span>,
            formatDate(group.startDate, l),
            `${group.seatsTaken}/${group.capacity}`,
            group.paymentUrl ? (
              <a
                key="pay"
                href={group.paymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-[180px] truncate text-xs text-accent underline"
              >
                {group.paymentUrl.replace('https://', '')}
              </a>
            ) : (
              '—'
            ),
            <StatusBadge key="s" status={group.status} />,
            <Link
              key="edit"
              href={`/admin/groups/${group.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              {t('actions.edit')}
            </Link>
          ];
        })}
      />
    </div>
  );
}
