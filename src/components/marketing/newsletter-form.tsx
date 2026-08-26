'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { subscribeNewsletter } from '@/lib/actions';

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" disabled={pending}>
      {label}
    </Button>
  );
}

export function NewsletterForm() {
  const t = useTranslations('home');
  const locale = useLocale();
  const [state, action] = useFormState(subscribeNewsletter, {
    status: 'idle' as const
  });

  if (state.status === 'success') {
    return <p className="font-medium text-accent">{t('newsletterSuccess')}</p>;
  }

  return (
    <form
      action={action}
      className="relative flex w-full max-w-md flex-col gap-3 sm:flex-row"
    >
      <input type="hidden" name="locale" value={locale} />
      {/* Honeypot — see registration-form.tsx */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label htmlFor="newsletter-email" className="sr-only">
        {t('newsletterPlaceholder')}
      </label>
      <Input
        id="newsletter-email"
        name="email"
        type="email"
        required
        placeholder={t('newsletterPlaceholder')}
        className="flex-1"
      />
      <SubmitButton label={t('newsletterButton')} />
      {(state.status === 'error' || state.status === 'rate_limited') && (
        <p role="alert" className="text-sm text-red-500">
          {state.status === 'rate_limited'
            ? t('newsletterRateLimited')
            : t('newsletterError')}
        </p>
      )}
    </form>
  );
}
