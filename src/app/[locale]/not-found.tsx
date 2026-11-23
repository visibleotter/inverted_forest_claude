import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { buttonVariants } from '@/components/ui/button';

/**
 * A page that does not exist, still inside the site: the header and the
 * way back are where they always are, so nobody is stranded.
 */
export default async function NotFound() {
  const t = await getTranslations('notFound');
  const tNav = await getTranslations('nav');

  return (
    <>
      <Header />
      <main className="container-content pb-24 pt-16 sm:pt-24">
        <div className="max-w-prose">
          <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
            {t('title')}
          </h1>
          <p className="text-body mt-4 text-muted-foreground">{t('text')}</p>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
            <Link href="/" className={buttonVariants()}>
              {t('backHome')}
            </Link>
            <Link href="/courses" className={buttonVariants({ variant: 'link' })}>
              {tNav('courses')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
