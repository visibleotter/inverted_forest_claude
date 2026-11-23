import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  const t = useTranslations('notFound');

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-semibold">{t('title')}</h1>
      <p className="max-w-md text-muted-foreground">{t('text')}</p>
      <Link href="/" className={buttonVariants({ variant: 'accent' })}>
        {t('backHome')}
      </Link>
    </div>
  );
}
