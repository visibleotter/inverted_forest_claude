import { GraduationCap } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false } };
}

/**
 * Student portal placeholder. The data model (students, enrollments,
 * payments, invoices) is already in place — this page will grow into
 * My Courses / Payments / Telegram & Zoom links / Homework / Certificates.
 */
export default async function PortalPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('portal');

  return (
    <div className="container-content flex min-h-[50vh] flex-col items-center justify-center gap-5 py-20 text-center">
      <GraduationCap className="h-10 w-10 text-amber" aria-hidden />
      <h1 className="text-balance text-3xl font-semibold sm:text-4xl">
        {t('comingSoon')}
      </h1>
      <p className="max-w-lg text-muted-foreground">{t('comingSoonText')}</p>
      <Link href="/" className={buttonVariants({ variant: 'accent' })}>
        {t('backHome')}
      </Link>
    </div>
  );
}
