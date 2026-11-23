import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { buttonVariants } from '@/components/ui/button';
import { siteConfig } from '@/lib/config';

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

/** `https://t.me/name` → `@name`; anything else is shown as it is. */
function telegramHandle(url: string): string {
  const match = url.match(/t\.me\/([A-Za-z0-9_]+)/);
  return match ? `@${match[1]}` : url;
}

/** `https://wa.me/972549811838` → `+972 54-981-1838`. */
function whatsappNumber(url: string): string | null {
  const digits = url.match(/wa\.me\/(\d+)/)?.[1];
  if (!digits) return null;
  const israeli = digits.match(/^972(\d{2})(\d{3})(\d{4})$/);
  return israeli ? `+972 ${israeli[1]}-${israeli[2]}-${israeli[3]}` : `+${digits}`;
}

/**
 * How to reach a person. Telegram first — it is where this audience
 * already is — then WhatsApp and email. The handle, number and address
 * are written out, so they can be copied or read aloud, not only tapped.
 */
export default async function ContactsPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations('contacts');
  const phone = whatsappNumber(siteConfig.whatsappUrl);

  const rows: { label: string; value: string; href: string; primary?: boolean }[] = [
    {
      label: t('telegram'),
      value: telegramHandle(siteConfig.telegramUrl),
      href: siteConfig.telegramUrl,
      primary: true
    },
    {
      label: t('whatsapp'),
      value: phone ?? siteConfig.whatsappUrl,
      href: siteConfig.whatsappUrl
    },
    {
      label: t('emailLabel'),
      value: siteConfig.contactEmail,
      href: `mailto:${siteConfig.contactEmail}`
    }
  ];

  return (
    <div className="container-content pb-24 pt-10 sm:pt-16">
      <div className="max-w-prose">
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[46px]">
          {t('title')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('intro')}</p>
      </div>

      <ul className="mt-10 max-w-prose border-t border-border">
        {rows.map((row) => (
          <li
            key={row.href}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-border py-5"
          >
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{row.label}</p>
              <p className="mt-0.5 select-all font-serif text-[19px]">{row.value}</p>
            </div>
            <a
              href={row.href}
              target={row.href.startsWith('mailto:') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className={buttonVariants({ variant: row.primary ? 'primary' : 'outline' })}
            >
              {t('write')}
            </a>
          </li>
        ))}
      </ul>

      <p className="mt-6 max-w-prose text-[15px] text-muted-foreground">{t('note')}</p>
    </div>
  );
}
