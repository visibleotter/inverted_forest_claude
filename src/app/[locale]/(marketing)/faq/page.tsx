import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccordionItem } from '@/components/ui/accordion';
import { FadeIn } from '@/components/ui/fade-in';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('faq.title'), description: t('faq.description') };
}

export default async function FaqPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('faq');
  const items = t.raw('items') as { q: string; a: string }[];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a }
    }))
  };

  return (
    <div className="container-content py-16 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <FadeIn className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('intro')}</p>
      </FadeIn>

      <FadeIn className="mt-12 max-w-3xl rounded-card border border-border bg-card px-6">
        {items.map((item) => (
          <AccordionItem key={item.q} question={item.q} answer={item.a} />
        ))}
      </FadeIn>
    </div>
  );
}
