'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { grantAccess, revokeAccess } from './access';
import { checkAdminAccess } from './auth';
import {
  flattenMessages,
  invalidateMessagesCache,
  loadDefaults,
  placeholdersIn,
  placeholdersMatch
} from './content/messages';
import { isDemoMode } from './data';
import { sendInviteEmail } from './email/notify';
import { emit } from './events';
import { getCheckoutProvider } from './payments';
import { getNumericSettings } from './settings';
import { createSupabaseAdminClient } from './supabase/server';
import { revokeChatInviteLink } from './telegram/client';

/**
 * Admin operations.
 *
 * Every one of these routes through the same primitives the automation
 * uses — `grantAccess`, `revokeAccess`, the payment provider — rather than
 * reaching for the Telegram or Allpay APIs directly. That is the brief's
 * "do not create two completely separate systems", enforced by there being
 * only one implementation to call.
 *
 * Two guards on every action, in this order: an authenticated admin, and a
 * real database. Demo mode is read-only on purpose — an admin panel that
 * appears to work while writing nowhere is worse than one that says so.
 */

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; error: string };

async function guard(): Promise<ActionResult | null> {
  const access = await checkAdminAccess();
  if (!access.allowed) return { ok: false, error: 'unauthorized' };
  if (isDemoMode()) return { ok: false, error: 'demo_mode' };
  return null;
}

function refresh() {
  revalidatePath('/[locale]/admin', 'layout');
}

const idSchema = z.string().uuid();

/** Mint access by hand — a payment taken outside Allpay, or a retry. */
export async function adminGrantAccess(
  enrollmentId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  if (!idSchema.safeParse(enrollmentId).success) {
    return { ok: false, error: 'bad_id' };
  }

  const result = await grantAccess(enrollmentId);
  refresh();

  if (result.status === 'invite') {
    return { ok: true, message: result.reused ? 'existing_invite' : 'invited' };
  }
  if (result.status === 'already_joined') {
    return { ok: true, message: 'already_joined' };
  }
  return { ok: false, error: result.reason };
}

/**
 * Replace the invite and email it again.
 *
 * Not the same as granting: the old link is killed first. Otherwise the
 * student ends up holding two live single-use invites, and a forwarded one
 * can be spent by somebody else.
 */
export async function adminResendInvite(
  enrollmentId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  if (!idSchema.safeParse(enrollmentId).success) {
    return { ok: false, error: 'bad_id' };
  }

  const db = createSupabaseAdminClient();
  const { data: live } = await db
    .from('telegram_invites')
    .select('id, invite_link, chat_id')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'active');

  for (const invite of live ?? []) {
    try {
      await revokeChatInviteLink(
        invite.chat_id as string,
        invite.invite_link as string
      );
    } catch {
      // Already gone at Telegram's end; the row still needs closing.
    }
    await db
      .from('telegram_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id);
  }

  await db
    .from('enrollments')
    .update({ telegram_access_status: 'not_granted' })
    .eq('id', enrollmentId)
    .neq('telegram_access_status', 'joined');

  const result = await grantAccess(enrollmentId);
  refresh();

  if (result.status !== 'invite') {
    return {
      ok: false,
      error: result.status === 'already_joined' ? 'already_joined' : result.reason
    };
  }

  const settings = await getNumericSettings();
  await sendInviteEmail(
    enrollmentId,
    result.inviteLink,
    settings.invite_ttl_days
  );
  return { ok: true, message: 'invited' };
}

export async function adminRevokeAccess(
  enrollmentId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;
  if (!idSchema.safeParse(enrollmentId).success) {
    return { ok: false, error: 'bad_id' };
  }

  await revokeAccess(enrollmentId, 'admin_action');
  refresh();
  return { ok: true, message: 'revoked' };
}

/**
 * Stop future charges.
 *
 * Israeli consumer law treats a monthly course as a continuing transaction
 * the customer may end, so this has to exist and has to actually reach the
 * provider — marking a row cancelled while Allpay keeps charging the card
 * is the failure mode worth guarding against. Access is deliberately left
 * alone: someone who cancels in month three has paid for month three.
 */
export async function adminCancelSubscription(
  enrollmentId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const db = createSupabaseAdminClient();
  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, order_id')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment?.order_id) return { ok: false, error: 'no_order_id' };

  const provider = getCheckoutProvider();
  if (!provider) return { ok: false, error: 'provider_not_configured' };

  try {
    await provider.cancelSubscription(enrollment.order_id as string);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'provider_error'
    };
  }

  await db
    .from('enrollments')
    .update({
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: 'admin_cancelled'
    })
    .eq('id', enrollmentId);

  await emit('enrollment.cancelled', enrollmentId, { by: 'admin' });
  refresh();
  return { ok: true, message: 'cancelled' };
}

const refundSchema = z.object({
  enrollmentId: z.string().uuid(),
  amount: z.number().positive().finite().optional()
});

/**
 * Refund through the provider.
 *
 * The enrollment is not touched here: Allpay sends a refund webhook, and
 * letting that single path do the bookkeeping is what keeps a refund taken
 * in the Allpay dashboard and one taken here from producing different
 * outcomes.
 */
export async function adminRefund(
  enrollmentId: string,
  amount?: number
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const parsed = refundSchema.safeParse({ enrollmentId, amount });
  if (!parsed.success) return { ok: false, error: 'bad_input' };

  const db = createSupabaseAdminClient();
  const { data: enrollment } = await db
    .from('enrollments')
    .select('order_id')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment?.order_id) return { ok: false, error: 'no_order_id' };

  const provider = getCheckoutProvider();
  if (!provider) return { ok: false, error: 'provider_not_configured' };

  try {
    await provider.refund(enrollment.order_id as string, amount);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'provider_error'
    };
  }

  refresh();
  return { ok: true, message: 'refund_requested' };
}

/**
 * Move a student to another slot in the same course.
 *
 * Access has to follow them: the old channel invite is revoked and they
 * are removed from it before a new invite is minted, or they keep reading
 * a group they no longer attend.
 */
export async function adminMoveGroup(
  enrollmentId: string,
  targetGroupId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const db = createSupabaseAdminClient();
  const { data: target } = await db
    .from('study_groups')
    .select('id, course_id')
    .eq('id', targetGroupId)
    .maybeSingle();
  if (!target) return { ok: false, error: 'unknown_group' };

  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, course_id, group_id')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment) return { ok: false, error: 'unknown_enrollment' };

  if (enrollment.course_id !== target.course_id) {
    // A different course is a different price and a different subscription;
    // that is a refund and a new registration, not a move.
    return { ok: false, error: 'different_course' };
  }
  if (enrollment.group_id === targetGroupId) {
    return { ok: true, message: 'unchanged' };
  }

  await revokeAccess(enrollmentId, 'moved_group');

  await db
    .from('enrollments')
    .update({
      group_id: targetGroupId,
      telegram_access_status: 'not_granted',
      telegram_user_id: null
    })
    .eq('id', enrollmentId);

  const result = await grantAccess(enrollmentId);
  refresh();

  return result.status === 'invite'
    ? { ok: true, message: 'moved' }
    : { ok: false, error: 'moved_but_no_invite' };
}

const manualPaymentSchema = z.object({
  enrollmentId: z.string().uuid(),
  amount: z.number().positive().finite(),
  currency: z.string().trim().length(3),
  reference: z.string().trim().min(1).max(120)
});

/**
 * Record a payment taken outside Allpay — Bit, cash, a bank transfer.
 *
 * Goes into the same ledger with `provider: 'manual'`, and then grants
 * access through the same call the webhook uses. The reference is what
 * makes it idempotent and what an accountant can trace.
 */
export async function adminRecordManualPayment(input: {
  enrollmentId: string;
  amount: number;
  currency: string;
  reference: string;
}): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const parsed = manualPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'bad_input' };
  const { enrollmentId, amount, currency, reference } = parsed.data;

  const db = createSupabaseAdminClient();
  const { error } = await db.from('payments').insert({
    enrollment_id: enrollmentId,
    provider: 'manual',
    amount,
    currency: currency.toUpperCase(),
    status: 'succeeded',
    external_id: `manual:${reference}`,
    period_index: null
  });

  if (error && error.code !== '23505') {
    return { ok: false, error: error.message };
  }

  await db
    .from('enrollments')
    .update({ status: 'active', grace_until: null, pending_expires_at: null })
    .eq('id', enrollmentId);

  await emit('payment.succeeded', enrollmentId, {
    provider: 'manual',
    amount,
    currency,
    reference
  });

  const result = await grantAccess(enrollmentId);
  refresh();

  return result.status === 'unavailable'
    ? { ok: false, error: `payment_recorded_but_${result.reason}` }
    : { ok: true, message: 'recorded' };
}

/** Attach an unmatched payment to the enrollment it belongs to. */
export async function adminResolveOrphan(
  orphanId: string,
  enrollmentId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const db = createSupabaseAdminClient();
  const { data: orphan } = await db
    .from('orphan_payments')
    .select('id, amount, currency, order_id, payload')
    .eq('id', orphanId)
    .is('resolved_at', null)
    .maybeSingle();
  if (!orphan) return { ok: false, error: 'unknown_orphan' };

  const { error } = await db.from('payments').insert({
    enrollment_id: enrollmentId,
    provider: 'allpay',
    amount: orphan.amount ?? 0,
    currency: orphan.currency ?? 'ILS',
    status: 'succeeded',
    external_id: `orphan:${orphan.id}`,
    raw: orphan.payload
  });
  if (error && error.code !== '23505') {
    return { ok: false, error: error.message };
  }

  await db
    .from('orphan_payments')
    .update({
      resolved_enrollment_id: enrollmentId,
      resolved_at: new Date().toISOString()
    })
    .eq('id', orphanId);

  await db
    .from('enrollments')
    .update({ status: 'active' })
    .eq('id', enrollmentId);

  await grantAccess(enrollmentId);
  refresh();
  return { ok: true, message: 'resolved' };
}

/* ── Study groups ──────────────────────────────────────────────────── */

const groupSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^group_[a-z0-9_]+$/, 'id must look like group_101'),
  courseId: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'slug is lowercase letters, digits and dashes'),
  audience: z.enum(['children', 'teens', 'adults']),
  weekday: z.coerce.number().int().min(0).max(6),
  startTime: z.string().trim().regex(/^\d{2}:\d{2}$/),
  timezone: z.string().trim().min(1),
  startDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal('')),
  capacity: z.coerce.number().int().min(1).max(200),
  status: z.enum(['enrolling', 'full', 'in_progress', 'completed', 'cancelled']),
  telegramChannelId: z.string().trim().max(64).optional().or(z.literal('')),
  telegramChatType: z.enum(['channel', 'supergroup']),
  inviteMemberLimit: z.coerce.number().int().min(1).max(5),
  meetingUrl: z.string().trim().url().optional().or(z.literal('')),
  paymentUrl: z.string().trim().url().optional().or(z.literal(''))
});

export type GroupFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved'; id: string };

/**
 * Create or update a study group.
 *
 * The id is write-once. It is the immutable handle the brief insists on —
 * it travels to Allpay in `add_field_1`, it appears in Telegram invite
 * names and in every automation log, so changing it would orphan history
 * that has already left this system.
 */
export async function adminSaveGroup(
  _prev: GroupFormState,
  formData: FormData
): Promise<GroupFormState> {
  const access = await checkAdminAccess();
  if (!access.allowed) return { status: 'error', message: 'unauthorized' };
  if (isDemoMode()) return { status: 'error', message: 'demo_mode' };

  const parsed = groupSchema.safeParse({
    id: formData.get('id'),
    courseId: formData.get('courseId'),
    slug: formData.get('slug'),
    audience: formData.get('audience'),
    weekday: formData.get('weekday'),
    startTime: formData.get('startTime'),
    timezone: formData.get('timezone') || 'Asia/Jerusalem',
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate') ?? '',
    capacity: formData.get('capacity'),
    status: formData.get('status'),
    telegramChannelId: formData.get('telegramChannelId') ?? '',
    telegramChatType: formData.get('telegramChatType') || 'channel',
    inviteMemberLimit: formData.get('inviteMemberLimit') || 1,
    meetingUrl: formData.get('meetingUrl') ?? '',
    paymentUrl: formData.get('paymentUrl') ?? ''
  });

  if (!parsed.success) {
    return {
      status: 'error',
      message: parsed.error.issues[0]?.message ?? 'validation'
    };
  }

  const group = parsed.data;
  const db = createSupabaseAdminClient();

  const row = {
    id: group.id,
    course_id: group.courseId,
    slug: group.slug,
    audience: group.audience,
    weekday: group.weekday,
    start_time: group.startTime,
    timezone: group.timezone,
    start_date: group.startDate,
    end_date: group.endDate || null,
    capacity: group.capacity,
    status: group.status,
    telegram_channel_id: group.telegramChannelId || null,
    telegram_chat_type: group.telegramChatType,
    invite_member_limit: group.inviteMemberLimit,
    meeting_url: group.meetingUrl || null,
    payment_url: group.paymentUrl || null
  };

  // `seats_taken` is deliberately absent: it is derived from paid
  // enrollments by the payment webhook, and letting it be typed in by hand
  // would let the seat count and the ledger disagree.
  const { error } = await db
    .from('study_groups')
    .upsert(row, { onConflict: 'id' });

  if (error) return { status: 'error', message: error.message };

  refresh();
  return { status: 'saved', id: group.id };
}

/** Archive rather than delete: enrollments and payments reference it. */
export async function adminArchiveGroup(
  groupId: string
): Promise<ActionResult> {
  const blocked = await guard();
  if (blocked) return blocked;

  const db = createSupabaseAdminClient();
  const { error } = await db
    .from('study_groups')
    .update({ status: 'cancelled' })
    .eq('id', groupId);

  if (error) return { ok: false, error: error.message };
  refresh();
  return { ok: true, message: 'archived' };
}

/* ── Site copy ─────────────────────────────────────────────────────── */

export type ContentFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved'; changed: number; reset: number; problems: string[] };

/**
 * Save edited site copy.
 *
 * Three rules, each of which exists because of a specific way this can go
 * wrong when a person edits 361 strings by hand:
 *
 *  * A value identical to the shipped default, or emptied, deletes the
 *    override rather than storing it. That makes "reset to the original"
 *    the same gesture as clearing the box, and keeps the table to what has
 *    genuinely been changed.
 *
 *  * Placeholders must survive. `t('months', {count})` throws if the text
 *    loses `{count}`, and a rich string that loses `<terms>` throws too —
 *    both take down the page they are on. Such an edit is refused and
 *    named, and the rest of the form still saves.
 *
 *  * A key that is not in the shipped catalogue is ignored. Only the code
 *    decides which strings exist.
 */
export async function adminSaveMessages(
  _prev: ContentFormState,
  formData: FormData
): Promise<ContentFormState> {
  const access = await checkAdminAccess();
  if (!access.allowed) return { status: 'error', message: 'unauthorized' };
  if (isDemoMode()) return { status: 'error', message: 'demo_mode' };

  const [defaultsRu, defaultsEn] = await Promise.all([
    loadDefaults('ru'),
    loadDefaults('en')
  ]);
  const shipped: Record<string, Record<string, string>> = {
    ru: flattenMessages(defaultsRu),
    en: flattenMessages(defaultsEn)
  };

  const db = createSupabaseAdminClient();
  const editor = 'email' in access ? (access.email ?? null) : null;

  const upserts: {
    key: string;
    locale: string;
    value: string;
    updated_by: string | null;
  }[] = [];
  const removals: { key: string; locale: string }[] = [];
  const problems: string[] = [];

  formData.forEach((raw, field) => {
    const match = /^value:(ru|en):(.+)$/.exec(field);
    if (!match || typeof raw !== 'string') return;

    const locale = match[1] as 'ru' | 'en';
    const key = match[2]!;
    const original = shipped[locale]?.[key];
    if (original === undefined) return;

    const value = raw.trim();

    if (value === '' || value === original.trim()) {
      removals.push({ key, locale });
      return;
    }

    if (!placeholdersMatch(original, value)) {
      problems.push(`${locale} · ${key}: ${placeholdersIn(original).join(' ')}`);
      return;
    }

    upserts.push({ key, locale, value, updated_by: editor });
  });

  if (upserts.length > 0) {
    const { error } = await db
      .from('ui_messages')
      .upsert(upserts, { onConflict: 'key,locale' });
    if (error) return { status: 'error', message: error.message };
  }

  for (const row of removals) {
    await db
      .from('ui_messages')
      .delete()
      .eq('key', row.key)
      .eq('locale', row.locale);
  }

  invalidateMessagesCache();
  // Copy appears on every page, so the whole site is stale, not one route.
  revalidatePath('/', 'layout');

  return {
    status: 'saved',
    changed: upserts.length,
    reset: removals.length,
    problems
  };
}

/* ── Course content ────────────────────────────────────────────────── */

const localizedString = z.object({
  ru: z.string().trim().max(8000),
  en: z.string().trim().max(8000)
});

const localizedList = z.object({
  ru: z.array(z.string().trim().min(1).max(1000)).max(40),
  en: z.array(z.string().trim().min(1).max(1000)).max(40)
});

const courseSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^course_[a-z0-9_]+$/, 'id must look like course_007'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'slug is lowercase letters, digits and dashes'),
  teacherId: z.string().trim().min(1),
  category: z.enum(['history', 'philosophy', 'literature', 'anthropology']),
  difficulty: z.enum(['intro', 'intermediate', 'deep_dive']),
  ageGroups: z.array(z.enum(['children', 'teens', 'adults'])).min(1),
  durationMonths: z.number().int().min(1).max(24),
  monthlyPrice: z.number().nonnegative().finite(),
  currency: z.enum(['ILS', 'USD', 'EUR']),
  imageUrl: z.string().trim().url().nullable(),
  publicTelegramUrl: z.string().trim().url().nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean(),
  title: localizedString,
  shortDescription: localizedString,
  description: localizedString,
  outcomes: localizedList,
  audience: localizedList,
  curriculum: z
    .array(z.object({ title: localizedString, topics: localizedList }))
    .max(24),
  faq: z
    .array(z.object({ question: localizedString, answer: localizedString }))
    .max(40)
});

export type CourseFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved'; id: string };

/**
 * Create or update a course, both languages at once.
 *
 * The payload arrives as one JSON blob rather than a hundred form fields
 * because the shape is genuinely nested — modules containing topic lists,
 * FAQ pairs — and flattening that into `curriculum[0].topics.ru[2]` names
 * would move the complexity into string parsing without removing any.
 *
 * Translatable text goes to `course_translations`, one row per locale, so
 * adding Hebrew later stays an INSERT rather than an ALTER. Everything
 * non-translatable — price, schedule shape, status — stays on `courses`.
 */
export async function adminSaveCourse(
  _prev: CourseFormState,
  formData: FormData
): Promise<CourseFormState> {
  const access = await checkAdminAccess();
  if (!access.allowed) return { status: 'error', message: 'unauthorized' };
  if (isDemoMode()) return { status: 'error', message: 'demo_mode' };

  const raw = formData.get('payload');
  if (typeof raw !== 'string') return { status: 'error', message: 'no_payload' };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'bad_json' };
  }

  const parsed = courseSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'validation'
    };
  }

  const course = parsed.data;
  const db = createSupabaseAdminClient();

  const { error: courseError } = await db.from('courses').upsert(
    {
      id: course.id,
      slug: course.slug,
      teacher_id: course.teacherId,
      category: course.category,
      difficulty: course.difficulty,
      age_groups: course.ageGroups,
      duration_months: course.durationMonths,
      monthly_price: course.monthlyPrice,
      currency: course.currency,
      image_url: course.imageUrl,
      public_telegram_url: course.publicTelegramUrl,
      status: course.status,
      featured: course.featured,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'id' }
  );
  if (courseError) return { status: 'error', message: courseError.message };

  const translations = (['ru', 'en'] as const).map((locale) => ({
    course_id: course.id,
    locale,
    title: course.title[locale],
    short_description: course.shortDescription[locale],
    description: course.description[locale],
    outcomes: course.outcomes[locale],
    audience: course.audience[locale],
    curriculum: course.curriculum.map((module) => ({
      title: module.title[locale],
      items: module.topics[locale]
    })),
    faq: course.faq.map((item) => ({
      question: item.question[locale],
      answer: item.answer[locale]
    }))
  }));

  const { error: translationError } = await db
    .from('course_translations')
    .upsert(translations, { onConflict: 'course_id,locale' });
  if (translationError) {
    return { status: 'error', message: translationError.message };
  }

  // Course copy appears on the home page, the catalogue and its own page.
  revalidatePath('/', 'layout');
  return { status: 'saved', id: course.id };
}

/* ── Teachers ──────────────────────────────────────────────────────── */

const teacherSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^teacher_[a-z0-9_]+$/, 'id must look like teacher_002'),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'slug is lowercase letters, digits and dashes'),
  photoUrl: z.string().trim().url().nullable(),
  name: localizedString,
  title: localizedString,
  bio: localizedString,
  highlights: localizedList
});

export type TeacherFormState =
  | { status: 'idle' }
  | { status: 'error'; message: string }
  | { status: 'saved'; id: string };

/**
 * Create or update a teacher, both languages at once.
 *
 * Same shape as the course editor and for the same reasons: the payload
 * arrives as one JSON blob because the content is nested, and translatable
 * text lands in per-locale rows so a third language stays an INSERT.
 *
 * The id is write-once — courses reference it — while the slug is free to
 * change, since nothing resolves a teacher by slug today.
 */
export async function adminSaveTeacher(
  _prev: TeacherFormState,
  formData: FormData
): Promise<TeacherFormState> {
  const access = await checkAdminAccess();
  if (!access.allowed) return { status: 'error', message: 'unauthorized' };
  if (isDemoMode()) return { status: 'error', message: 'demo_mode' };

  const raw = formData.get('payload');
  if (typeof raw !== 'string') return { status: 'error', message: 'no_payload' };

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return { status: 'error', message: 'bad_json' };
  }

  const parsed = teacherSchema.safeParse(parsedJson);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      status: 'error',
      message: issue ? `${issue.path.join('.')}: ${issue.message}` : 'validation'
    };
  }

  const teacher = parsed.data;
  const db = createSupabaseAdminClient();

  const { error: teacherError } = await db.from('teachers').upsert(
    { id: teacher.id, slug: teacher.slug, photo_url: teacher.photoUrl },
    { onConflict: 'id' }
  );
  if (teacherError) return { status: 'error', message: teacherError.message };

  const translations = (['ru', 'en'] as const).map((locale) => ({
    teacher_id: teacher.id,
    locale,
    name: teacher.name[locale],
    title: teacher.title[locale],
    bio: teacher.bio[locale],
    highlights: teacher.highlights[locale]
  }));

  const { error: translationError } = await db
    .from('teacher_translations')
    .upsert(translations, { onConflict: 'teacher_id,locale' });
  if (translationError) {
    return { status: 'error', message: translationError.message };
  }

  // A teacher's name appears on the About page and on every course card.
  revalidatePath('/', 'layout');
  return { status: 'saved', id: teacher.id };
}
