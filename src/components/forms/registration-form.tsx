'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitRegistration, type RegistrationState } from '@/lib/actions';
import type { AgeGroup } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

interface Props {
  groupId: string;
  /** Decides whether the participant is asked about separately. */
  audience: AgeGroup;
  /** Number of monthly charges, and the length of the pay-in-full option. */
  durationMonths: number;
  monthlyPrice: number;
  currency: string;
}

export function RegistrationForm({
  groupId,
  audience,
  durationMonths,
  monthlyPrice,
  currency
}: Props) {
  const t = useTranslations('register');
  const locale = useLocale();
  const [result, setResult] = useState<RegistrationState>({ status: 'idle' });
  const [plan, setPlan] = useState<'monthly' | 'full'>('monthly');
  const honeypotRef = useRef<HTMLInputElement>(null);

  // A children's or teens' group means the person filling in the form is
  // not the person attending. Asking for both is the only way the group
  // list ever shows the child's name — and the only way two siblings
  // enrolled from one parent's address stay distinguishable.
  const separateParticipant = audience === 'children' || audience === 'teens';

  const schema = z.object({
    firstName: z.string().trim().min(1, t('errors.firstName')),
    lastName: z.string().trim().min(1, t('errors.lastName')),
    email: z.string().trim().email(t('errors.email')),
    phone: z.string().trim().optional(),
    participantName: separateParticipant
      ? z.string().trim().min(1, t('errors.participantName'))
      : z.string().trim().optional(),
    participantBirthYear: z.string().trim().optional(),
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
    formData.set('plan', plan);
    formData.set('participantName', values.participantName ?? '');
    formData.set('participantBirthYear', values.participantBirthYear ?? '');
    formData.set('website', honeypotRef.current?.value ?? '');

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
      className="relative rounded-card border border-border bg-card p-6 sm:p-8"
    >
      {/* Honeypot: hidden from people and assistive tech, irresistible to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

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

      {separateParticipant && (
        <fieldset className="mt-8 border-t border-border pt-6">
          <legend className="sr-only">{t('participantTitle')}</legend>
          <h3 className="text-sm font-semibold">{t('participantTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('participantNameHint')}
          </p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="participantName"
                className="mb-1.5 block text-sm font-medium"
              >
                {t('participantName')}
              </label>
              <Input
                id="participantName"
                aria-invalid={Boolean(errors.participantName)}
                {...register('participantName')}
              />
              {errors.participantName && (
                <p role="alert" className="mt-1.5 text-sm text-red-500">
                  {errors.participantName.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="participantBirthYear"
                className="mb-1.5 block text-sm font-medium"
              >
                {t('participantBirthYear')}
              </label>
              <Input
                id="participantBirthYear"
                inputMode="numeric"
                placeholder="2014"
                {...register('participantBirthYear')}
              />
            </div>
          </div>
        </fieldset>
      )}

      <fieldset className="mt-8 border-t border-border pt-6">
        <legend className="sr-only">{t('planTitle')}</legend>
        <h3 className="text-sm font-semibold">{t('planTitle')}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(['monthly', 'full'] as const).map((option) => {
            const selected = plan === option;
            const total =
              option === 'full' ? monthlyPrice * durationMonths : monthlyPrice;
            return (
              <label
                key={option}
                className={cn(
                  'cursor-pointer rounded-card border p-4 transition-colors',
                  selected
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                )}
              >
                <span className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="plan"
                    value={option}
                    checked={selected}
                    onChange={() => setPlan(option)}
                    className="h-4 w-4 accent-[#2A4A3A]"
                  />
                  <span className="font-medium">
                    {option === 'monthly' ? t('planMonthly') : t('planFull')}
                  </span>
                </span>
                <span className="mt-2 block font-display text-xl font-semibold">
                  {formatPrice(total, currency, locale as 'ru' | 'en')}
                  {option === 'monthly' && (
                    <span className="ml-1 font-sans text-sm font-normal text-muted-foreground">
                      / {t('priceNote')}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">
                  {option === 'monthly'
                    ? t('planMonthlyNote', { months: durationMonths })
                    : t('planFullNote', { months: durationMonths })}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6">
        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 rounded border-border accent-[#3D6552]"
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
            : result.code === 'rate_limited'
              ? t('errors.rateLimited')
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
