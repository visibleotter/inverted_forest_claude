import { ArrowRight, CalendarDays, Check, Users } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { ExpandableCard } from '@/components/ui/expandable-card';
import { getData } from '@/lib/data';
import type { Course, Locale } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { cn, formatDate, formatPrice, lt } from '@/lib/utils';

/**
 * Grid of expandable course cards.
 *
 * The collapsed card carries the one-sentence `shortDescription` that already
 * exists on every course, so nothing new had to be authored and the strip
 * stays in sync with the course pages.
 */
export async function CourseExpandableCards({
  courses
}: {
  courses: Course[];
}) {
  const locale = (await getLocale()) as Locale;
  const [t, tCourses, tSchedule] = await Promise.all([
    getTranslations('course'),
    getTranslations('courses'),
    getTranslations('schedule')
  ]);
  const data = getData();

  const cards = await Promise.all(
    courses.map(async (course) => {
      const groups = await data.getGroupsForCourse(course.id);
      const enrolling = groups
        .filter((g) => g.status === 'enrolling')
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
      const nextGroup = enrolling[0];
      const seats = enrolling.reduce((sum, g) => sum + seatsRemaining(g), 0);
      return { course, nextGroup, seats };
    })
  );

  return (
    <div className="w-full">
      {/*
        On phones a lane rather than a stack: each card takes most of the
        width and the next one shows at the edge, so the thumb knows there
        is more and swipes. Snap keeps every card landing square. From the
        small breakpoint up it is the grid it always was.
      */}
      <ul className="scrollbar-none -mx-5 flex snap-x snap-mandatory scroll-px-5 gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {cards.map(({ course, nextGroup, seats }) => (
          <li key={course.id} className="w-[82%] shrink-0 snap-start sm:w-auto">
            <ExpandableCard
              className="h-full"
              title={lt(course.title, locale)}
              eyebrow={tCourses(`category.${course.category}`)}
              summary={lt(course.shortDescription, locale)}
              src={course.imageUrl ?? ''}
              openLabel={tCourses('viewCourse')}
              closeLabel={tCourses('close')}
            >
              <div className="space-y-6">
                <p className="leading-relaxed text-muted-foreground">
                  {lt(course.description, locale)}
                </p>

                <div>
                  <h4 className="font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('outcomesTitle')}
                  </h4>
                  <ul className="mt-3 space-y-2">
                    {course.outcomes[locale].slice(0, 4).map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                          aria-hidden
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <dl className="flex flex-wrap gap-x-8 gap-y-3 rounded-card bg-muted/60 p-4 text-sm">
                  <div>
                    <dt className="text-muted-foreground">
                      {tCourses('perMonth')}
                    </dt>
                    <dd className="mt-0.5 font-display text-xl font-semibold">
                      {formatPrice(
                        course.monthlyPrice,
                        course.currency,
                        locale
                      )}
                    </dd>
                  </div>
                  {nextGroup && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                        {tCourses('nextCohort')}
                      </dt>
                      <dd className="mt-0.5 font-medium">
                        {nextGroup.startDateConfirmed
                          ? formatDate(nextGroup.startDate, locale)
                          : tSchedule('startsWhenFull')}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden />
                      {tCourses('seatsLeft', { count: seats })}
                    </dt>
                    <dd className="mt-0.5 font-medium">
                      {tCourses('months', { count: course.durationMonths })}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/courses/${course.slug}`}
                  className={cn(buttonVariants({ variant: 'accent' }))}
                >
                  {tCourses('viewCourse')}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </ExpandableCard>
          </li>
        ))}
      </ul>
    </div>
  );
}
