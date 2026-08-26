import { ArrowRight, CalendarDays, Clock, Users } from 'lucide-react';
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { getData } from '@/lib/data';
import type { Course, Locale, Teacher } from '@/lib/types';
import { seatsRemaining } from '@/lib/types';
import { formatDate, formatPrice, lt } from '@/lib/utils';

export async function CourseCard({ course }: { course: Course }) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('courses');
  const data = getData();

  const [teacher, groups] = await Promise.all([
    data.getTeacherById(course.teacherId),
    data.getGroupsForCourse(course.id)
  ]);

  const enrolling = groups
    .filter((g) => g.status === 'enrolling')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  const nextGroup = enrolling[0];
  const seats = enrolling.reduce((sum, g) => sum + seatsRemaining(g), 0);

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <Link
        href={`/courses/${course.slug}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {course.imageUrl && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={course.imageUrl}
              alt={lt(course.title, locale)}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        )}

        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="accent">{t(`category.${course.category}`)}</Badge>
            <Badge>{t(`difficulty.${course.difficulty}`)}</Badge>
            {course.ageGroups.map((age) => (
              <Badge key={age} variant="outline">
                {t(`ageGroup.${age}`)}
              </Badge>
            ))}
          </div>

          <h3 className="text-xl font-semibold">{lt(course.title, locale)}</h3>
          {teacher && (
            <p className="mt-1 text-sm text-muted-foreground">
              {lt(teacher.name, locale)}
            </p>
          )}
          <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {lt(course.shortDescription, locale)}
          </p>

          <dl className="mt-5 space-y-1.5 border-t border-border pt-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {t('months', { count: course.durationMonths })} ·{' '}
                <span className="font-semibold text-foreground">
                  {formatPrice(course.monthlyPrice, course.currency, locale)}
                </span>{' '}
                {t('perMonth')}
              </span>
            </div>
            {nextGroup && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span>
                  {t('nextCohort')}: {formatDate(nextGroup.startDate, locale)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {seats > 0 ? t('seatsLeft', { count: seats }) : t('noSeats')}
              </span>
            </div>
          </dl>

          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
            {t('viewCourse')}
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </Link>
    </Card>
  );
}
