import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { lt } from '@/lib/utils';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('about.title'), description: t('about.description') };
}

/**
 * Who is behind the courses, read like the opening pages of a book:
 * the story, the teacher, the principles, and one way onward.
 */
export default async function AboutPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('about');
  const tTeachers = await getTranslations('teachers');

  const data = getData();
  const [teachers, courses] = await Promise.all([
    data.getTeachers(),
    data.getCourses()
  ]);

  const values = [
    { title: t('value1Title'), text: t('value1Text') },
    { title: t('value2Title'), text: t('value2Text') },
    { title: t('value3Title'), text: t('value3Text') }
  ];

  return (
    <>
      <div className="container-content pb-4 pt-10 sm:pt-16">
        <div className="max-w-prose">
          <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[46px]">
            {t('title')}
          </h1>
          <p className="text-body mt-4 text-muted-foreground">{t('intro')}</p>
        </div>
      </div>

      <Section title={t('storyTitle')}>
        <div className="text-body max-w-prose space-y-5">
          <p>{t('story1')}</p>
          <p>{t('story2')}</p>
          <p>{t('story3')}</p>
        </div>
      </Section>

      <Section title={tTeachers('title')} subtitle={tTeachers('intro')}>
        <div className="grid gap-16">
          {teachers.map((teacher) => {
            const taught = courses.filter((c) => c.teacherId === teacher.id);
            return (
              <article
                key={teacher.id}
                className="grid gap-10 lg:grid-cols-[1fr_340px] lg:gap-16"
              >
                <div className="min-w-0 max-w-prose">
                  <h3 className="text-[28px]">{lt(teacher.name, l)}</h3>
                  <p className="mt-1 text-[15px] text-muted-foreground">
                    {lt(teacher.title, l)}
                  </p>
                  <p className="text-body mt-5">{lt(teacher.bio, l)}</p>
                  {taught.length > 0 && (
                    <>
                      <h4 className="mt-8 text-[15px] font-medium">
                        {tTeachers('coursesBy')}
                      </h4>
                      <ul className="mt-3 grid gap-2 text-[15px]">
                        {taught.map((course) => (
                          <li key={course.id}>
                            <Link
                              href={`/courses/${course.slug}`}
                              className="text-accent underline underline-offset-4"
                            >
                              {lt(course.title, l)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="min-w-0 border-t border-border pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
                  <h4 className="text-[15px] font-medium">
                    {tTeachers('highlightsTitle')}
                  </h4>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] text-muted-foreground marker:text-muted-foreground">
                    {teacher.highlights[l].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </Section>

      <Section title={t('valuesTitle')}>
        <dl className="grid gap-8 lg:grid-cols-3 lg:gap-12">
          {values.map((value) => (
            <div key={value.title} className="min-w-0">
              <dt className="font-serif text-[21px] font-medium">{value.title}</dt>
              <dd className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
                {value.text}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title={t('ctaTitle')}>
        <p className="text-body max-w-prose text-muted-foreground">{t('ctaText')}</p>
        <Link href="/courses" className={buttonVariants({ className: 'mt-6' })}>
          {t('ctaButton')}
        </Link>
      </Section>
    </>
  );
}
