import { Mail, MessageCircle, Send } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/fade-in';
import { siteConfig } from '@/lib/config';
import { cn } from '@/lib/utils';

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('contacts.title'),
    description: t('contacts.description')
  };
}

export default async function ContactsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('contacts');

  return (
    <div className="container-content py-16 sm:py-20">
      <FadeIn className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold sm:text-5xl">
          {t('title')}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{t('intro')}</p>
      </FadeIn>

      <div className="mt-12 max-w-xl">
        <FadeIn>
          <Card className="h-full">
            <CardContent className="flex h-full flex-col gap-4 p-8">
              <div className="flex flex-col gap-3">
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'primary', size: 'lg' }),
                    'w-full'
                  )}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden />
                  {t('whatsapp')}
                </a>
                <a
                  href={siteConfig.telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: 'accent', size: 'lg' }),
                    'w-full'
                  )}
                >
                  <Send className="h-4 w-4" aria-hidden />
                  {t('telegram')}
                </a>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" aria-hidden />
                <span>{t('emailLabel')}</span>
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {siteConfig.contactEmail}
                </a>
              </div>
              <p className="mt-auto pt-4 text-sm text-muted-foreground">
                {t('note')}
              </p>
            </CardContent>
          </Card>
        </FadeIn>

      </div>
    </div>
  );
}
