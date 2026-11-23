import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/lib/config';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'thanks' });
  return { title: t('title'), robots: { index: false } };
}

/**
 * Where Allpay sends a payer back after a successful payment made through
 * a hand-made payment link.
 *
 * Such links cannot carry the enrollment number, so unlike
 * /enroll/<id>/success this page cannot look anything up. It says what has
 * happened, what happens next and when, and how to reach a person if it
 * does not — which is everything the payer needs at this moment.
 */
export default async function ThanksPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('thanks');

  return (
    <div className="container-content pb-24 pt-10 sm:pt-16">
      <div className="max-w-prose">
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
          {t('title')}
        </h1>
        <p className="text-body mt-4">{t('next')}</p>
        <p className="text-body mt-4 text-muted-foreground">{t('start')}</p>

        <h2 className="mt-12 text-[24px]">{t('noMessageTitle')}</h2>
        <p className="text-body mt-3 text-muted-foreground">{t('noMessageText')}</p>
        <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a href={siteConfig.telegramUrl} className={buttonVariants()}>
            Telegram
          </a>
          <a href={siteConfig.whatsappUrl} className={buttonVariants({ variant: 'link' })}>
            WhatsApp
          </a>
          <a
            href={`mailto:${siteConfig.contactEmail}`}
            className={buttonVariants({ variant: 'link' })}
          >
            {siteConfig.contactEmail}
          </a>
        </div>

        <p className="mt-12 border-t border-border pt-6 text-[15px] text-muted-foreground">
          {t.rich('refund', {
            terms: (chunks) => (
              <Link
                href="/terms#cancellation-and-refund-policy"
                className="text-accent underline underline-offset-4"
              >
                {chunks}
              </Link>
            )
          })}
        </p>
      </div>
    </div>
  );
}
