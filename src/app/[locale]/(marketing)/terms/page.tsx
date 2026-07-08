import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('terms.title') };
}

export default async function TermsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="container-content max-w-3xl py-16 sm:py-20">
      <h1 className="text-4xl font-semibold">{t('termsTitle')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t('termsUpdated')}</p>
      <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
        <p>{t('termsIntro')}</p>
        <p>{t('termsBody')}</p>
      </div>
    </div>
  );
}
