import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return { title: t('privacy.title') };
}

export default async function PrivacyPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('legal');

  return (
    <div className="container-content max-w-3xl py-16 sm:py-20">
      <h1 className="text-4xl font-semibold">{t('privacyTitle')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('privacyUpdated')}
      </p>
      <div className="mt-8 space-y-5 leading-relaxed text-muted-foreground">
        <p>{t('privacyIntro')}</p>
        <p>{t('privacyBody')}</p>
      </div>
    </div>
  );
}
