import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { isDemoMode } from '@/lib/data';
import { clientIpFrom, rateLimit } from '@/lib/security';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Enrollment status for the post-payment page.
 *
 * Why this exists: Allpay returns the payer to the site the moment they
 * finish, which is usually *before* the webhook has landed. Without
 * something to poll, the student sees a page that says "check your email"
 * and then has to hope. Here they watch it resolve, and get the invite on
 * the screen they are already looking at — email becomes the backup rather
 * than the only path for a link that expires in seven days.
 *
 * Access control is the unguessable enrollment id in the URL, which is the
 * same thing that protects the emailed link. Nothing personal is returned:
 * no name, no email, no amount — only where the enrollment stands and, once
 * it is paid for, the invite that was minted for it.
 */

export const dynamic = 'force-dynamic';

const paramsSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const ip = clientIpFrom(request.headers);
  // Generous: this is polled every few seconds by a page someone is
  // watching, and two people behind one office NAT must both get through.
  const limit = rateLimit(`enroll-status:${ip}`, 120, 60_000);
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
    // Demo mode has no enrollment to look up. Answer honestly rather than
    // pretending a payment succeeded.
    return NextResponse.json({ state: 'demo' });
  }

  if (!paramsSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const db = createSupabaseAdminClient();

  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, status, telegram_access_status')
    .eq('id', params.id)
    .maybeSingle();

  if (!enrollment) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  const paid =
    enrollment.status === 'active' || enrollment.status === 'completed';

  if (!paid) {
    return NextResponse.json({ state: 'pending' });
  }

  const { data: invite } = await db
    .from('telegram_invites')
    .select('invite_link, expires_at')
    .eq('enrollment_id', params.id)
    .in('status', ['active', 'used'])
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!invite) {
    // Paid, but access has not been minted yet — either the grant is still
    // in flight or it failed and the hourly sweep will retry it.
    return NextResponse.json({ state: 'paid_no_invite' });
  }

  return NextResponse.json({
    state: 'ready',
    inviteLink: invite.invite_link,
    expiresAt: invite.expires_at
  });
}
