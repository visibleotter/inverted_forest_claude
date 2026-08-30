import { NextRequest, NextResponse } from 'next/server';
import { grantAccess, revokeAccess } from '@/lib/access';
import { isDemoMode } from '@/lib/data';
import { emit } from '@/lib/events';
import { getCheckoutProvider } from '@/lib/payments';
import { clientIpFrom, maskEmail, rateLimit } from '@/lib/security';
import { getNumericSettings } from '@/lib/settings';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { alertAdmins } from '@/lib/telegram/client';

/**
 * Allpay payment webhook.
 *
 * Design decisions that are easy to reverse by accident, so stated here:
 *
 *  * **This endpoint is the first receiver, not Make.com.** Signature
 *    verification, idempotency and the ledger belong in code, and Supabase
 *    can only be the source of truth if it is written to first. Make
 *    subscribes to the events this produces and can be unplugged.
 *
 *  * **A valid signature is necessary but not sufficient.** Before access is
 *    granted the payment is confirmed out-of-band with `paymentstatus`,
 *    signed with our own API key. A forged webhook would have to survive
 *    both checks.
 *
 *  * **The webhook is a trigger; `subscriptionstatus` is the ledger.** A
 *    subscription's monthly deliveries can be byte-identical to one another,
 *    so the period index — and therefore the idempotency key — comes from
 *    asking Allpay what it has actually charged, not from the payload.
 *
 *  * **Retries are the normal case.** Allpay delivers up to ten times over
 *    twenty-four hours. Every step below is safe to repeat, and a failure
 *    downstream returns a non-200 on purpose so that the retry does the
 *    recovery.
 */

export const dynamic = 'force-dynamic';

function addMonths(iso: string, months: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months);
  // Clamp a rolled-over short month (31 Jan + 1 month → 3 Mar) back to the
  // last day of the intended month.
  if (date.getUTCDate() < day) date.setUTCDate(0);
  return date.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const limit = rateLimit(`allpay:${ip}`, 120, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate limited' },
      {
        status: 429,
        headers: { 'retry-after': String(limit.retryAfterSeconds) }
      }
    );
  }

  if (isDemoMode()) {
    return NextResponse.json(
      { error: 'database not configured' },
      { status: 503 }
    );
  }

  const provider = getCheckoutProvider();
  if (!provider) {
    return NextResponse.json(
      { error: 'payment provider not configured' },
      { status: 503 }
    );
  }

  // The signature covers the bytes that arrived. Re-serialising a parsed
  // object would change them, so the raw text is what gets verified.
  const rawBody = await request.text();
  const contentType = request.headers.get('content-type') ?? '';
  const hook = provider.verifyWebhook(rawBody, contentType);

  if (!hook.valid) {
    // Loudly, and this is the reason why.
    //
    // Allpay has no account-wide webhook secret: API-created payments are
    // signed with the API key, dashboard payment links each carry their
    // own. If the wrong secret is configured, every real payment is
    // rejected — the safe direction, but a silent one. Allpay would retry
    // ten times over a day, give up, and the only trace would be a line in
    // a log nobody is reading while students wait for invitations.
    //
    // So this is recorded and, at most once an hour so a flood of junk
    // cannot drown the channel, announced where someone will see it.
    await recordRejection(hook.orderId, ip);
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  if (!hook.orderId) {
    return NextResponse.json({ error: 'missing order_id' }, { status: 422 });
  }

  const db = createSupabaseAdminClient();

  const { data: enrollment } = await db
    .from('enrollments')
    .select(
      'id, status, plan, group_id, course_id, paid_through, telegram_access_status'
    )
    .eq('order_id', hook.orderId)
    .maybeSingle();

  // A payment we cannot attach to anyone. Shared link, stale link, manual
  // charge — it happens, and the wrong answer is to guess from the payer's
  // email. Park it where an admin resolves it by hand.
  if (!enrollment) {
    await db.from('orphan_payments').insert({
      provider: 'allpay',
      order_id: hook.orderId,
      amount: hook.amount,
      currency: hook.currency,
      payload: hook.payload
    });
    await emit('payment.orphaned', null, {
      order_id: hook.orderId,
      amount: hook.amount
    });
    await alertAdmins(
      `⚠️ Allpay payment ${hook.orderId} (${hook.amount} ${hook.currency ?? ''}) matches no enrollment. Needs manual review.`
    );
    if (hook.clientEmail) {
      console.warn(`[allpay] orphan payment from ${maskEmail(hook.clientEmail)}`);
    }
    // Accepted and stored: retrying would not change the outcome.
    return NextResponse.json({ ok: true, orphaned: true });
  }

  if (hook.state === 'refunded' || hook.state === 'partially_refunded') {
    return handleRefund(enrollment.id as string, hook.orderId, hook.state);
  }

  if (hook.state !== 'paid') {
    // Allpay documents webhooks only for success and refund; anything else
    // is recorded and ignored rather than guessed at.
    await db.from('automation_logs').insert({
      source: 'allpay',
      event: 'webhook.ignored',
      status: 'ok',
      detail: `order ${hook.orderId} · state ${hook.state}`
    });
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Second, independent confirmation. The signature proves the message was
  // not tampered with; this proves Allpay actually holds the money.
  const confirmation = await provider.getPaymentStatus(hook.orderId);
  if (confirmation.state !== 'paid') {
    await db.from('automation_logs').insert({
      source: 'allpay',
      event: 'webhook.unconfirmed',
      status: 'error',
      detail: `order ${hook.orderId} · webhook said paid, paymentstatus said ${confirmation.state}`
    });
    await alertAdmins(
      `⚠️ Allpay webhook for ${hook.orderId} claimed paid but paymentstatus says ${confirmation.state}. Access NOT granted.`
    );
    return NextResponse.json({ ok: true, unconfirmed: true });
  }

  const periodIndex = await resolvePeriodIndex(
    provider,
    hook.orderId,
    enrollment.plan as string
  );
  // The period suffix is what stops month two from looking like a retry of
  // month one — the two deliveries can otherwise be identical.
  const externalId = `${hook.orderId}#${periodIndex}`;

  const { error: insertError } = await db.from('payments').insert({
    enrollment_id: enrollment.id,
    provider: 'allpay',
    amount: hook.amount ?? 0,
    currency: hook.currency ?? 'ILS',
    status: 'succeeded',
    external_id: externalId,
    period_index: periodIndex,
    receipt_url: hook.receiptUrl,
    raw: hook.payload
  });

  // 23505 = this exact charge is already in the ledger; a retry, not an error.
  const isNewPayment = !insertError;
  if (insertError && insertError.code !== '23505') {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const paidThrough = await computePaidThrough(
    enrollment.group_id as string,
    enrollment.course_id as string,
    enrollment.plan as string,
    periodIndex
  );

  const wasPending = enrollment.status === 'pending_payment';

  await db
    .from('enrollments')
    .update({
      status: 'active',
      subscription_status: enrollment.plan === 'monthly' ? 'active' : 'none',
      paid_through: paidThrough,
      grace_until: null,
      pending_expires_at: null
    })
    .eq('id', enrollment.id);

  // A seat is consumed once, by the payment that first activated the
  // enrollment — never by a retry and never by month two.
  if (isNewPayment && wasPending) {
    await db.rpc('increment_seats_for_enrollment', {
      p_enrollment_id: enrollment.id
    });
  }

  if (isNewPayment) {
    await emit('payment.succeeded', enrollment.id as string, {
      order_id: hook.orderId,
      period_index: periodIndex,
      amount: hook.amount,
      currency: hook.currency,
      receipt_url: hook.receiptUrl,
      group_id: enrollment.group_id
    });
  }

  // Grant last, and let a failure here become a non-200 so Allpay's retry
  // is the recovery mechanism. The ledger is already correct either way,
  // and the hourly sweep is the second net.
  try {
    const grant = await grantAccess(enrollment.id as string);
    return NextResponse.json({
      ok: true,
      duplicate: !isNewPayment,
      access: grant.status
    });
  } catch (error) {
    console.error(`[allpay] access grant failed for ${enrollment.id}`, error);
    return NextResponse.json(
      { error: 'access grant failed, retry expected' },
      { status: 500 }
    );
  }
}

let lastRejectionAlert = 0;

async function recordRejection(orderId: string | null, ip: string) {
  const reference = orderId ?? 'unknown order';
  console.warn(`[allpay] rejected mis-signed delivery for ${reference}`);

  try {
    await createSupabaseAdminClient().from('automation_logs').insert({
      source: 'allpay',
      event: 'webhook.signature_rejected',
      status: 'error',
      detail: `${reference} · from ${ip}`
    });
  } catch {
    // A failed log must not turn a rejection into a 500.
  }

  const hourAgo = Date.now() - 60 * 60 * 1000;
  if (lastRejectionAlert < hourAgo) {
    lastRejectionAlert = Date.now();
    await alertAdmins(
      `🚨 Allpay webhook rejected: signature did not match any configured secret (${reference}).\n` +
        `If this coincides with a real payment, check ALLPAY_API_KEY and ALLPAY_WEBHOOK_SECRETS — no access is being granted until it matches.`
    );
  }
}

/**
 * Which monthly charge this is.
 *
 * Asks Allpay rather than counting our own rows: our count would be wrong
 * for exactly the case that matters, a delivery we have not recorded yet.
 * Falls back to counting successful payments if the subscription cannot be
 * read, which is still better than treating every month as period one.
 */
async function resolvePeriodIndex(
  provider: NonNullable<ReturnType<typeof getCheckoutProvider>>,
  orderId: string,
  plan: string
): Promise<number> {
  if (plan !== 'monthly') return 1;

  try {
    const subscription = await provider.getSubscriptionStatus(orderId);
    if (subscription.payments.length > 0) return subscription.payments.length;
  } catch (error) {
    console.warn(`[allpay] subscriptionstatus unavailable for ${orderId}`, error);
  }

  const db = createSupabaseAdminClient();
  const { count } = await db
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'succeeded')
    .like('external_id', `${orderId}#%`);

  return (count ?? 0) + 1;
}

/**
 * How far access is paid up.
 *
 * Anchored to the group's start date rather than to the payment date, so a
 * charge that arrives early or late does not shift the student's coverage
 * relative to the rest of their group.
 */
async function computePaidThrough(
  groupId: string,
  courseId: string,
  plan: string,
  periodIndex: number
): Promise<string> {
  const db = createSupabaseAdminClient();

  const { data: group } = await db
    .from('study_groups')
    .select('start_date, end_date')
    .eq('id', groupId)
    .maybeSingle();

  const start = (group?.start_date as string) ?? new Date().toISOString().slice(0, 10);

  if (plan === 'full') {
    if (group?.end_date) return group.end_date as string;
    const { data: course } = await db
      .from('courses')
      .select('duration_months')
      .eq('id', courseId)
      .maybeSingle();
    return addMonths(start, Number(course?.duration_months ?? 3));
  }

  return addMonths(start, periodIndex);
}

async function handleRefund(
  enrollmentId: string,
  orderId: string,
  state: 'refunded' | 'partially_refunded'
) {
  const db = createSupabaseAdminClient();
  const settings = await getNumericSettings();

  await db
    .from('payments')
    .update({ status: 'refunded' })
    .eq('enrollment_id', enrollmentId)
    .like('external_id', `${orderId}#%`);

  await db
    .from('enrollments')
    .update({
      status: 'refunded',
      subscription_status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancel_reason: `allpay_${state}`
    })
    .eq('id', enrollmentId);

  await emit('payment.refunded', enrollmentId, { order_id: orderId, state });

  // A full refund ends the relationship, so the channel seat goes back. A
  // partial one is usually a goodwill adjustment mid-course, and pulling
  // someone out of their group over it would be the wrong call — the
  // grace period gives an admin time to intervene either way.
  if (state === 'refunded') {
    await revokeAccess(enrollmentId, 'refunded');
  } else {
    await alertAdmins(
      `ℹ️ Partial refund on ${orderId}. Access left in place; review within ${settings.grace_period_days} days.`
    );
  }

  return NextResponse.json({ ok: true, refunded: true });
}
