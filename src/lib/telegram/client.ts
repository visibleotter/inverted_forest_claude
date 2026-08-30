/**
 * Telegram Bot API — the only place in the project that talks to Telegram.
 *
 * The bot must be an administrator of every private chat with the
 * `can_invite_users` right, and for `banChatMember` to work it also needs
 * `can_restrict_members`.
 *
 * One detail that is easy to get wrong and expensive to discover late: the
 * `chat_member` update type is **not** delivered by default. Unless it is
 * named explicitly in `allowed_updates`, the bot never learns who joined,
 * and without that there is no Telegram user id to remove later. See
 * `setWebhook` below.
 */

const API = 'https://api.telegram.org/bot';

export class TelegramError extends Error {
  constructor(
    readonly method: string,
    readonly description: string,
    readonly errorCode?: number
  ) {
    super(`telegram ${method} failed: ${description}`);
    this.name = 'TelegramError';
  }
}

function token(): string {
  const value = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!value) throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  return value;
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim());
}

async function call<T>(method: string, params: Record<string, unknown>) {
  const response = await fetch(`${API}${token()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(15_000)
  });

  const body = (await response.json()) as {
    ok: boolean;
    result?: T;
    description?: string;
    error_code?: number;
  };

  if (!body.ok) {
    throw new TelegramError(
      method,
      body.description ?? `http ${response.status}`,
      body.error_code
    );
  }
  return body.result as T;
}

export interface ChatInviteLink {
  invite_link: string;
  expire_date?: number;
  member_limit?: number;
  name?: string;
}

/**
 * Mint a single-use, expiring invite.
 *
 * `member_limit` and `creates_join_request` are mutually exclusive in the
 * Bot API, so this uses the member limit: simpler, and it does not need
 * anyone to approve requests by hand. The trade-off is that the link is
 * bearer-like — whoever opens it first takes the seat — which is why it is
 * short-lived and why the join is recorded against the enrollment.
 */
export function createChatInviteLink(params: {
  chatId: string;
  memberLimit: number;
  expiresAt: Date;
  name?: string;
}): Promise<ChatInviteLink> {
  return call<ChatInviteLink>('createChatInviteLink', {
    chat_id: params.chatId,
    member_limit: params.memberLimit,
    expire_date: Math.floor(params.expiresAt.getTime() / 1000),
    // Shown to admins in the chat's invite list — makes an orphaned link
    // traceable back to an enrollment without opening the database.
    ...(params.name ? { name: params.name.slice(0, 32) } : {})
  });
}

export function revokeChatInviteLink(
  chatId: string,
  inviteLink: string
): Promise<ChatInviteLink> {
  return call<ChatInviteLink>('revokeChatInviteLink', {
    chat_id: chatId,
    invite_link: inviteLink
  });
}

/**
 * Remove someone without banning them for good.
 *
 * `banChatMember` alone leaves the user unable to come back — wrong for a
 * student whose card merely failed. Unbanning straight afterwards with
 * `only_if_banned` turns the pair into a plain kick.
 */
export async function removeChatMember(
  chatId: string,
  userId: string
): Promise<void> {
  await call('banChatMember', { chat_id: chatId, user_id: Number(userId) });
  await call('unbanChatMember', {
    chat_id: chatId,
    user_id: Number(userId),
    only_if_banned: true
  });
}

export function getChatMemberCount(chatId: string): Promise<number> {
  return call<number>('getChatMemberCount', { chat_id: chatId });
}

export interface ChatMember {
  status: string;
  user: { id: number; is_bot: boolean; username?: string };
  can_invite_users?: boolean;
  can_restrict_members?: boolean;
}

export function getChatAdministrators(chatId: string): Promise<ChatMember[]> {
  return call<ChatMember[]>('getChatAdministrators', { chat_id: chatId });
}

export function sendMessage(
  chatId: string,
  text: string,
  options: { disableNotification?: boolean } = {}
): Promise<unknown> {
  return call('sendMessage', {
    chat_id: chatId,
    text,
    disable_notification: options.disableNotification ?? false,
    link_preview_options: { is_disabled: true }
  });
}

/**
 * Register the bot's webhook.
 *
 * `allowed_updates` is the load-bearing argument. Telegram's default set
 * excludes `chat_member`, and that is the only update that reports which
 * invite link a user joined with — the link back to the enrollment. Omit it
 * and every join is anonymous, which makes later removal impossible.
 *
 * Run once from a script or the admin panel, not per request.
 */
export function setWebhook(url: string, secretToken: string): Promise<unknown> {
  return call('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'chat_member', 'my_chat_member'],
    drop_pending_updates: false
  });
}

/**
 * Post an operational failure where a human will actually see it.
 * Automation logs are only read after someone already suspects a problem.
 */
export async function alertAdmins(text: string): Promise<void> {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID?.trim();
  if (!chatId || !isTelegramConfigured()) return;
  try {
    await sendMessage(chatId, text);
  } catch {
    // An alert that fails must never take down the flow it was reporting on.
  }
}
