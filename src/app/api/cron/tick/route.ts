import { NextRequest, NextResponse } from 'next/server';
import { grantAccess, revokeAccess } from '@/lib/access';
import { isDemoMode } from '@/lib/data';
import { sendPastDueEmail } from '@/lib/email/notify';
import { emit, redeliverPending } from '@/lib/events';
import { getCheckoutProvider } from '@/lib/payments';
import { secretsMatch } from '@/lib/security';
import { getNumericSettings } from '@/lib/settings';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { alertAdmins } from '@/lib/telegram/client';

/**
 * The hourly sweep.
 *
 * Everything the system has to notice *without* being told lives here, in
 * one endpoint behind one cron entry. The most important of those is the
 * missed payment: Allpay documents webhooks for successful payments and
 * refunds only, so a failed monthly charge announces itself to nobody. The
 * grace period, and therefore the whole "student stops paying" path, is
 * built on polling `subscriptionstatus` rather than on an event that does
 * not exist.
 *
 * It is also the second net under the webhook. If Telegram was down when
 * someone paid, the payment is in the ledger and the grant is missing;
 * `retryFailedGrants` closes that on the next pass without anyone noticing.
 *
 * Every task is written to be safe to run again, and each is isolated so
 * that one failing does not stop the rest.
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const today = () => new Date().toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
  const header = request.headers.get('authorization') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header;

  if (!secretsMatch(provided, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, skipped: 'demo mode' });
  }

  const settings = await getNumericSettings();
  const results: Record<string, number | string> = {};

  for (const [name, task] of [
    ['expiredPending', () => expirePending()],
    ['expiredInvites', () => expireInvites()],
    ['missedCharges', () => pollSubscriptions(settings.grace_period_days)],
    ['graceElapsed', () => enforceGrace()],
    ['completed', () => completeFinished()],
    ['retriedGrants', () => retryFailedGrants()],
    ['redelivered', () => redeliverPending()]
  ] as const) {
    try {
      results[name] = await task();
    } catch (error) {
      results[name] = `error: ${
        error instanceof Error ? error.message : 'unknown'
      }`;
      console.error(`[cron] ${name} failed`, error);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}

/**
 * Registrations that never got paid for.
 *
 * Cancelling them keeps the students list honest and frees the uniqueness
 * constraint. A late payment is still safe: the webhook resolves an
 * enrollment by its order id, not by its status, and reactivates it.
 */
async function expirePending(): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('enrollments')
    .update({ status: 'cancelled', cancel_reason: 'abandoned_checkout' })
    .eq('status', 'pending_payment')
    .lt('pending_expires_at', new Date().toISOString())
    .select('id');
  return data?.length ?? 0;
}

/** An invite that was never used stops being a way in. */
async function expireInvites(): Promise<number> {
  const db = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data } = await db
    .from('telegram_invites')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', now)
    .select('enrollment_id');

  for (const row of data ?? []) {
    await db
      .from('enrollments')
      .update({ telegram_access_status: 'expired' })
      .eq('id', row.enrollment_id)
      .eq('telegram_access_status', 'invite_created');
  }
  return data?.length ?? 0;
}

/**
 * The charge that never arrived.
 *
 * An active monthly enrollment whose coverage has run out either got a new
 * charge — in which case the webhook already moved `paid_through` — or it
 * did not. Asking Allpay directly is the only way to tell the difference,
 * because a failure is silent.
 */
async function pollSubscriptions(graceDays: number): Promise<number> {
  const provider = getCheckoutProvider();
  if (!provider) return 0;

  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('enrollments')
    .select('id, order_id, paid_through, plan')
    .eq('status', 'active')
    .eq('plan', 'monthly')
    .lt('paid_through', today())
    .limit(100);

  let flagged = 0;

  for (const enrollment of data ?? []) {
    if (!enrollment.order_id) continue;

    let state = 'unknown';
    try {
      const subscription = await provider.getSubscriptionStatus(
        enrollment.order_id as string
      );
      state = subscription.state;
    } catch (error) {
      // A provider we cannot reach is not a student who has not paid.
      // Leave the enrollment alone and try again next hour.
      console.warn(`[cron] subscriptionstatus failed for ${enrollment.id}`, error);
      continue;
    }

    if (state === 'completed') {
      // The course was paid to its end; completion is handled separately
      // once the group's own end date passes.
      continue;
    }

    const graceUntil = new Date(
      new Date(`${enrollment.paid_through}T00:00:00Z`).getTime() +
        graceDays * 24 * 60 * 60 * 1000
    ).toISOString();

    await db
      .from('enrollments')
      .update({
        status: 'past_due',
        subscription_status: state === 'cancelled' ? 'cancelled' : 'error',
        grace_until: graceUntil
      })
      .eq('id', enrollment.id)
      .eq('status', 'active');

    await emit('enrollment.past_due', enrollment.id as string, {
      paid_through: enrollment.paid_through,
      grace_until: graceUntil,
      subscription_state: state
    });

    // Told before their access goes, not after. There is no self-serve way
    // to re-enter card details on an Allpay subscription, so the email
    // points at us rather than pretending there is a button to press.
    await sendPastDueEmail(enrollment.id as string, graceDays, null);
    flagged += 1;
  }

  if (flagged > 0) {
    await alertAdmins(`ℹ️ ${flagged} enrollment(s) went past due this hour.`);
  }
  return flagged;
}

/** Grace is over: the seat in the channel goes back. */
async function enforceGrace(): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('enrollments')
    .select('id')
    .eq('status', 'past_due')
    .lt('grace_until', new Date().toISOString())
    .neq('telegram_access_status', 'removed')
    .limit(100);

  for (const enrollment of data ?? []) {
    await revokeAccess(enrollment.id as string, 'grace_period_elapsed');
  }
  return data?.length ?? 0;
}

/**
 * The course ended.
 *
 * Anchored on the group's end date rather than on a payment count, so a
 * student who paid in full and one who paid monthly finish together.
 */
async function completeFinished(): Promise<number> {
  const db = createSupabaseAdminClient();

  const { data: finishedGroups } = await db
    .from('study_groups')
    .select('id')
    .not('end_date', 'is', null)
    .lt('end_date', today());

  const ids = (finishedGroups ?? []).map((g) => g.id as string);
  if (ids.length === 0) return 0;

  const { data } = await db
    .from('enrollments')
    .select('id')
    .in('group_id', ids)
    .in('status', ['active', 'past_due'])
    .limit(200);

  for (const enrollment of data ?? []) {
    await db
      .from('enrollments')
      .update({ status: 'completed', subscription_status: 'completed' })
      .eq('id', enrollment.id);
    await revokeAccess(enrollment.id as string, 'course_completed');
    await emit('enrollment.completed', enrollment.id as string, {});
  }
  return data?.length ?? 0;
}

/**
 * Paid for, but never let in.
 *
 * The gap this closes: Telegram was unreachable when the webhook ran, the
 * group had no channel id configured, or the grant simply threw. The money
 * is recorded either way, so the student must not be left outside.
 */
async function retryFailedGrants(): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('enrollments')
    .select('id')
    .eq('status', 'active')
    .in('telegram_access_status', ['not_granted', 'expired'])
    .limit(50);

  let granted = 0;
  for (const enrollment of data ?? []) {
    try {
      const result = await grantAccess(enrollment.id as string);
      if (result.status === 'invite') granted += 1;
    } catch (error) {
      console.error(`[cron] retry grant failed for ${enrollment.id}`, error);
    }
  }
  return granted;
}
