'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useFormState, useFormStatus } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  SavedToast,
  useSavedRedirect
} from '@/components/admin/save-feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveGroup, type GroupFormState } from '@/lib/admin-actions';
import type { Locale, StudyGroup } from '@/lib/types';
import { cn, weekdayName } from '@/lib/utils';

interface Props {
  group: StudyGroup | null;
  /**
   * Labels are resolved on the server. A function cannot cross the client
   * boundary, and shipping the whole bilingual course record just to read
   * one title would be worse.
   */
  courses: { id: string; label: string }[];
}

const field = 'mb-1.5 block text-sm font-medium';
const hint = 'mt-1.5 text-xs leading-relaxed text-muted-foreground';
const select =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm';

function SubmitButton() {
  const t = useTranslations('admin.groupForm');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

/**
 * Create or edit one study group.
 *
 * Two fields are conspicuously absent, and both on purpose. `seats_taken`
 * is derived from paid enrollments by the payment webhook, so typing it in
 * would let the seat count and the ledger disagree. And the id is
 * read-only once it exists: it goes to Allpay in `add_field_1` and into
 * every log line, so changing it would orphan history that has already
 * left this system.
 */
export function GroupForm({ group, courses }: Props) {
  const t = useTranslations('admin.groupForm');
  const tAdmin = useTranslations('admin');
  const tCourses = useTranslations('courses');
  const locale = useLocale() as Locale;
  const [state, formAction] = useFormState<GroupFormState, FormData>(
    adminSaveGroup,
    { status: 'idle' }
  );

  // Confirm, then return to the list — see save-feedback.tsx.
  const savedToast = useSavedRedirect(state.status === 'saved', '/admin/groups');

  const isNew = group === null;

  return (
    <>
      <SavedToast show={savedToast} />
      <form action={formAction} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="id" className={field}>
          ID
        </label>
        <Input
          id="id"
          name="id"
          required
          defaultValue={group?.id ?? ''}
          readOnly={!isNew}
          placeholder="group_111"
          className={cn(!isNew && 'bg-muted text-muted-foreground')}
        />
        <p className={hint}>{t('idHint')}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="courseId" className={field}>
            {tAdmin('table.course')}
          </label>
          <select
            id="courseId"
            name="courseId"
            required
            defaultValue={group?.courseId ?? courses[0]?.id ?? ''}
            className={select}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="slug" className={field}>
            Slug
          </label>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={group?.slug ?? ''}
            placeholder="greece-tue-16-children"
          />
        </div>

        <div>
          <label htmlFor="audience" className={field}>
            {tAdmin('table.group')}
          </label>
          <select
            id="audience"
            name="audience"
            defaultValue={group?.audience ?? 'adults'}
            className={select}
          >
            {(['children', 'teens', 'adults'] as const).map((value) => (
              <option key={value} value={value}>
                {tCourses(`ageGroup.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status" className={field}>
            {tAdmin('table.status')}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={group?.status ?? 'enrolling'}
            className={select}
          >
            {(
              ['enrolling', 'full', 'in_progress', 'completed', 'cancelled'] as const
            ).map((value) => (
              <option key={value} value={value}>
                {tAdmin(`status.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="weekday" className={field}>
            {tAdmin('table.schedule')}
          </label>
          <select
            id="weekday"
            name="weekday"
            defaultValue={String(group?.weekday ?? 2)}
            className={select}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((index) => (
              <option key={index} value={index}>
                {weekdayName(index, locale)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="startTime" className={field}>
            HH:MM
          </label>
          <Input
            id="startTime"
            name="startTime"
            required
            defaultValue={group?.time ?? '19:00'}
            placeholder="19:00"
          />
        </div>

        <div>
          <label htmlFor="startDate" className={field}>
            {tAdmin('table.start')}
          </label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            defaultValue={group?.startDate ?? ''}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              name="startDateConfirmed"
              defaultChecked={group?.startDateConfirmed ?? false}
              className="mt-0.5 h-4 w-4 accent-[#2A4A3A]"
            />
            <span>
              <span className="font-medium">{t('startConfirmed')}</span>
              <span className={hint}>{t('startConfirmedHint')}</span>
            </span>
          </label>
        </div>

        <div>
          <label htmlFor="endDate" className={field}>
            {t('endDate')}
          </label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={group?.endDate ?? ''}
          />
        </div>

        <div>
          <label htmlFor="capacity" className={field}>
            {tAdmin('table.capacity')}
          </label>
          <Input
            id="capacity"
            name="capacity"
            inputMode="numeric"
            required
            defaultValue={String(group?.capacity ?? 7)}
          />
          <p className={hint}>{t('seatsHint')}</p>
        </div>

        <div>
          <label htmlFor="timezone" className={field}>
            {t('timezone')}
          </label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={group?.timezone ?? 'Asia/Jerusalem'}
          />
        </div>
      </div>

      <div className="grid gap-5 border-t border-border pt-6 sm:grid-cols-2">
        <div>
          <label htmlFor="telegramChannelId" className={field}>
            {tAdmin('table.channel')}
          </label>
          <Input
            id="telegramChannelId"
            name="telegramChannelId"
            defaultValue={group?.telegramChannelId ?? ''}
            placeholder="-1001000000101"
          />
        </div>

        <div>
          <label htmlFor="telegramChatType" className={field}>
            {t('chatTypeLabel')}
          </label>
          <select
            id="telegramChatType"
            name="telegramChatType"
            defaultValue={group?.telegramChatType ?? 'channel'}
            className={select}
          >
            {(['channel', 'supergroup'] as const).map((value) => (
              <option key={value} value={value}>
                {t(`chatType.${value}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="inviteMemberLimit" className={field}>
            {t('inviteSeats')}
          </label>
          <Input
            id="inviteMemberLimit"
            name="inviteMemberLimit"
            inputMode="numeric"
            defaultValue={String(group?.inviteMemberLimit ?? 1)}
          />
          <p className={hint}>{t('inviteLimitHint')}</p>
        </div>

        <div>
          <label htmlFor="meetingUrl" className={field}>
            Zoom / Meet
          </label>
          <Input
            id="meetingUrl"
            name="meetingUrl"
            defaultValue={group?.meetingUrl ?? ''}
            placeholder="https://meet.google.com/…"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="paymentUrl" className={field}>
            {tAdmin('table.paymentUrl')}
          </label>
          <Input
            id="paymentUrl"
            name="paymentUrl"
            defaultValue={group?.paymentUrl ?? ''}
            placeholder="https://allpay.to/…"
          />
        </div>
      </div>

      {state.status === 'error' && (
        <p role="alert" className="text-sm text-red-500">
          {state.message}
        </p>
      )}
      {state.status === 'saved' && (
        <p role="status" className="text-sm text-moss">
          {t('saved')} · {state.id}
        </p>
      )}

      <div className="flex items-center gap-3">
        <SubmitButton />
        <Link
          href="/admin/groups"
          className={buttonVariants({ variant: 'outline' })}
        >
          {t('cancel')}
        </Link>
      </div>
    </form>
    </>
  );
}
