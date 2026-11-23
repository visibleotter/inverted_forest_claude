import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { CourseArt } from '@/components/marketing/course-art';
import type { Course, Locale } from '@/lib/types';
import { formatPrice, lt } from '@/lib/utils';

/**
 * One course, presented as an exhibit: the artwork with its label, the
 * title, and a single line of facts.
 *
 * The facts are plain text, not a row of badges — "Adults and teens ·
 * 3 months · 220 ₪ a month" says in one glance what four coloured pills
 * made the reader assemble. No start date and no seat count here: those
 * belong to a group, and a course has several.
 */
export async function CourseCard({
  course,
  priority,
  withDescription,
  sizes = '(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 25vw'
}: {
  course: Course;
  priority?: boolean;
  /** The catalogue has room for the one-line summary; the home page not. */
  withDescription?: boolean;
  sizes?: string;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('courses');
  const title = lt(course.title, locale);

  const ages = course.ageGroups
    .map((age, i) => {
      const label = t(`ageGroup.${age}`);
      return i === 0 ? label : label.toLocaleLowerCase(locale);
    })
    .join(` ${t('and')} `);

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group grid content-start gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <CourseArt
        src={course.imageUrl}
        alt={title}
        locale={locale}
        priority={priority}
        sizes={sizes}
      />
      <h3 className="mt-4 text-[21px] leading-snug underline-offset-4 group-hover:underline">
        {title}
      </h3>
      <p className="text-[15px] text-muted-foreground">
        {ages} · {t('months', { count: course.durationMonths })} ·{' '}
        {formatPrice(course.monthlyPrice, course.currency, locale)} {t('perMonth')}
      </p>
      {withDescription && (
        <p className="text-body mt-2 text-muted-foreground">
          {lt(course.shortDescription, locale)}
        </p>
      )}
    </Link>
  );
}
