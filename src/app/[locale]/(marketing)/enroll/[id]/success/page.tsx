import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnrollmentStatus } from '@/components/marketing/enrollment-status';

/**
 * Where Allpay sends the payer back to.
 *
 * Deliberately noindex: it is a personal, transient page keyed to one
 * enrollment, and there is nothing here for a search engine.
 */
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function EnrollSuccessPage({
  params: { locale, id }
}: {
  params: { locale: string; id: string };
}) {
  setRequestLocale(locale);

  return (
    <div className="container-content pb-24 pt-10 sm:pt-16">
      <div className="max-w-prose">
        <EnrollmentStatus enrollmentId={id} />
      </div>
    </div>
  );
}
