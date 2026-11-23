import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
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

  return (
    <div className="container-content pb-20 pt-10 sm:pt-16">
      <div className="max-w-prose">
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[46px]">
          {t('title')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('intro')}</p>
      </div>

      {courses.length === 0 ? (
        <p className="mt-12 text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="mt-12 grid gap-16 border-t border-border pt-12 sm:grid-cols-2 sm:gap-x-12">
          {courses.map((course, i) => (
            <CourseCard
              key={course.id}
              course={course}
              priority={i < 2}
              withDescription
              sizes="(max-width: 720px) 100vw, 50vw"
            />
          ))}
        </div>
      )}
    </div>
  );
}
