import {
  BookOpenText,
  CalendarCheck,
  CreditCard,
  MessagesSquare,
  Quote,
  Send,
  Sparkles,
  Users,
  Video
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AccordionItem } from '@/components/ui/accordion';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { Section } from '@/components/ui/section';
import { CourseExpandableCards } from '@/components/marketing/course-expandable-cards';
import { SmoothScrollHero } from '@/components/ui/smooth-scroll-hero';
import { NewsletterForm } from '@/components/marketing/newsletter-form';
import { getData } from '@/lib/data';
import { cn } from '@/lib/utils';

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

export default async function HomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('home');
  const tFaq = await getTranslations('faq');
  const courses = await getData().getCourses();

  const why = [
    { icon: Sparkles, title: t('why1Title'), text: t('why1Text') },
    { icon: Users, title: t('why2Title'), text: t('why2Text') },
    { icon: Video, title: t('why3Title'), text: t('why3Text') },
    { icon: MessagesSquare, title: t('why4Title'), text: t('why4Text') }
  ];

  const how = [
    { icon: CalendarCheck, title: t('how1Title'), text: t('how1Text') },
    { icon: CreditCard, title: t('how2Title'), text: t('how2Text') },
    { icon: Send, title: t('how3Title'), text: t('how3Text') },
    { icon: Video, title: t('how4Title'), text: t('how4Text') }
  ];

  const testimonials = [1, 2, 3].map((i) => ({
    text: t(`testimonial${i}` as 'testimonial1'),
    author: t(`testimonial${i}Author` as 'testimonial1Author')
  }));

  const faqItems = tFaq.raw('items') as { q: string; a: string }[];

  return (
    <>
      {/* Hero — the image opens on scroll, then the copy rises into it */}
      <SmoothScrollHero
        scrollHeight={1200}
        desktopImage="/images/hero.webp"
        className="surface-dark text-paper"
      >
        <div className="container-content flex flex-col items-start gap-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent">
            {t('heroEyebrow')}
          </p>
          <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-paper/80">
            {t('heroSubtitle')}
          </p>
          <Link
            href="/courses"
            className={cn(
              buttonVariants({ variant: 'accent', size: 'lg' }),
              'mt-4'
            )}
          >
            {t('heroCtaPrimary')}
          </Link>
        </div>
      </SmoothScrollHero>

      {/* Manifesto */}
      <Section>
        <FadeIn className="mx-auto max-w-3xl text-center">
          <BookOpenText
            className="mx-auto mb-6 h-8 w-8 text-accent"
            aria-hidden
          />
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
            {t('manifestoTitle')}
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {t('manifesto')}
          </p>
        </FadeIn>
      </Section>

      {/* Featured courses */}
      <Section
        className="bg-muted/40"
        title={t('featuredTitle')}
        subtitle={t('featuredSubtitle')}
      >
        <CourseExpandableCards courses={courses} />
        <FadeIn className="mt-10">
          <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>
            {t('allCourses')}
          </Link>
        </FadeIn>
      </Section>

      {/* Why study here */}
      <Section title={t('whyTitle')}>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {why.map((item, i) => (
            <FadeIn key={item.title} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent>
                  <item.icon className="mb-4 h-6 w-6 text-accent" aria-hidden />
                  <h3 className="font-sans text-base font-semibold">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.text}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* How learning works */}
      <Section className="surface-dark bg-forest text-paper" title={t('howTitle')}>
        <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {how.map((step, i) => (
            <FadeIn key={step.title} delay={i * 0.08}>
              <li className="relative">
                <span
                  className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-accent font-display text-lg font-semibold text-forest"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <h3 className="font-sans text-base font-semibold text-paper">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-paper/70">
                  {step.text}
                </p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </Section>

      {/* Testimonials */}
      <Section title={t('testimonialsTitle')}>
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((item, i) => (
            <FadeIn key={item.author} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent className="flex h-full flex-col">
                  <Quote className="mb-4 h-6 w-6 text-accent" aria-hidden />
                  <blockquote className="flex-1 text-base leading-relaxed">
                    {item.text}
                  </blockquote>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    — {item.author}
                  </p>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* FAQ preview */}
      <Section className="bg-muted/40" title={t('faqTitle')}>
        <FadeIn className="max-w-3xl">
          <div className="rounded-card border border-border bg-card px-6">
            {faqItems.slice(0, 4).map((item) => (
              <AccordionItem key={item.q} question={item.q} answer={item.a} />
            ))}
          </div>
          <Link
            href="/faq"
            className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
          >
            {t('faqMore')}
          </Link>
        </FadeIn>
      </Section>

      {/* Newsletter */}
      <Section>
        <FadeIn className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <h2 className="text-3xl font-semibold">{t('newsletterTitle')}</h2>
          <p className="text-muted-foreground">{t('newsletterText')}</p>
          <NewsletterForm />
        </FadeIn>
      </Section>
    </>
  );
}
