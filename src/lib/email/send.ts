import { maskEmail } from '../security';

/**
 * Transactional email over Resend's REST API.
 *
 * No SDK: sending an email is one POST, and a dependency that wraps one
 * POST is a dependency that has to be kept up to date for no gain.
 *
 * Not configured is a supported state. Email is the *backup* path for a
 * Telegram invite — the primary one is the invite shown on the page the
 * payer is returned to — so a missing API key degrades the experience
 * without losing anyone.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Deduplicates retries at Resend's end. */
  idempotencyKey?: string;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function fromAddress(): string {
  return (
    process.env.EMAIL_FROM?.trim() || 'Inverted Forest <hello@invertedforest.com>'
  );
}

export async function sendEmail(message: EmailMessage): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.warn(
      `[email] not configured; skipped "${message.subject}" to ${maskEmail(message.to)}`
    );
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${key}`,
        'content-type': 'application/json',
        // Allpay retries a webhook up to ten times, and each retry walks
        // the same path. Without this the student gets ten copies.
        ...(message.idempotencyKey
          ? { 'Idempotency-Key': message.idempotencyKey }
          : {})
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text
      }),
      signal: AbortSignal.timeout(10_000)
    });

    if (!response.ok) {
      // Never log the body verbatim — it echoes the recipient back.
      console.error(`[email] send failed with ${response.status}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`[email] send threw for ${maskEmail(message.to)}`, error);
    return false;
  }
}
