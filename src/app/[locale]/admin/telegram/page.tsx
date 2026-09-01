import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AdminTable } from '@/components/admin/admin-table';
import { buttonVariants } from '@/components/ui/button';
import { StatusBadge } from '@/components/admin/status-badge';
import { Badge } from '@/components/ui/badge';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

export default async function AdminTelegramPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = (await getLocale()) as Locale;
  const t = await getTranslations('admin');
  const tCourses = await getTranslations('courses');
  const statuses = await getData().getTelegramStatuses();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{t('nav.telegram')}</h1>
      <AdminTable
        headers={[
          t('table.group'),
          t('table.course'),
          t('table.channel'),
          t('table.botStatus'),
          t('table.members'),
          t('table.lastInvite'),
          t('table.status'),
          t('actions.title')
        ]}
        rows={statuses.map(({ group, courseTitle, botIsAdmin, membersCount, lastInviteAt }) => [
          <div key="g">
            <code className="text-xs font-semibold">{group.id}</code>
            <p className="text-xs text-muted-foreground">
              {tCourses(`ageGroup.${group.audience}`)}
            </p>
          </div>,
          lt(courseTitle, l),
          group.telegramChannelId ? (
            <code key="c" className="text-xs">{group.telegramChannelId}</code>
          ) : (
            '—'
          ),
          <Badge key="b" variant={botIsAdmin ? 'success' : 'danger'}>
            {botIsAdmin ? t('status.botAdmin') : t('status.botMissing')}
          </Badge>,
          membersCount !== null ? String(membersCount) : '—',
          lastInviteAt
            ? new Date(lastInviteAt).toLocaleString(
                l === 'ru' ? 'ru-RU' : 'en-US'
              )
            : '—',
          <StatusBadge key="s" status={group.status} />,
          // The channel id lives on the study group, so that is where a
          // missing one gets fixed — no second place to set the same thing.
          <Link
            key="cfg"
            href={`/admin/groups/${group.id}`}
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            {t('actions.configure')}
          </Link>
        ])}
      />
    </div>
  );
}
