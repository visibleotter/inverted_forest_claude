import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { LegalDocumentView } from '@/components/legal/legal-document';
import { privacyPolicy } from '@/lib/content/legal';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('privacy.title'),
    alternates: {
      canonical: `/${locale}/privacy`,
      languages: { ru: '/ru/privacy', en: '/en/privacy' }
    }
  };
}

export default function PrivacyPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  return <LegalDocumentView doc={privacyPolicy} />;
}
