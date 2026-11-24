import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FadeIn } from '@/components/ui/fade-in';
import { AgeFilter } from '@/components/marketing/age-filter';
import { CourseCard } from '@/components/marketing/course-card';
import { getData } from '@/lib/data';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('courses.title'),
    description: t('courses.description')
  };
}

export default async function CoursesPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('courses');
  const courses = await getData().getCourses();

  // Only the audiences some course actually has; no chip leads to nothing.
  const present = new Set(courses.flatMap((course) => course.ageGroups));
  const filterOptions = [
    { value: 'all', label: t('filterAll') },
    ...(['adults', 'teens', 'children'] as const)
      .filter((age) => present.has(age))
      .map((age) => ({ value: age, label: t(`filterFor.${age}`) }))
  ];

  return (
    <div className="container-content py-16 sm:py-20">
      <FadeIn className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('intro')}</p>
      </FadeIn>

      {courses.length === 0 ? (
        <p className="mt-16 text-muted-foreground">{t('empty')}</p>
      ) : (
        <AgeFilter label={t('filterLabel')} options={filterOptions}>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <div key={course.id} data-ages={course.ageGroups.join(' ')}>
                <FadeIn delay={(i % 3) * 0.08} className="h-full">
                  <CourseCard course={course} />
                </FadeIn>
              </div>
            ))}
          </div>
        </AgeFilter>
      )}
    </div>
  );
}
