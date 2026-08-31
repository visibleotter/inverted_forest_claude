import { CalendarDays, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { SlotTime } from '@/components/marketing/slot-time';
import type { AgeGroup, Locale, StudyGroup } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { cn, formatDate, weekdayName } from '@/lib/utils';

/**
 * The slots of one course.
 *
 * Cards rather than a table, and split by audience, for two reasons that
 * are really the same reason: this is where the decision is made, and it
 * is mostly made on a phone.
 *
 * A table forced horizontal scrolling on the one screen that matters, and
 * it interleaved children's and adults' groups so a parent had to read
 * every row to find the two that concerned them. Two headed sections beat
 * tabs here — both are visible at once, both are indexed, and nobody has
 * to guess which one is open.
 *
 * Groups already running are shown rather than hidden. A course in its
 * second month used to display an empty schedule, which reads as a course
 * that is not happening at all.
 */

const CHILD_AUDIENCES: AgeGroup[] = ['children', 'teens'];

interface Props {
  groups: StudyGroup[];
}

export async function ScheduleSlots({ groups }: Props) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('schedule');

  const visible = groups.filter((group) =>
    ['enrolling', 'full', 'in_progress'].includes(group.status)
  );

  if (visible.length === 0) {
    return (
      <p className="rounded-card border border-border bg-card px-5 py-8 text-center text-muted-foreground">
        {t('noSlots')}
      </p>
    );
  }

  const isOpen = (group: StudyGroup) =>
    group.status === 'enrolling' && seatsRemaining(group) > 0;

  // Offered as an alternative when a slot is full: a dead "Join" button is
  // where interest goes to die.
  const openElsewhere = visible.filter(isOpen);

  const sections = [
    {
      key: 'children' as const,
      groups: visible.filter((g) => CHILD_AUDIENCES.includes(g.audience))
    },
    {
      key: 'adults' as const,
      groups: visible.filter((g) => !CHILD_AUDIENCES.includes(g.audience))
    }
  ].filter((section) => section.groups.length > 0);

  // With only one audience there is nothing to distinguish, so the heading
  // would be noise.
  const showHeadings = sections.length > 1;

  return (
    <div className="space-y-10">
      {sections.map((section) => (
        <section key={section.key}>
          {showHeadings && (
            <div className="mb-4">
              <h3 className="font-sans text-base font-semibold">
                {t(`audience.${section.key}`)}
              </h3>
              {section.key === 'children' && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('audience.childrenNote')}
                </p>
              )}
            </div>
          )}

          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.groups.map((group) => {
              const seats = seatsRemaining(group);
              const open = isOpen(group);
              const running = group.status === 'in_progress';
              const alternative = openElsewhere.find((g) => g.id !== group.id);

              return (
                <li key={group.id} id={`slot-${group.id}`}>
                  <div
                    className={cn(
                      'flex h-full flex-col rounded-card border p-5',
                      open
                        ? 'border-border bg-card'
                        : 'border-border/60 bg-card/60'
                    )}
                  >
                    <p className="font-display text-xl font-semibold capitalize">
                      {weekdayName(group.weekday, locale)}
                    </p>
                    <p className="mt-0.5 text-lg">
                      <SlotTime
                        weekday={group.weekday}
                        time={group.time}
                        timezone={group.timezone}
                        referenceDate={group.startDate}
                        locale={locale}
                      />
                    </p>

                    <dl className="mt-4 space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <CalendarDays
                          className="mt-0.5 h-4 w-4 shrink-0"
                          aria-hidden
                        />
                        <dd>
                          {running
                            ? t('runningSince', {
                                date: formatDate(group.startDate, locale)
                              })
                            : group.startDateConfirmed
                              ? t('startsOn', {
                                  date: formatDate(group.startDate, locale)
                                })
                              : t('startsWhenFull')}
                        </dd>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <dd>
                          {t('groupSize', { capacity: group.capacity })}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4">
                      {open ? (
                        <Badge variant={seats <= 2 ? 'warning' : 'success'}>
                          {t('seatsLeft', { count: seats })}
                        </Badge>
                      ) : running ? (
                        <Badge variant="default">{t('running')}</Badge>
                      ) : (
                        <Badge variant="danger">{t('full')}</Badge>
                      )}
                    </div>

                    <div className="mt-auto pt-5">
                      {open ? (
                        <Link
                          href={`/register/${group.id}`}
                          className={cn(
                            buttonVariants({ variant: 'accent' }),
                            'w-full'
                          )}
                        >
                          {t('join')}
                        </Link>
                      ) : alternative ? (
                        <p className="text-sm text-muted-foreground">
                          {t('tryInstead')}{' '}
                          <a
                            href={`#slot-${alternative.id}`}
                            className="font-medium text-accent hover:underline"
                          >
                            {weekdayName(alternative.weekday, locale)}{' '}
                            {alternative.time}
                          </a>
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {t('noneOpen')}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <p className="text-xs text-muted-foreground">{t('timezoneNote')}</p>
      <p className="text-xs text-muted-foreground">{t('holidaysNote')}</p>

      {/* What happens after payment, where the doubt actually arises —
          at the slot list, not on the registration page they only reach
          once they have already decided. */}
      <div className="rounded-card border border-border bg-muted/40 p-5">
        <p className="text-sm font-semibold">{t('afterPaymentTitle')}</p>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {[1, 2, 3].map((step) => (
            <li key={step} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent"
                aria-hidden
              >
                {step}
              </span>
              {t(`afterPayment${step}` as 'afterPayment1')}
            </li>
          ))}
        </ol>
      </div>

    </div>
  );
}
