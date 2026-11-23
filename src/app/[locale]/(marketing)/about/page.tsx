import { Check, Heart, Sprout, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
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
    { icon: Sprout, title: t('value1Title'), text: t('value1Text') },
    { icon: Users, title: t('value2Title'), text: t('value2Text') },
    { icon: Heart, title: t('value3Title'), text: t('value3Text') }
  ];

  return (
    <>
      <div className="container-content pt-16 sm:pt-20">
        <FadeIn className="max-w-2xl">
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t('intro')}</p>
        </FadeIn>
      </div>

      <Section title={t('storyTitle')}>
        <FadeIn className="max-w-3xl space-y-5 text-lg leading-relaxed text-muted-foreground">
          <p>{t('story1')}</p>
          <p>{t('story2')}</p>
          <p>{t('story3')}</p>
        </FadeIn>
      </Section>

      {/* Teachers, folded in from the page that used to hold them */}
      <Section
        className="section-soft"
        title={tTeachers('title')}
        subtitle={tTeachers('intro')}
      >
        <div className="space-y-10">
          {teachers.map((teacher) => {
            const taught = courses.filter((c) => c.teacherId === teacher.id);
            return (
              <FadeIn key={teacher.id}>
                <Card>
                  <CardContent className="grid gap-8 p-8 lg:grid-cols-[1.4fr_1fr]">
                    <div>
                      <h3 className="font-display text-3xl font-semibold">
                        {lt(teacher.name, l)}
                      </h3>
                      <p className="mt-1 font-medium text-accent">
                        {lt(teacher.title, l)}
                      </p>
                      <p className="mt-5 leading-relaxed text-muted-foreground">
                        {lt(teacher.bio, l)}
                      </p>

                      {taught.length > 0 && (
                        <>
                          <h4 className="mt-8 font-sans text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                            {tTeachers('coursesBy')}
                          </h4>
                          <ul className="mt-3 flex flex-wrap gap-2">
                            {taught.map((course) => (
                              <li key={course.id}>
                                <Link
                                  href={`/courses/${course.slug}`}
                                  className="inline-block rounded-full border border-border px-4 py-1.5 text-sm transition-colors hover:border-accent hover:text-accent"
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
                      <h4 className="font-sans font-semibold">
                        {tTeachers('highlightsTitle')}
                      </h4>
                      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                        {teacher.highlights[l].map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-accent"
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
      </Section>

      <Section title={t('valuesTitle')}>
        <div className="grid gap-6 lg:grid-cols-3">
          {values.map((value, i) => (
            <FadeIn key={value.title} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent>
                  <value.icon className="mb-4 h-6 w-6 text-accent" aria-hidden />
                  <h3 className="font-sans text-base font-semibold">
                    {value.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {value.text}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      <Section className="section-soft">
        <FadeIn className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold">{t('ctaTitle')}</h2>
          <p className="text-muted-foreground">{t('ctaText')}</p>
          <Link
            href="/courses"
            className={buttonVariants({ variant: 'accent', size: 'lg' })}
          >
            {t('ctaButton')}
          </Link>
        </FadeIn>
      </Section>
    </>
  );
}
