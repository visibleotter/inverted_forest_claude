import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuroraText } from '@/components/magicui/aurora-text';
import { BlurFade } from '@/components/magicui/blur-fade';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { Marquee } from '@/components/magicui/marquee';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Internal comparison page for MagicUI treatments. Not linked from the
 * site and excluded from indexing — delete once the choices are made.
 */
export const metadata: Metadata = {
  title: 'MagicUI lab',
  robots: { index: false, follow: false }
};

function Label({
  letter,
  name,
  verdict
}: {
  letter: string;
  name: string;
  verdict: string;
}) {
  return (
    <div className="container-content flex flex-wrap items-baseline gap-3 pb-4 pt-14">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold font-semibold text-night">
        {letter}
      </span>
      <h2 className="font-display text-xl font-semibold">{name}</h2>
      <span className="text-sm text-muted-foreground">{verdict}</span>
    </div>
  );
}

export default async function LabPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('home');

  const Hero = ({
    children,
    pattern
  }: {
    children: React.ReactNode;
    pattern?: React.ReactNode;
  }) => (
    <section className="relative overflow-hidden surface-dark bg-night text-linen">
      {pattern}
      <div className="container-content relative flex flex-col items-start gap-5 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">
          {t('heroEyebrow')}
        </p>
        {children}
        <p className="max-w-2xl text-lg leading-relaxed text-linen/80">
          {t('heroSubtitle')}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <span className={buttonVariants({ variant: 'accent', size: 'lg' })}>
            {t('heroCtaPrimary')}
          </span>
          <span
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'border-linen/30 text-linen'
            )}
          >
            {t('heroCtaSecondary')}
          </span>
        </div>
      </div>
    </section>
  );

  const headline = (
    <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
      {t('heroTitle')}
    </h1>
  );

  return (
    <div className="pb-24">
      <div className="container-content pt-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-gold">
          Internal
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          MagicUI treatments
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Four hero options and one testimonial option. A is what is live
          today. Pick one and tell me the letter — the rest gets deleted
          along with this page.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-5')}
        >
          ← Back to the real site
        </Link>
      </div>

      <Label
        letter="A"
        name="Current — plain gradient wash"
        verdict="what is live now, no MagicUI"
      />
      <Hero
        pattern={
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 20%, #D9A441 0, transparent 40%), radial-gradient(circle at 80% 70%, #8E9FD4 0, transparent 45%)'
            }}
          />
        }
      >
        {headline}
      </Hero>

      <Label
        letter="B"
        name="Dot pattern texture"
        verdict="my recommendation — static SVG, no JS, reads like Linear/Raycast"
      />
      <Hero
        pattern={
          <DotPattern
            spacing={22}
            radius={1}
            className="text-linen/[0.07] [mask-image:radial-gradient(70%_60%_at_30%_40%,white,transparent)]"
          />
        }
      >
        {headline}
      </Hero>

      <Label
        letter="C"
        name="Dot pattern + blur-fade headline"
        verdict="B plus a word-by-word reveal on load"
      />
      <Hero
        pattern={
          <DotPattern
            spacing={22}
            radius={1}
            className="text-linen/[0.07] [mask-image:radial-gradient(70%_60%_at_30%_40%,white,transparent)]"
          />
        }
      >
        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          {t('heroTitle')
            .split(' ')
            .map((word, i) => (
              <BlurFade
                key={`${word}-${i}`}
                inView={false}
                delay={i * 0.09}
                className="inline-block"
              >
                <span className="mr-[0.25em]">{word}</span>
              </BlurFade>
            ))}
        </h1>
      </Hero>

      <Label
        letter="D"
        name="Aurora gradient on the headline"
        verdict="brand-recoloured, but still the most 'SaaS' of the four"
      />
      <Hero
        pattern={
          <DotPattern
            spacing={22}
            radius={1}
            className="text-linen/[0.07] [mask-image:radial-gradient(70%_60%_at_30%_40%,white,transparent)]"
          />
        }
      >
        <h1 className="max-w-3xl text-balance text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          <AuroraText>{t('heroTitle')}</AuroraText>
        </h1>
      </Hero>

      <Label
        letter="E"
        name="Testimonials as a slow marquee"
        verdict="replaces the static three-column grid; pauses on hover"
      />
      <div className="bg-muted/40 py-14">
        <Marquee className="[--duration:80s]">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-[380px] shrink-0">
              <CardContent>
                <blockquote className="text-base leading-relaxed">
                  {t(`testimonial${i}` as 'testimonial1')}
                </blockquote>
                <p className="mt-4 text-sm font-medium text-muted-foreground">
                  — {t(`testimonial${i}Author` as 'testimonial1Author')}
                </p>
              </CardContent>
            </Card>
          ))}
        </Marquee>
      </div>
    </div>
  );
}
