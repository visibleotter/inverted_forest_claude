import { timingSafeEqual } from 'node:crypto';

/**
 * Constant-time secret comparison. A plain `!==` leaks the length of the
 * matching prefix through response timing, which lets an attacker recover
 * a shared secret byte by byte.
 */
export function secretsMatch(
  provided: string | null,
  expected: string | undefined
): boolean {
  if (!provided || !expected) return false;

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');

  // timingSafeEqual throws on length mismatch, so compare digests of equal
  // length instead — this keeps the comparison itself constant-time.
  if (a.length !== b.length) {
    // Still burn a comparison so the failure path costs the same.
    timingSafeEqual(a, a);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Mask an email for logs: `anna.kozlova@example.com` → `an***@example.com`.
 * Logs are usually the least-protected copy of personal data, so they get
 * enough to correlate a record but not enough to contact the person.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at <= 0) return '***';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const head = local.slice(0, Math.min(2, local.length));
  return `${head}***@${domain}`;
}

/** Mask a phone number, keeping only the last two digits. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 3) return '***';
  return `***${digits.slice(-2)}`;
}

/**
 * Best-effort client IP from proxy headers. Vercel sets `x-forwarded-for`;
 * the left-most entry is the original client.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? 'unknown';
}

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter.
 *
 * In-process and therefore per-instance: it stops naive scripted abuse of
 * the public forms, which is what it is for. It is NOT a defence against a
 * distributed attack — for that, move this to Upstash/Redis or put the
 * routes behind Vercel's WAF. Kept dependency-free deliberately so the
 * project runs with zero configuration.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 10_000) pruneExpired(now);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000)
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

function pruneExpired(now: number) {
  buckets.forEach((bucket, key) => {
    if (now >= bucket.resetAt) buckets.delete(key);
  });
}
