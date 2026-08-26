import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalDocumentView } from '@/components/legal/legal-document';
import { termsAndConditions } from '@/lib/content/legal';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('terms.title'),
    alternates: {
      canonical: `/${locale}/terms`,
      languages: { ru: '/ru/terms', en: '/en/terms' }
    }
  };
}

export default function TermsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return <LegalDocumentView doc={termsAndConditions} />;
}
