import { createSupabaseAdminClient } from './supabase/server';

/**
 * Domain events.
 *
 * Everything interesting is written here *before* it is announced
 * anywhere. That ordering is the whole point: it makes Supabase the source
 * of truth and Make.com a subscriber, so Make can be replaced — or simply
 * switched off — without losing a single event. The brief's own long-term
 * goal ("Make.com can eventually be replaced") only holds if Make never
 * becomes the place where something is first recorded.
 *
 * Fan-out failure is recorded, never thrown. A student who has paid must
 * get their access whether or not a spreadsheet row was appended.
 */

export type DomainEventType =
  | 'enrollment.created'
  | 'payment.succeeded'
  | 'payment.refunded'
  | 'payment.orphaned'
  | 'access.granted'
  | 'access.revoked'
  | 'access.joined'
  | 'enrollment.past_due'
  | 'enrollment.completed'
  | 'enrollment.cancelled';

export async function emit(
  type: DomainEventType,
  enrollmentId: string | null,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const db = createSupabaseAdminClient();

  const { data, error } = await db
    .from('domain_events')
    .insert({ type, enrollment_id: enrollmentId, payload })
    .select('id')
    .single();

  if (error) {
    console.error(`[events] could not record ${type}`, error.message);
    return;
  }

  await deliver(data.id as string, type, enrollmentId, payload);
}

async function deliver(
  id: string,
  type: DomainEventType,
  enrollmentId: string | null,
  payload: Record<string, unknown>
): Promise<void> {
  const url = process.env.MAKE_EVENTS_WEBHOOK_URL?.trim();
  const db = createSupabaseAdminClient();

  if (!url) {
    // No subscriber configured is a normal state, not a pending delivery.
    await db
      .from('domain_events')
      .update({ delivered_at: new Date().toISOString() })
      .eq('id', id);
    return;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, type, enrollment_id: enrollmentId, ...payload }),
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) throw new Error(`http ${response.status}`);

    await db
      .from('domain_events')
      .update({ delivered_at: new Date().toISOString(), delivery_error: null })
      .eq('id', id);
  } catch (error) {
    // Left undelivered on purpose — the cron sweep retries these.
    await db
      .from('domain_events')
      .update({
        delivery_error: error instanceof Error ? error.message : 'unknown'
      })
      .eq('id', id);
  }
}

/** Retry every event the fan-out has not yet managed to deliver. */
export async function redeliverPending(limit = 50): Promise<number> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('domain_events')
    .select('id, type, enrollment_id, payload')
    .is('delivered_at', null)
    .order('created_at', { ascending: true })
    .limit(limit);

  for (const row of data ?? []) {
    await deliver(
      row.id as string,
      row.type as DomainEventType,
      (row.enrollment_id as string | null) ?? null,
      (row.payload as Record<string, unknown>) ?? {}
    );
  }
  return data?.length ?? 0;
}
