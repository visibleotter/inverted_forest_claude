import { emit } from './events';
import { maskEmail } from './security';
import { getNumericSettings } from './settings';
import { createSupabaseAdminClient } from './supabase/server';
import {
  alertAdmins,
  createChatInviteLink,
  isTelegramConfigured,
  removeChatMember,
  revokeChatInviteLink
} from './telegram/client';

/**
 * The access layer.
 *
 * The brief asks for one conceptual operation — `grantTelegramAccess(enrollment)` —
 * shared by the payment webhook, the admin "grant access" button and the
 * bot's manual `/grant` command, rather than three parallel systems that
 * drift apart. This is that operation, and nothing outside this file may
 * create or revoke Telegram access.
 *
 * Both operations are idempotent. That is not a nicety: Allpay retries a
 * webhook up to ten times over twenty-four hours, so "granted twice" is the
 * expected case, not the exceptional one. Granting again returns the invite
 * that already exists instead of minting a second one.
 */

export type GrantResult =
  | { status: 'invite'; inviteLink: string; expiresAt: string; reused: boolean }
  | { status: 'already_joined' }
  | { status: 'unavailable'; reason: string };

interface EnrollmentRow {
  id: string;
  group_id: string;
  student_id: string;
  telegram_access_status: string;
  telegram_user_id: string | null;
}

interface GroupRow {
  id: string;
  telegram_channel_id: string | null;
  invite_member_limit: number;
}

async function loadEnrollment(
  enrollmentId: string
): Promise<{ enrollment: EnrollmentRow; group: GroupRow } | null> {
  const db = createSupabaseAdminClient();

  const { data: enrollment } = await db
    .from('enrollments')
    .select('id, group_id, student_id, telegram_access_status, telegram_user_id')
    .eq('id', enrollmentId)
    .maybeSingle();
  if (!enrollment) return null;

  const { data: group } = await db
    .from('study_groups')
    .select('id, telegram_channel_id, invite_member_limit')
    .eq('id', enrollment.group_id)
    .maybeSingle();
  if (!group) return null;

  return {
    enrollment: enrollment as EnrollmentRow,
    group: group as GroupRow
  };
}

export async function grantAccess(enrollmentId: string): Promise<GrantResult> {
  const db = createSupabaseAdminClient();
  const loaded = await loadEnrollment(enrollmentId);

  if (!loaded) return { status: 'unavailable', reason: 'enrollment_not_found' };
  const { enrollment, group } = loaded;

  if (enrollment.telegram_access_status === 'joined') {
    return { status: 'already_joined' };
  }

  if (!group.telegram_channel_id) {
    // A group without a channel is a configuration gap, not a student
    // problem — say so where someone will act on it.
    await alertAdmins(
      `⚠️ Group ${group.id} has no telegram_channel_id; enrollment ${enrollmentId} paid but cannot be admitted.`
    );
    return { status: 'unavailable', reason: 'group_has_no_channel' };
  }

  if (!isTelegramConfigured()) {
    return { status: 'unavailable', reason: 'telegram_not_configured' };
  }

  // Idempotency: an invite that is still live is the answer to a repeated
  // grant, so a retried webhook does not fill the channel's invite list.
  const { data: existing } = await db
    .from('telegram_invites')
    .select('invite_link, expires_at')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      status: 'invite',
      inviteLink: existing.invite_link as string,
      expiresAt: existing.expires_at as string,
      reused: true
    };
  }

  const settings = await getNumericSettings();
  const expiresAt = new Date(
    Date.now() + settings.invite_ttl_days * 24 * 60 * 60 * 1000
  );

  const link = await createChatInviteLink({
    chatId: group.telegram_channel_id,
    memberLimit: group.invite_member_limit,
    expiresAt,
    name: `enr-${enrollmentId.slice(0, 8)}`
  });

  const { error } = await db.from('telegram_invites').insert({
    enrollment_id: enrollmentId,
    group_id: group.id,
    chat_id: group.telegram_channel_id,
    invite_link: link.invite_link,
    member_limit: group.invite_member_limit,
    status: 'active',
    expires_at: expiresAt.toISOString()
  });
  if (error) throw new Error(`could not record invite: ${error.message}`);

  await db
    .from('enrollments')
    .update({
      telegram_access_status: 'invite_created',
      telegram_invited_at: new Date().toISOString()
    })
    .eq('id', enrollmentId);

  await emit('access.granted', enrollmentId, {
    group_id: group.id,
    expires_at: expiresAt.toISOString()
  });

  return {
    status: 'invite',
    inviteLink: link.invite_link,
    expiresAt: expiresAt.toISOString(),
    reused: false
  };
}

export async function revokeAccess(
  enrollmentId: string,
  reason: string
): Promise<void> {
  const db = createSupabaseAdminClient();
  const loaded = await loadEnrollment(enrollmentId);
  if (!loaded) return;
  const { enrollment, group } = loaded;

  // Kill any invite that has not been used yet, so a link sitting in an
  // inbox cannot let someone in after their access ended.
  const { data: live } = await db
    .from('telegram_invites')
    .select('id, invite_link, chat_id')
    .eq('enrollment_id', enrollmentId)
    .eq('status', 'active');

  for (const invite of live ?? []) {
    try {
      if (isTelegramConfigured()) {
        await revokeChatInviteLink(
          invite.chat_id as string,
          invite.invite_link as string
        );
      }
    } catch {
      // Already revoked, or the chat is gone. Record it either way.
    }
    await db
      .from('telegram_invites')
      .update({ status: 'revoked' })
      .eq('id', invite.id);
  }

  if (enrollment.telegram_user_id && group.telegram_channel_id) {
    try {
      await removeChatMember(
        group.telegram_channel_id,
        enrollment.telegram_user_id
      );
    } catch (error) {
      await alertAdmins(
        `⚠️ Could not remove user from ${group.id} for enrollment ${enrollmentId}: ${
          error instanceof Error ? error.message : 'unknown'
        }`
      );
    }
  }

  await db
    .from('enrollments')
    .update({
      telegram_access_status: 'removed',
      telegram_removed_at: new Date().toISOString()
    })
    .eq('id', enrollmentId);

  await emit('access.revoked', enrollmentId, { reason, group_id: group.id });
}

/**
 * Record that someone actually walked through the door.
 *
 * Called from the bot webhook when a `chat_member` update arrives naming
 * the invite link that was used. Without this the system knows it sent an
 * invitation and nothing more — and an enrollment with no Telegram user id
 * can never be removed from the channel later, which is the gap that makes
 * the whole revoke path theoretical.
 */
export async function recordJoin(
  inviteLink: string,
  telegramUserId: number
): Promise<boolean> {
  const db = createSupabaseAdminClient();

  const { data: invite } = await db
    .from('telegram_invites')
    .select('id, enrollment_id')
    .eq('invite_link', inviteLink)
    .maybeSingle();

  if (!invite) return false;

  const now = new Date().toISOString();

  await db
    .from('telegram_invites')
    .update({ status: 'used', used_at: now })
    .eq('id', invite.id);

  await db
    .from('enrollments')
    .update({
      telegram_access_status: 'joined',
      telegram_user_id: String(telegramUserId),
      telegram_joined_at: now
    })
    .eq('id', invite.enrollment_id);

  await emit('access.joined', invite.enrollment_id as string, {
    telegram_user_id: telegramUserId
  });
  return true;
}

/**
 * Manual grant by email + group, for a payment taken outside Allpay —
 * Bit, cash, a bank transfer. Deliberately routed through `grantAccess`
 * so manual and automatic access are the same operation with the same
 * idempotency and the same audit trail, exactly as the brief asks.
 */
export async function grantAccessByEmail(
  email: string,
  groupId: string
): Promise<GrantResult & { enrollmentId?: string }> {
  const db = createSupabaseAdminClient();

  const { data: student } = await db
    .from('students')
    .select('id')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (!student) {
    console.warn(`[access] manual grant: no student for ${maskEmail(email)}`);
    return { status: 'unavailable', reason: 'student_not_found' };
  }

  const { data: enrollment } = await db
    .from('enrollments')
    .select('id')
    .eq('student_id', student.id)
    .eq('group_id', groupId)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment) {
    return { status: 'unavailable', reason: 'enrollment_not_found' };
  }

  const result = await grantAccess(enrollment.id as string);
  return { ...result, enrollmentId: enrollment.id as string };
}
