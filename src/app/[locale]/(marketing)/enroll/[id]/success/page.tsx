import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { EnrollmentStatus } from '@/components/marketing/enrollment-status';
import { siteConfig } from '@/lib/config';

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
    <div className="container-content py-20 sm:py-28">
      <div className="mx-auto max-w-xl">
        <EnrollmentStatus
          enrollmentId={id}
          contactHref={`mailto:${siteConfig.contactEmail}`}
        />
      </div>
    </div>
  );
}
