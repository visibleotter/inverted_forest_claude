'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitRegistration, type RegistrationState } from '@/lib/actions';
import { cn } from '@/lib/utils';

interface Props {
  groupId: string;
}

export function RegistrationForm({ groupId }: Props) {
  const t = useTranslations('register');
  const locale = useLocale();
  const [result, setResult] = useState<RegistrationState>({ status: 'idle' });

  const schema = z.object({
    firstName: z.string().trim().min(1, t('errors.firstName')),
    lastName: z.string().trim().min(1, t('errors.lastName')),
    email: z.string().trim().email(t('errors.email')),
    phone: z.string().trim().optional(),
    agreement: z.literal(true, {
      errorMap: () => ({ message: t('errors.agreement') })
    })
  });

  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.set('groupId', groupId);
    formData.set('firstName', values.firstName);
    formData.set('lastName', values.lastName);
    formData.set('email', values.email);
    formData.set('phone', values.phone ?? '');
    formData.set('locale', locale);

    const state = await submitRegistration({ status: 'idle' }, formData);
    setResult(state);

    if (state.status === 'success' && state.paymentUrl) {
      // Short pause so the confirmation is visible, then hand over
      // to the external payment page. The site never processes payments.
      setTimeout(() => {
        window.location.assign(state.paymentUrl!);
      }, 2500);
    }
  }

  if (result.status === 'success') {
    return (
      <div
        className="rounded-card border border-border bg-card p-8"
        role="status"
      >
        <h2 className="text-2xl font-semibold">{t('successTitle')}</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('successText')}
        </p>
        {result.paymentUrl && (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              {t('successManual')}
            </p>
            <a
              href={result.paymentUrl}
              className={cn(buttonVariants({ variant: 'accent' }), 'mt-4')}
            >
              {t('goToPayment')}
            </a>
          </>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="rounded-card border border-border bg-card p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium">
            {t('firstName')}
          </label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p role="alert" className="mt-1.5 text-sm text-red-500">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium">
            {t('lastName')}
          </label>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p role="alert" className="mt-1.5 text-sm text-red-500">
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
            {t('email')}
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register('email')}
          />
          {errors.email && (
            <p role="alert" className="mt-1.5 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">
            {t('phone')}
          </label>
          <Input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder={t('phonePlaceholder')}
            {...register('phone')}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border accent-[#C8922A]"
            aria-invalid={Boolean(errors.agreement)}
            {...register('agreement')}
          />
          <span className="text-muted-foreground">
            {t.rich('agreement', {
              terms: (chunks) => (
                <Link href="/terms" className="underline hover:text-foreground" target="_blank">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="underline hover:text-foreground" target="_blank">
                  {chunks}
                </Link>
              )
            })}
          </span>
        </label>
        {errors.agreement && (
          <p role="alert" className="mt-1.5 text-sm text-red-500">
            {errors.agreement.message}
          </p>
        )}
      </div>

      {result.status === 'error' && (
        <p role="alert" className="mt-4 text-sm text-red-500">
          {result.code === 'group_full'
            ? t('groupFull')
            : t('errors.generic')}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={isSubmitting}
        className="mt-8 w-full sm:w-auto"
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
