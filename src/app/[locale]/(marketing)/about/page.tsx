import { Heart, Sprout, Users } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { Section } from '@/components/ui/section';

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
  const t = await getTranslations('about');

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

      <Section className="bg-muted/40" title={t('valuesTitle')}>
        <div className="grid gap-6 lg:grid-cols-3">
          {values.map((value, i) => (
            <FadeIn key={value.title} delay={i * 0.08}>
              <Card className="h-full">
                <CardContent>
                  <value.icon className="mb-4 h-6 w-6 text-amber" aria-hidden />
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

      <Section>
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
