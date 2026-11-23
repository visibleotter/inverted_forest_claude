import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AccordionItem } from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import { CourseArt } from '@/components/marketing/course-art';
import { CourseCard } from '@/components/marketing/course-card';
import { getData } from '@/lib/data';
import type { Locale } from '@/lib/types';
import { formatPrice } from '@/lib/utils';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: { absolute: t('home.title') },
    description: t('home.description')
  };
}

/**
 * The home page answers three questions on its first screen — what this
 * is, what it costs, where to click — and then shows the courses.
 *
 * The previous version opened on an empty dark screen that revealed its
 * headline only after a screen and a half of scrolling, followed by the
 * stock landing-page run of icon cards, numbered steps and testimonials.
 * All of that is gone. The facts under the headline are computed from
 * the data, so they cannot drift from what the course pages say.
 */
export default async function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const l = locale as Locale;
  const t = await getTranslations('home');
  const tFaq = await getTranslations('faq');
  const data = getData();
  const courses = await data.getCourses();
  const groups = (
    await Promise.all(courses.map((course) => data.getGroupsForCourse(course.id)))
  ).flat();

  const capacity = groups.length
    ? Math.max(...groups.map((group) => group.capacity))
    : null;
  const cheapest = courses.length
    ? courses.reduce((a, b) => (a.monthlyPrice <= b.monthlyPrice ? a : b))
    : null;

  const facts = [
    t('factCourses', { count: courses.length }),
    capacity ? t('factGroup', { capacity }) : null,
    cheapest
      ? t('factPrice', {
          price: formatPrice(cheapest.monthlyPrice, cheapest.currency, l)
        })
      : null,
    t('factFormat')
  ].filter(Boolean) as string[];

  const faqItems = tFaq.raw('items') as { q: string; a: string }[];

  return (
    <>
      <section className="container-content grid gap-10 pb-12 pt-10 sm:pt-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:pb-20">
        <div className="max-w-prose">
          <p className="eyebrow">{t('heroEyebrow')}</p>
          <h1 className="mt-3 text-balance text-[34px] leading-[1.15] sm:text-[46px]">
            {t('heroTitle')}
          </h1>
          <p className="text-body mt-5 text-muted-foreground">
            {t('heroSubtitle')}
          </p>
          {/* One line of plain facts. The non-breaking space glues each
              dot to the fact before it, so a wrap never starts a line
              with a stray separator. */}
          <p className="mt-6 text-[15px] leading-relaxed">
            {facts.join(' · ')}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <a href="#courses" className={buttonVariants()}>
              {t('heroCtaPrimary')}
            </a>
            <Link href="/faq" className={buttonVariants({ variant: 'link' })}>
              {t('heroCtaSecondary')}
            </Link>
          </div>
        </div>

        <CourseArt
          src="/images/hero.webp"
          alt={t('heroImageAlt')}
          locale={l}
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      </section>

      <Section id="courses" title={t('featuredTitle')} className="scroll-mt-16">
        <div className="grid gap-12 sm:grid-cols-2 sm:gap-x-8 lg:grid-cols-4">
          {courses.map((course, i) => (
            <CourseCard key={course.id} course={course} priority={i < 2} />
          ))}
        </div>
      </Section>

      <Section title={t('manifestoTitle')}>
        <p className="text-body max-w-prose">{t('manifesto')}</p>
      </Section>

      <Section title={t('faqTitle')}>
        <div className="max-w-prose border-t border-border">
          {faqItems.slice(0, 4).map((item) => (
            <AccordionItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
        <Link
          href="/faq"
          className={buttonVariants({ variant: 'link', className: 'mt-6' })}
        >
          {t('faqMore')}
        </Link>
      </Section>
    </>
  );
}
