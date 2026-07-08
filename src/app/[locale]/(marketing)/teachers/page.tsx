import { Check } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('teachers.title'),
    description: t('teachers.description')
  };
}

export default async function TeachersPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('teachers');
  const data = getData();
  const [teachers, courses] = await Promise.all([
    data.getTeachers(),
    data.getCourses()
  ]);

  return (
    <div className="container-content py-16 sm:py-20">
      <FadeIn className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('intro')}</p>
      </FadeIn>

      <div className="mt-12 space-y-10">
        {teachers.map((teacher) => {
          const taught = courses.filter((c) => c.teacherId === teacher.id);
          return (
            <FadeIn key={teacher.id}>
              <Card>
                <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <h2 className="text-3xl font-semibold">
                      {lt(teacher.name, l)}
                    </h2>
                    <p className="mt-1 font-medium text-amber">
                      {lt(teacher.title, l)}
                    </p>
                    <p className="mt-5 leading-relaxed text-muted-foreground">
                      {lt(teacher.bio, l)}
                    </p>

                    {taught.length > 0 && (
                      <>
                        <h3 className="mt-8 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('coursesBy')}
                        </h3>
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {taught.map((course) => (
                            <li key={course.id}>
                              <Link
                                href={`/courses/${course.slug}`}
                                className="inline-block rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-amber hover:text-amber"
                              >
                                {lt(course.title, l)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>

                  <div className="rounded-card bg-muted/60 p-6">
                    <h3 className="font-semibold">{t('highlightsTitle')}</h3>
                    <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                      {teacher.highlights[l].map((item) => (
                        <li key={item} className="flex items-start gap-3">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-amber"
                            aria-hidden
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          );
        })}
      </div>
    </div>
  );
}
