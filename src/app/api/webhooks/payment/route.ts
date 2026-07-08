import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoMode } from '@/lib/data';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Inbound payment webhook.
 *
 * Called by Make.com (today) or a payment provider (later) after a
 * payment event. Records the payment and moves the enrollment forward.
 * Telegram invites and emails remain the automation pipeline's job —
 * this endpoint is the system-of-record side of that pipeline.
 *
 * Auth: shared secret in the `x-webhook-secret` header.
 */

const payloadSchema = z.object({
  event: z.enum(['payment.succeeded', 'payment.failed', 'payment.refunded']),
  enrollment_id: z.string().min(1),
  provider: z.enum(['paypal', 'allpay', 'manual']).default('paypal'),
  amount: z.number().nonnegative(),
  currency: z.string().default('ILS'),
  external_id: z.string().optional()
});

const statusByEvent = {
  'payment.succeeded': 'succeeded',
  'payment.failed': 'failed',
  'payment.refunded': 'refunded'
} as const;

export async function POST(request: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
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
  const db = createSupabaseAdminClient();

  const { error: paymentError } = await db.from('payments').insert({
    enrollment_id,
    provider,
    amount,
    currency,
    status: statusByEvent[event],
    external_id: external_id ?? null
  });
  if (paymentError) {
    return NextResponse.json({ error: paymentError.message }, { status: 500 });
  }

  if (event === 'payment.succeeded') {
    await db
      .from('enrollments')
      .update({ status: 'active' })
      .eq('id', enrollment_id);
    // Seat accounting: one confirmed payment activates one seat.
    await db.rpc('increment_seats_for_enrollment', {
      p_enrollment_id: enrollment_id
    });
  } else if (event === 'payment.failed') {
    await db
      .from('enrollments')
      .update({ status: 'past_due' })
      .eq('id', enrollment_id)
      .eq('status', 'active');
  }

  await db.from('automation_logs').insert({
    source: 'make',
    event,
    status: 'ok',
    detail: `enrollment ${enrollment_id} · ${amount} ${currency}`
  });

  return NextResponse.json({ ok: true });
}
