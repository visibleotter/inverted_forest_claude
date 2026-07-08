import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { AdminTable } from '@/components/admin/admin-table';
import { StatusBadge } from '@/components/admin/status-badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

export default async function AdminStudentsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const students = await getData().getStudents();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.students')}</h1>
      <AdminTable
        headers={[
          t('table.name'),
          t('table.email'),
          t('table.phone'),
          t('table.course'),
          t('table.group'),
          t('table.status'),
          t('table.date')
        ]}
        rows={students.map((row) => [
          <span key="n" className="font-medium">
            {row.firstName} {row.lastName}
          </span>,
          row.email,
          row.phone ?? '—',
          lt(row.courseTitle, l),
          <code key="g" className="text-xs">{row.groupId}</code>,
          <StatusBadge key="s" status={row.enrollmentStatus} />,
          new Date(row.createdAt).toLocaleDateString(
            l === 'ru' ? 'ru-RU' : 'en-US'
          )
        ])}
      />
    </div>
  );
}
