import {
  ArrowLeft,
  Check,
  CircleDollarSign,
  MessagesSquare,
  Send,
  Users,
  Video
} from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AccordionItem } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { Section } from '@/components/ui/section';
import { ScheduleTable } from '@/components/marketing/schedule-table';
import { siteConfig } from '@/lib/config';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { formatPrice, lt } from '@/lib/utils';

interface Props {
  params: { locale: string; slug: string };
}

export async function generateMetadata({
  params: { locale, slug }
}: Props): Promise<Metadata> {
  const course = await getData().getCourseBySlug(slug);
  if (!course) return {};
  const l = locale as Locale;
  return {
    title: lt(course.title, l),
    description: lt(course.shortDescription, l),
    alternates: {
      canonical: `/${locale}/courses/${slug}`,
      languages: { ru: `/ru/courses/${slug}`, en: `/en/courses/${slug}` }
    },
    openGraph: {
      title: lt(course.title, l),
      description: lt(course.shortDescription, l),
      images: course.imageUrl ? [course.imageUrl] : undefined
    }
  };
}

export default async function CoursePage({ params: { locale, slug } }: Props) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const data = getData();

  const course = await data.getCourseBySlug(slug);
  if (!course || course.status !== 'published') notFound();

  const [teacher, groups, t, tCourses] = await Promise.all([
    data.getTeacherById(course.teacherId),
    data.getGroupsForCourse(course.id),
    getTranslations('course'),
    getTranslations('courses')
  ]);

  const format = [
    { icon: Video, text: t('format1') },
    { icon: MessagesSquare, text: t('format2') },
    { icon: Users, text: t('format3') },
    { icon: CircleDollarSign, text: t('format4') }
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: lt(course.title, l),
    description: lt(course.shortDescription, l),
    inLanguage: locale,
    provider: {
      '@type': 'Organization',
      name: siteConfig.name,
      url: siteConfig.url
    },
    offers: {
      '@type': 'Offer',
      price: course.monthlyPrice,
      priceCurrency: course.currency,
      category: 'Subscription'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="surface-dark bg-forest text-paper">
        <div className="container-content grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <FadeIn>
            <Link
              href="/courses"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-paper/70 transition-colors hover:text-paper"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('backToCourses')}
            </Link>
            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant="accent">
                {tCourses(`category.${course.category}`)}
              </Badge>
              <Badge className="bg-paper/10 text-paper/90">
                {tCourses(`difficulty.${course.difficulty}`)}
              </Badge>
              {course.ageGroups.map((age) => (
                <Badge key={age} className="bg-paper/10 text-paper/90">
                  {tCourses(`ageGroup.${age}`)}
                </Badge>
              ))}
            </div>
            <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
              {lt(course.title, l)}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-paper/80">
              {lt(course.shortDescription, l)}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <a
                href="#schedule"
                className={buttonVariants({ variant: 'accent', size: 'lg' })}
              >
                {t('registerCta')}
              </a>
              <p className="text-paper/80">
                <span className="font-display text-2xl font-semibold text-paper">
                  {formatPrice(course.monthlyPrice, course.currency, l)}
                </span>{' '}
                {tCourses('perMonth')} ·{' '}
                {tCourses('months', { count: course.durationMonths })}
              </p>
            </div>
          </FadeIn>
          {course.imageUrl && (
            <FadeIn delay={0.15}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-card shadow-2xl">
                <Image
                  src={course.imageUrl}
                  alt={lt(course.title, l)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* Description + outcomes + audience */}
      <Section title={t('aboutTitle')}>
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <FadeIn>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {lt(course.description, l)}
            </p>

            <h3 className="mt-10 text-xl font-semibold">
              {t('outcomesTitle')}
            </h3>
            <ul className="mt-4 space-y-3">
              {course.outcomes[l].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <Check
                    className="mt-1 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </FadeIn>

          <FadeIn delay={0.1}>
            <Card>
              <CardContent>
                <h3 className="text-lg font-semibold">{t('audienceTitle')}</h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {course.audience[l].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Users
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <h3 className="mt-8 text-lg font-semibold">
                  {t('formatTitle')}
                </h3>
                <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                  {format.map((item) => (
                    <li key={item.text} className="flex items-start gap-3">
                      <item.icon
                        className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                        aria-hidden
                      />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                {course.publicTelegramUrl && (
                  <a
                    href={course.publicTelegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                  >
                    <Send className="h-4 w-4" aria-hidden />
                    {t('telegramPublic')}
                  </a>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>
      </Section>

      {/* Curriculum */}
      <Section className="bg-muted/40" title={t('curriculumTitle')}>
        <div className="grid gap-6 lg:grid-cols-3">
          {course.curriculum.map((module, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent>
                  <p className="text-xs font-semibold uppercase tracking-widest text-accent">
                    {t('moduleLabel', { number: i + 1 })}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold">
                    {lt(module.title, l)}
                  </h3>
                  <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                    {module.topics[l].map((topic) => (
                      <li key={topic} className="flex items-start gap-2.5">
                        <span
                          className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent"
                          aria-hidden
                        />
                        {topic}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* Teacher */}
      {teacher && (
        <Section title={t('teacherTitle')}>
          <FadeIn>
            <Card className="max-w-3xl">
              <CardContent className="sm:p-8">
                <h3 className="text-2xl font-semibold">
                  {lt(teacher.name, l)}
                </h3>
                <p className="mt-1 text-sm font-medium text-accent">
                  {lt(teacher.title, l)}
                </p>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  {lt(teacher.bio, l)}
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        </Section>
      )}

      {/* Schedule */}
      <Section
        id="schedule"
        className="scroll-mt-20 bg-muted/40"
        title={t('scheduleTitle')}
        subtitle={t('scheduleSubtitle')}
      >
        <FadeIn>
          <ScheduleTable groups={groups} />
        </FadeIn>
        <FadeIn className="mt-8">
          <p className="text-sm text-muted-foreground">
            {t('pricingNote', {
              months: tCourses('months', { count: course.durationMonths })
            })}{' '}
            <span className="font-semibold text-foreground">
              {formatPrice(course.monthlyPrice, course.currency, l)}
            </span>{' '}
            {tCourses('perMonth')}.
          </p>
        </FadeIn>
      </Section>

      {/* Course FAQ */}
      {course.faq.length > 0 && (
        <Section title={t('faqTitle')}>
          <FadeIn className="max-w-3xl rounded-card border border-border bg-card px-6">
            {course.faq.map((item, i) => (
              <AccordionItem
                key={i}
                question={lt(item.question, l)}
                answer={lt(item.answer, l)}
              />
            ))}
          </FadeIn>
        </Section>
      )}
    </>
  );
}
