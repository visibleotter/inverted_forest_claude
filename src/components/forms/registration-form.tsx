'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from '@/i18n/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { submitRegistration, type RegistrationState } from '@/lib/actions';
import { siteConfig } from '@/lib/config';
import { normalizeTelegramContact } from '@/lib/telegram-contact';
import type { AgeGroup } from '@/lib/types';

interface Props {
  groupId: string;
  /** Decides whether the participant is asked about separately. */
  audience: AgeGroup;
  /** Set when Allpay sent the payer back without a payment. */
  paymentCancelled?: boolean;
}

/**
 * What the form remembers between visits, in this browser only.
 *
 * Someone who goes to the payment page and comes back — because the card
 * was declined, because they closed the window, because they pressed Back —
 * should not type their details again. The draft is kept for a week and
 * never leaves the device; the consent tick is deliberately not part of
 * it, since consent is given for one submission, not remembered.
 *
 * Storage can be unavailable (private windows, Telegram's in-app browser
 * clearing data, blocked site data), so every access is guarded and the
 * form simply starts empty when it fails.
 */
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DRAFT_FIELDS = [
  'firstName',
  'lastName',
  'email',
  'telegramContact',
  'participantName',
  'participantBirthYear'
] as const;

type Draft = Partial<Record<(typeof DRAFT_FIELDS)[number], string>>;

function draftKey(groupId: string) {
  return `register-draft:${groupId}`;
}

function readDraft(groupId: string): Draft | null {
  try {
    const raw = window.localStorage.getItem(draftKey(groupId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { savedAt: number; values: Draft };
    if (Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(draftKey(groupId));
      return null;
    }
    return parsed.values;
  } catch {
    return null;
  }
}

function writeDraft(groupId: string, values: Draft) {
  try {
    window.localStorage.setItem(
      draftKey(groupId),
      JSON.stringify({ savedAt: Date.now(), values })
    );
  } catch {
    // Nothing to do: the form works without memory.
  }
}

export function RegistrationForm({ groupId, audience, paymentCancelled }: Props) {
  const t = useTranslations('register');
  const locale = useLocale();
  const [result, setResult] = useState<RegistrationState>({ status: 'idle' });
  const [restored, setRestored] = useState(false);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // A teens' group means the person filling in the form is not the person
  // attending. Asking for both is the only way the group list ever shows
  // the student's name — and the only way two siblings enrolled from one
  // parent's address stay distinguishable.
  const separateParticipant = audience === 'children' || audience === 'teens';

  const schema = z.object({
    firstName: z.string().trim().min(1, t('errors.firstName')),
    lastName: z.string().trim().min(1, t('errors.lastName')),
    email: z.string().trim().email(t('errors.email')),
    telegramContact: z
      .string()
      .refine(
        (value) => normalizeTelegramContact(value) !== null,
        t('errors.telegramContact')
      ),
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
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Restore once, after mount: storage does not exist on the server.
  useEffect(() => {
    const draft = readDraft(groupId);
    if (draft && Object.values(draft).some(Boolean)) {
      reset(draft as Partial<FormValues>);
      setRestored(true);
    }
  }, [groupId, reset]);

  // Save as the person types.
  useEffect(() => {
    const subscription = watch((values) => {
      const draft: Draft = {};
      for (const field of DRAFT_FIELDS) {
        const value = values[field];
        if (typeof value === 'string' && value) draft[field] = value;
      }
      writeDraft(groupId, draft);
    });
    return () => subscription.unsubscribe();
  }, [groupId, watch]);

  async function onSubmit(values: FormValues) {
    const formData = new FormData();
    formData.set('groupId', groupId);
    formData.set('firstName', values.firstName);
    formData.set('lastName', values.lastName);
    formData.set('email', values.email);
    formData.set('telegramContact', values.telegramContact);
    formData.set('agreement', values.agreement ? 'on' : '');
    formData.set('locale', locale);
    // One plan until Allpay is connected directly: with a hand-made link
    // per group there is only one way to pay, so offering a choice would
    // be offering nothing.
    formData.set('plan', 'monthly');
    formData.set('participantName', values.participantName ?? '');
    formData.set('participantBirthYear', values.participantBirthYear ?? '');
    formData.set('website', honeypotRef.current?.value ?? '');

    const state = await submitRegistration({ status: 'idle' }, formData);
    setResult(state);

    // Straight on to payment. The draft stays: if the payment fails, the
    // person comes back to a filled-in form.
    if (state.status === 'success' && state.paymentUrl) {
      window.location.assign(state.paymentUrl);
    }
  }

  if (result.status === 'success') {
    return (
      <div className="border border-border bg-card p-6 sm:p-8" role="status">
        <h2 className="text-[26px] leading-tight">
          {result.paymentUrl ? t('redirecting') : t('successNoPaymentTitle')}
        </h2>
        {result.paymentUrl ? (
          <>
            <p className="text-body mt-3 text-muted-foreground">
              {t('successManual')}
            </p>
            {/* Shown at once rather than after a pause: if the redirect is
                blocked, the way forward is already on screen. */}
            <a href={result.paymentUrl} className={buttonVariants({ className: 'mt-6' })}>
              {t('goToPayment')}
            </a>
          </>
        ) : (
          <>
            <p className="text-body mt-3 text-muted-foreground">
              {t('successNoPaymentText')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
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
          </>
        )}
      </div>
    );
  }

  const label = 'mb-2 block text-[15px] font-medium';
  const hint = 'mt-2 text-sm text-muted-foreground';
  const error = 'mt-2 text-sm text-destructive';

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="relative">
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

      {(paymentCancelled || restored) && (
        <p
          role="status"
          className="mb-8 border-l-2 border-fern bg-card px-4 py-3 text-[15px]"
        >
          {paymentCancelled ? t('cancelledNotice') : t('draftNotice')}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={label}>
            {t('firstName')}
          </label>
          <Input
            id="firstName"
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? 'firstName-error' : undefined}
            {...register('firstName')}
          />
          {errors.firstName && (
            <p id="firstName-error" role="alert" className={error}>
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className={label}>
            {t('lastName')}
          </label>
          <Input
            id="lastName"
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? 'lastName-error' : undefined}
            {...register('lastName')}
          />
          {errors.lastName && (
            <p id="lastName-error" role="alert" className={error}>
              {errors.lastName.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className={label}>
            {t('email')}
          </label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            {...register('email')}
          />
          {errors.email && (
            <p id="email-error" role="alert" className={error}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="telegramContact" className={label}>
            {t('telegramContact')}
          </label>
          <Input
            id="telegramContact"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={t('telegramContactPlaceholder')}
            aria-invalid={Boolean(errors.telegramContact)}
            aria-describedby="telegramContact-hint"
            {...register('telegramContact')}
          />
          <p id="telegramContact-hint" className={hint}>
            {t('telegramContactHint')}
          </p>
          {errors.telegramContact && (
            <p role="alert" className={error}>
              {errors.telegramContact.message}
            </p>
          )}
        </div>
      </div>

      {separateParticipant && (
        <fieldset className="mt-10 border-t border-border pt-8">
          <legend className="sr-only">{t('participantTitle')}</legend>
          <h3 className="text-[21px]">{t('participantTitle')}</h3>
          <p className={hint}>{t('participantNameHint')}</p>
          <div className="mt-6 grid gap-6 sm:grid-cols-[1fr_160px]">
            <div>
              <label htmlFor="participantName" className={label}>
                {t('participantName')}
              </label>
              <Input
                id="participantName"
                aria-invalid={Boolean(errors.participantName)}
                aria-describedby={errors.participantName ? 'participantName-error' : undefined}
                {...register('participantName')}
              />
              {errors.participantName && (
                <p id="participantName-error" role="alert" className={error}>
                  {errors.participantName.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="participantBirthYear" className={label}>
                {t('participantBirthYear')}
              </label>
              <Input
                id="participantBirthYear"
                inputMode="numeric"
                autoComplete="off"
                {...register('participantBirthYear')}
              />
            </div>
          </div>
        </fieldset>
      )}

      <div className="mt-10 border-t border-border pt-8">
        <label className="grid grid-cols-[20px_1fr] items-start gap-3 text-[15px] leading-relaxed">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-[#2A4A3A]"
            aria-invalid={Boolean(errors.agreement)}
            aria-describedby={errors.agreement ? 'agreement-error' : undefined}
            {...register('agreement')}
          />
          <span>
            {t.rich('agreement', {
              terms: (chunks) => (
                <Link href="/terms" className="text-accent underline underline-offset-4" target="_blank">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="text-accent underline underline-offset-4" target="_blank">
                  {chunks}
                </Link>
              )
            })}
          </span>
        </label>
        {errors.agreement && (
          <p id="agreement-error" role="alert" className={`${error} pl-8`}>
            {errors.agreement.message}
          </p>
        )}
        <p className="mt-3 pl-8 text-sm leading-relaxed text-muted-foreground">
          {t.rich('refundNote', {
            terms: (chunks) => (
              <Link href="/terms" className="underline underline-offset-4" target="_blank">
                {chunks}
              </Link>
            )
          })}
        </p>
      </div>

      {result.status === 'error' && (
        <p role="alert" className="mt-6 text-[15px] text-destructive">
          {result.code === 'group_full'
            ? t('groupFull')
            : result.code === 'rate_limited'
              ? t('errors.rateLimited')
              : t('errors.generic')}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} className="mt-8 w-full sm:w-auto">
        {isSubmitting ? t('submitting') : t('submit')}
      </Button>
    </form>
  );
}
