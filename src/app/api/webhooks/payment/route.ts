import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoMode } from '@/lib/data';
import { clientIpFrom, rateLimit, secretsMatch } from '@/lib/security';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Inbound payment webhook.
 *
 * Called by Make.com (today) or a payment provider (later) after a
 * payment event. Records the payment and moves the enrollment forward.
 * Telegram invites and emails remain the automation pipeline's job —
 * this endpoint is the system-of-record side of that pipeline.
 *
 * Auth: shared secret in the `x-webhook-secret` header, compared in
 * constant time. Delivery is idempotent on (provider, external_id), so
 * provider retries cannot double-charge a seat.
 */

const payloadSchema = z.object({
  event: z.enum(['payment.succeeded', 'payment.failed', 'payment.refunded']),
  enrollment_id: z.string().uuid(),
  provider: z.enum(['paypal', 'allpay', 'manual']).default('paypal'),
  amount: z.number().nonnegative().finite(),
  currency: z.string().trim().length(3).default('ILS'),
  external_id: z.string().trim().min(1).max(255).optional()
});

const statusByEvent = {
  'payment.succeeded': 'succeeded',
  'payment.failed': 'failed',
  'payment.refunded': 'refunded'
} as const;

export async function POST(request: NextRequest) {
  // Throttle before doing any work, so a flood of bad secrets stays cheap.
  const ip = clientIpFrom(request.headers);
  const limit = rateLimit(`webhook:${ip}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'rate limited' },
      {
        status: 429,
        headers: { 'retry-after': String(limit.retryAfterSeconds) }
      }
    );
  }

  if (
    !secretsMatch(
      request.headers.get('x-webhook-secret'),
      process.env.PAYMENT_WEBHOOK_SECRET
    )
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json(
      { error: 'database not configured' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'invalid payload', detail: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const { event, enrollment_id, provider, amount, currency, external_id } =
    parsed.data;
  const status = statusByEvent[event];
  const db = createSupabaseAdminClient();

  // Idempotency: a retried delivery must not create a second payment row
  // nor consume a second seat. When the provider gives us a transaction id
  // we upsert on (provider, external_id) and detect whether this call is
  // the one that actually created the row.
  let isNewPayment = true;

  if (external_id) {
    const { data: existing, error: lookupError } = await db
      .from('payments')
      .select('id, status')
      .eq('provider', provider)
      .eq('external_id', external_id)
      .maybeSingle();
    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 });
    }

    if (existing) {
      isNewPayment = false;
      if (existing.status !== status) {
        // Same transaction, new outcome (e.g. later refunded).
        const { error } = await db
          .from('payments')
          .update({ status })
          .eq('id', existing.id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }
  }

  if (isNewPayment) {
    const { error: insertError } = await db.from('payments').insert({
      enrollment_id,
      provider,
      amount,
      currency,
      status,
      external_id: external_id ?? null
    });
    if (insertError) {
      // Unique violation = a concurrent delivery won the race; that is a
      // successful outcome for an idempotent endpoint, not an error.
      if (insertError.code === '23505') {
        isNewPayment = false;
      } else {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }
  }

  if (event === 'payment.succeeded') {
    // Only the delivery that created the payment may consume a seat, and
    // only if the enrollment was not already active.
    const { data: activated, error: activationError } = await db
      .from('enrollments')
      .update({ status: 'active' })
      .eq('id', enrollment_id)
      .neq('status', 'active')
      .select('id');
    if (activationError) {
      return NextResponse.json(
        { error: activationError.message },
        { status: 500 }
      );
    }

    if (isNewPayment && activated && activated.length > 0) {
      await db.rpc('increment_seats_for_enrollment', {
        p_enrollment_id: enrollment_id
      });
    }
  } else if (event === 'payment.failed') {
    await db
      .from('enrollments')
      .update({ status: 'past_due' })
      .eq('id', enrollment_id)
      .eq('status', 'active');
  }

  // Log the enrollment id (an opaque uuid) and never the student's contact
  // details — logs are the least protected copy of the data.
  await db.from('automation_logs').insert({
    source: 'make',
    event,
    status: 'ok',
    detail: `enrollment ${enrollment_id} · ${amount} ${currency}${
      isNewPayment ? '' : ' · duplicate delivery ignored'
    }`
  });

  return NextResponse.json({ ok: true, duplicate: !isNewPayment });
}
