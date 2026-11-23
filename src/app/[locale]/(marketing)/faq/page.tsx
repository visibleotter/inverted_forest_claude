import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { AccordionItem } from '@/components/ui/accordion';

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
    <div className="container-content pb-24 pt-10 sm:pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-prose">
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[46px]">
          {t('title')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('intro')}</p>
      </div>

      <div className="mt-10 max-w-prose border-t border-border">
        {items.map((item) => (
          <AccordionItem key={item.q} question={item.q} answer={item.a} />
        ))}
      </div>
    </div>
  );
}
