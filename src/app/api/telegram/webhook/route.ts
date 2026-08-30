import { NextRequest, NextResponse } from 'next/server';
import { grantAccessByEmail, recordJoin } from '@/lib/access';
import { isDemoMode } from '@/lib/data';
import { maskEmail, secretsMatch } from '@/lib/security';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { sendMessage } from '@/lib/telegram/client';

/**
 * Telegram bot webhook.
 *
 * Two jobs, and the first one is the reason this endpoint exists at all:
 *
 *  1. **Record who joined.** A `chat_member` update names the invite link
 *     the person used, which is the only thread back to an enrollment.
 *     Without it we would know we had sent an invitation and nothing more,
 *     and could never remove that student from the channel later. Note
 *     that `chat_member` is not delivered unless it was named explicitly in
 *     `allowed_updates` when the webhook was registered — see
 *     `setWebhook` in `src/lib/telegram/client.ts`.
 *
 *  2. **`/grant <email> <group_id>`** for a payment taken outside Allpay
 *     (Bit, cash, a transfer). It routes through the same `grantAccess`
 *     as the payment webhook, so manual and automatic access are one
 *     operation with one audit trail, not two systems that drift.
 *
 * Authentication is Telegram's `secret_token`, which it echoes in a header
 * on every delivery. `/grant` additionally requires the sender to be on an
 * explicit allow-list: the endpoint is public, and a command that hands out
 * channel access cannot be available to whoever messages the bot.
 */

export const dynamic = 'force-dynamic';

interface TelegramUser {
  id: number;
  username?: string;
}

interface Update {
  update_id: number;
  message?: {
    text?: string;
    from?: TelegramUser;
    chat?: { id: number };
  };
  chat_member?: {
    chat: { id: number };
    from: TelegramUser;
    new_chat_member: { status: string; user: TelegramUser };
    invite_link?: { invite_link: string };
  };
}

function adminUserIds(): Set<string> {
  return new Set(
    (process.env.TELEGRAM_ADMIN_USER_IDS ?? '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

export async function POST(request: NextRequest) {
  if (
    !secretsMatch(
      request.headers.get('x-telegram-bot-api-secret-token'),
      process.env.TELEGRAM_WEBHOOK_SECRET
    )
  ) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, ignored: 'demo mode' });
  }

  let update: Update;
  try {
    update = (await request.json()) as Update;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  try {
    if (update.chat_member) await handleChatMember(update.chat_member);
    else if (update.message) await handleMessage(update.message);
  } catch (error) {
    console.error('[telegram] update handling failed', error);
    // Telegram retries on non-200 and will keep retrying the same update.
    // For a handler failure that is what we want; log and let it come back.
    return NextResponse.json({ error: 'handler failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

async function handleChatMember(event: NonNullable<Update['chat_member']>) {
  const joined = ['member', 'administrator', 'creator'].includes(
    event.new_chat_member.status
  );

  if (!joined) {
    // Someone left or was removed. Their enrollment keeps whatever status
    // the money says it should have; leaving the channel is not a refund.
    return;
  }

  const link = event.invite_link?.invite_link;
  if (!link) {
    // Joined some other way — added by an admin, or via a link we did not
    // mint. Nothing to attach it to, so record it and move on.
    await log('telegram.join_untracked', `chat ${event.chat.id}`);
    return;
  }

  const matched = await recordJoin(link, event.new_chat_member.user.id);
  if (!matched) {
    await log('telegram.join_unknown_link', `chat ${event.chat.id}`);
  }
}

async function handleMessage(message: NonNullable<Update['message']>) {
  const text = message.text?.trim();
  if (!text?.startsWith('/grant')) return;

  const senderId = String(message.from?.id ?? '');
  const chatId = String(message.chat?.id ?? '');
  const admins = adminUserIds();

  if (admins.size === 0 || !admins.has(senderId)) {
    await log('telegram.grant_denied', `sender ${senderId}`);
    if (chatId) {
      await sendMessage(chatId, 'Not authorised.').catch(() => undefined);
    }
    return;
  }

  const [, email, groupId] = text.split(/\s+/);
  if (!email || !groupId) {
    await sendMessage(chatId, 'Usage: /grant <email> <group_id>').catch(
      () => undefined
    );
    return;
  }

  const result = await grantAccessByEmail(email, groupId);
  await log(
    'telegram.grant_manual',
    `${groupId} · ${result.status}${
      result.enrollmentId ? ` · enrollment ${result.enrollmentId}` : ''
    }`
  );

  const reply =
    result.status === 'invite'
      ? `Access granted for ${maskEmail(email)} in ${groupId}.\n${result.inviteLink}`
      : result.status === 'already_joined'
        ? `${maskEmail(email)} is already in ${groupId}.`
        : `Could not grant access: ${result.reason}`;

  await sendMessage(chatId, reply).catch(() => undefined);
}

async function log(event: string, detail: string) {
  const db = createSupabaseAdminClient();
  await db.from('automation_logs').insert({
    source: 'telegram-bot',
    event,
    status: 'ok',
    detail
  });
}
