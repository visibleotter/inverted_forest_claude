'use client';

import { useTranslations } from 'next-intl';
import { useFormState, useFormStatus } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  SavedToast,
  useSavedRedirect
} from '@/components/admin/save-feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveStudent, type StudentFormState } from '@/lib/admin-actions';
import type { Student } from '@/lib/types';

const field = 'mb-1.5 block text-sm font-medium';
const hint = 'mt-1.5 text-xs leading-relaxed text-muted-foreground';
const box =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm leading-relaxed';

function SubmitButton() {
  const t = useTranslations('admin.studentForm');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

/**
 * A student's contact details.
 *
 * Plain form fields rather than a JSON payload — unlike courses and
 * teachers, there is nothing nested here, and named fields are the simpler
 * thing when the shape is flat.
 *
 * The email is the field that matters. It is where the Telegram invite is
 * sent and how the bot's `/grant` finds a person, so a typo made at
 * registration is worth fixing here — but fixing it does not resend
 * anything. That is a separate decision with its own button on the
 * enrollment.
 */
export function StudentForm({ student }: { student: Student }) {
  const t = useTranslations('admin.studentForm');
  const [state, formAction] = useFormState<StudentFormState, FormData>(
    adminSaveStudent,
    { status: 'idle' }
  );

  // Confirm, then return to the list — see save-feedback.tsx.
  const savedToast = useSavedRedirect(state.status === 'saved', '/admin/students');

  return (
    <>
      <SavedToast show={savedToast} />
      <form action={formAction} className="max-w-2xl space-y-6">
      <input type="hidden" name="id" value={student.id} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="firstName" className={field}>
            {t('firstName')}
          </label>
          <Input
            id="firstName"
            name="firstName"
            required
            defaultValue={student.firstName}
          />
        </div>

        <div>
          <label htmlFor="lastName" className={field}>
            {t('lastName')}
          </label>
          <Input
            id="lastName"
            name="lastName"
            required
            defaultValue={student.lastName}
          />
        </div>

        <div>
          <label htmlFor="email" className={field}>
            {t('email')}
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={student.email}
          />
          <p className={hint}>{t('emailHint')}</p>
        </div>

        <div>
          <label htmlFor="phone" className={field}>
            {t('phone')}
          </label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={student.phone ?? ''}
            placeholder="+972 …"
          />
        </div>

        <div>
          <label htmlFor="locale" className={field}>
            {t('locale')}
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue={student.locale}
            className={box}
          >
            <option value="ru">{t('localeRu')}</option>
            <option value="en">{t('localeEn')}</option>
          </select>
          <p className={hint}>{t('localeHint')}</p>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={field}>
          {t('notes')}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className={box}
          defaultValue={student.notes ?? ''}
        />
        <p className={hint}>{t('notesHint')}</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-6">
        <SubmitButton />
        <Link
          href="/admin/students"
          className={buttonVariants({ variant: 'outline' })}
        >
          {t('cancel')}
        </Link>
        {state.status === 'error' && (
          <p role="alert" className="text-sm text-red-500">
            {state.message === 'demo_mode'
              ? t('demoMode')
              : state.message === 'email_taken'
                ? t('emailTaken')
                : state.message}
          </p>
        )}
        {state.status === 'saved' && (
          <p role="status" className="text-sm text-moss">
            {t('saved')}
          </p>
        )}
      </div>
    </form>
    </>
  );
}
