import { createSupabaseAdminClient } from '../supabase/server';
import type { Locale } from '../types';
import { weekdayName } from '../utils';
import { sendEmail } from './send';
import { inviteEmail, pastDueEmail } from './templates';

/**
 * Addressed emails: the place where an enrollment id becomes a person.
 *
 * Every message here is best-effort. The invite is already on the screen
 * the payer was returned to, and the past-due notice is followed by a
 * grace period — neither is worth failing a webhook or a cron sweep over.
 */

interface Recipient {
  email: string;
  firstName: string;
  locale: Locale;
  courseTitle: string;
  scheduleLine: string;
}

async function loadRecipient(enrollmentId: string): Promise<Recipient | null> {
  const db = createSupabaseAdminClient();

  const { data } = await db
    .from('enrollments')
    .select(
      'students(first_name, email, locale), study_groups(weekday, start_time), courses(course_translations(locale, title))'
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const student = row?.students;
  if (!student?.email) return null;

  const locale: Locale = student.locale === 'en' ? 'en' : 'ru';
  const translations: { locale: string; title: string }[] =
    row?.courses?.course_translations ?? [];
  const group = row?.study_groups;

  return {
    email: student.email,
    // Addressed to whoever pays — for a children's group that is the
    // parent, so the child's name belongs in the body, not the greeting.
    firstName: student.first_name,
    locale,
    courseTitle:
      translations.find((t) => t.locale === locale)?.title ??
      translations[0]?.title ??
      '',
    scheduleLine: group
      ? `${weekdayName(group.weekday, locale)} · ${group.start_time}`
      : ''
  };
}

export async function sendInviteEmail(
  enrollmentId: string,
  inviteLink: string,
  ttlDays: number
): Promise<boolean> {
  try {
    const to = await loadRecipient(enrollmentId);
    if (!to) return false;

    const message = inviteEmail({
      locale: to.locale,
      name: to.firstName,
      courseTitle: to.courseTitle,
      scheduleLine: to.scheduleLine,
      inviteLink,
      expiresInDays: ttlDays
    });

    return await sendEmail({
      ...message,
      to: to.email,
      // One email per invite link, however many times this runs — Allpay
      // alone will walk this path up to ten times.
      idempotencyKey: `invite:${enrollmentId}:${inviteLink.slice(-16)}`
    });
  } catch (error) {
    console.error(`[email] invite failed for ${enrollmentId}`, error);
    return false;
  }
}

export async function sendPastDueEmail(
  enrollmentId: string,
  graceDays: number,
  payUrl: string | null
): Promise<boolean> {
  try {
    const to = await loadRecipient(enrollmentId);
    if (!to) return false;

    const message = pastDueEmail({
      locale: to.locale,
      name: to.firstName,
      courseTitle: to.courseTitle,
      graceDays,
      payUrl
    });

    return await sendEmail({
      ...message,
      to: to.email,
      // The hourly sweep re-examines the same enrollment until the grace
      // period ends; the key keeps that from becoming a daily nag.
      idempotencyKey: `past-due:${enrollmentId}:${new Date()
        .toISOString()
        .slice(0, 10)}`
    });
  } catch (error) {
    console.error(`[email] past-due failed for ${enrollmentId}`, error);
    return false;
  }
}
