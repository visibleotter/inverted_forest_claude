import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import type { Locale, StudyGroup } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { cn, formatDate, weekdayName } from '@/lib/utils';

export async function ScheduleTable({ groups }: { groups: StudyGroup[] }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('schedule');
  const tCourses = await getTranslations('courses');

  const visible = groups.filter((g) =>
    ['enrolling', 'full'].includes(g.status)
  );

  return (
    <div>
      <div className="overflow-x-auto rounded-card border border-border bg-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-3.5 font-medium">
                {t('group')}
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                {t('day')}
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                {t('time')}
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                {t('starts')}
              </th>
              <th scope="col" className="px-5 py-3.5 font-medium">
                {t('seats')}
              </th>
              <th scope="col" className="px-5 py-3.5">
                <span className="sr-only">{t('join')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((group) => {
              const seats = seatsRemaining(group);
              const isOpen = group.status === 'enrolling' && seats > 0;
              return (
                <tr
                  key={group.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-5 py-4 font-medium capitalize">
                    {tCourses(`ageGroup.${group.audience}`)}
                  </td>
                  <td className="px-5 py-4 capitalize">
                    {weekdayName(group.weekday, locale)}
                  </td>
                  <td className="px-5 py-4 tabular-nums">{group.time}</td>
                  <td className="px-5 py-4">
                    {formatDate(group.startDate, locale)}
                  </td>
                  <td className="px-5 py-4">
                    {isOpen ? (
                      <Badge variant={seats <= 3 ? 'warning' : 'success'}>
                        {t('seatsLeft', { count: seats })}
                      </Badge>
                    ) : (
                      <Badge variant="danger">{t('full')}</Badge>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isOpen ? (
                      <Link
                        href={`/register/${group.id}`}
                        className={cn(
                          buttonVariants({ variant: 'accent', size: 'sm' })
                        )}
                      >
                        {t('join')}
                      </Link>
                    ) : (
                      <span
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'pointer-events-none opacity-50'
                        )}
                      >
                        {t('join')}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{t('timezoneNote')}</p>
    </div>
  );
}
