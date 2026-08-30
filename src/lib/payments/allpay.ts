import { createHash, timingSafeEqual } from 'node:crypto';
import type {
  CheckoutProvider,
  CheckoutRequest,
  CheckoutSession,
  ProviderPaymentStatus,
  ProviderSubscriptionStatus,
  WebhookVerification
} from './provider';

/**
 * Allpay — the only file in the project that knows how Allpay works.
 *
 * Endpoints (all POST, all to the same host with a `show=` selector):
 *   getpayment          create a payment / subscription, returns payment_url
 *   paymentstatus       what happened to one order
 *   subscriptionstatus  the charge history of a subscription
 *   cancelsubscription  stop future charges
 *   refund              full or partial
 *
 * Two things about this integration are worth stating plainly:
 *
 *  1. `order_id` is ours. We send the enrollment id and get it back in the
 *     webhook, so a payment never has to be matched by the payer's email —
 *     which would break the first time a parent pays for a child from a
 *     spouse's address.
 *
 *  2. A subscription's monthly webhooks can be indistinguishable from one
 *     another: same order_id, same amount, therefore the same signature.
 *     The webhook is treated as a *trigger*; `subscriptionstatus` is the
 *     *ledger*. See `resolvePeriodIndex` in the webhook route.
 */

const BASE = 'https://allpay.to/app/';

export interface AllpayCredentials {
  login: string;
  apiKey: string;
  /**
   * Additional secrets an inbound webhook might be signed with.
   *
   * There is no single account-wide webhook secret in Allpay: a payment
   * *link* created in the dashboard carries its own, and payments created
   * through the API are signed with the API key. So verification tries the
   * API key and every secret listed here, and accepts on the first match.
   *
   * That is not a weakening. Each candidate is a complete SHA256
   * comparison against a secret only we and Allpay hold; adding a second
   * one no more helps a forger than owning two locks helps a burglar.
   */
  webhookSecrets: string[];
}

/* ── Signature ─────────────────────────────────────────────────────────
 *
 * Documented algorithm:
 *   1. remove `sign`
 *   2. drop parameters with empty values
 *   3. sort keys alphabetically — at every level, including inside items
 *   4. join the values with ':'
 *   5. append ':<secret>'
 *   6. SHA256
 *
 * Exported so it can be tested against a payload captured from Test mode
 * rather than only against my reading of the documentation.
 */
export function collectSignatureValues(input: unknown): string[] {
  if (input === null || input === undefined) return [];

  if (Array.isArray(input)) {
    // Array order is the caller's; only object keys get sorted.
    return input.flatMap(collectSignatureValues);
  }

  if (typeof input === 'object') {
    return Object.keys(input as Record<string, unknown>)
      .sort()
      .flatMap((key) =>
        collectSignatureValues((input as Record<string, unknown>)[key])
      );
  }

  const value = typeof input === 'boolean' ? (input ? '1' : '0') : String(input);
  // Step 2: empty values are excluded, not signed as blanks.
  return value === '' ? [] : [value];
}

export function signPayload(
  payload: Record<string, unknown>,
  secret: string
): string {
  const { sign: _ignored, ...rest } = payload;
  const joined = collectSignatureValues(rest).join(':');
  return createHash('sha256').update(`${joined}:${secret}`, 'utf8').digest('hex');
}

function digestsMatch(a: string, b: string): boolean {
  const left = Buffer.from(a.toLowerCase(), 'utf8');
  const right = Buffer.from(b.toLowerCase(), 'utf8');
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/**
 * Numbers are where a signature check quietly fails: `250` and `250.00`
 * hash differently, and JSON parsing has already thrown away which one
 * arrived. Rather than guess, we check the payload as parsed and again with
 * every number rendered to two decimals, and accept if either matches.
 *
 * This is not a weakening — each candidate is a complete SHA256 comparison
 * against the same secret, so an attacker still has to produce a valid
 * digest. It only removes an ambiguity we cannot otherwise resolve until a
 * real Test-mode payload is captured.
 */
function toFixedNumbers(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(toFixedNumbers);
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input as Record<string, unknown>).map(([k, v]) => [
        k,
        toFixedNumbers(v)
      ])
    );
  }
  if (typeof input === 'number' && Number.isFinite(input)) {
    return input.toFixed(2);
  }
  return input;
}

export function verifySignature(
  payload: Record<string, unknown>,
  secret: string
): boolean {
  const received = payload.sign;
  if (typeof received !== 'string' || received.length === 0) return false;

  if (digestsMatch(signPayload(payload, secret), received)) return true;

  const { sign: _drop, ...rest } = payload;
  const normalised = toFixedNumbers(rest) as Record<string, unknown>;
  return digestsMatch(signPayload(normalised, secret), received);
}

/* ── Client ────────────────────────────────────────────────────────── */

interface AllpayResponse {
  status?: number | string;
  payment_url?: string;
  [key: string]: unknown;
}

export class AllpayProvider implements CheckoutProvider {
  readonly name = 'allpay' as const;

  private readonly credentials: AllpayCredentials;

  // Written out rather than declared as a constructor parameter property:
  // that TypeScript shorthand is not erasable syntax, and the signature
  // helpers in this file are run directly by Node's test runner, which
  // strips types rather than compiling them.
  constructor(credentials: AllpayCredentials) {
    this.credentials = credentials;
  }

  private async call(
    show: string,
    params: Record<string, unknown>
  ): Promise<AllpayResponse> {
    const body: Record<string, unknown> = {
      login: this.credentials.login,
      ...params
    };
    body.sign = signPayload(body, this.credentials.apiKey);

    const response = await fetch(`${BASE}?show=${show}&mode=api11`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000)
    });

    if (!response.ok) {
      // Never let a provider body reach our logs verbatim — it echoes the
      // payer's name, email and card mask back at us.
      throw new Error(`allpay ${show} responded ${response.status}`);
    }

    return (await response.json()) as AllpayResponse;
  }

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const params: Record<string, unknown> = {
      order_id: request.orderId,
      currency: request.currency,
      items: request.items.map((item) => ({
        name: item.name,
        price: item.price,
        qty: item.qty,
        vat: item.vat
      })),
      client_name: request.client.name,
      client_email: request.client.email,
      ...(request.client.phone ? { client_phone: request.client.phone } : {}),
      // Two pass-through fields, returned unchanged. The group id is what
      // the automation layer needs; the enrollment id is repeated here so a
      // change to the order_id scheme cannot orphan a payment.
      add_field_1: request.groupId,
      add_field_2: request.orderId,
      webhook_url: request.webhookUrl,
      success_url: request.successUrl,
      ...(request.backlinkUrl ? { backlink_url: request.backlinkUrl } : {}),
      lang: request.locale
    };

    if (request.plan === 'monthly' && request.installments > 1) {
      // start_type 1 = charge now; end_type 3 = stop after N charges.
      // A course has a fixed length, so the subscription ends itself —
      // nobody has to remember to switch it off.
      params.subscription = {
        start_type: 1,
        end_type: 3,
        end_n: request.installments
      };
    }

    const result = await this.call('getpayment', params);
    if (!result.payment_url || typeof result.payment_url !== 'string') {
      throw new Error('allpay getpayment returned no payment_url');
    }

    return { paymentUrl: result.payment_url, externalId: request.orderId };
  }

  async getPaymentStatus(orderId: string): Promise<ProviderPaymentStatus> {
    const result = await this.call('paymentstatus', { order_id: orderId });
    const code = Number(result.status);
    const state =
      code === 1
        ? 'paid'
        : code === 3
          ? 'refunded'
          : code === 4
            ? 'partially_refunded'
            : 'unpaid';

    return {
      state,
      amount: typeof result.amount === 'number' ? result.amount : null,
      currency: typeof result.currency === 'string' ? result.currency : null
    };
  }

  async getSubscriptionStatus(
    orderId: string
  ): Promise<ProviderSubscriptionStatus> {
    const result = await this.call('subscriptionstatus', { order_id: orderId });
    const code = Number(result.status);
    const state =
      code === 1
        ? 'active'
        : code === 2
          ? 'completed'
          : code === 3
            ? 'error'
            : code === 4
              ? 'cancelled'
              : 'unknown';

    const raw = Array.isArray(result.payments) ? result.payments : [];
    const payments = raw.map((entry, index) => {
      const row = (entry ?? {}) as Record<string, unknown>;
      return {
        periodIndex: index + 1,
        amount: Number(row.amount ?? 0),
        currency: typeof row.currency === 'string' ? row.currency : 'ILS',
        paidAt: typeof row.date === 'string' ? row.date : null,
        receiptUrl: typeof row.receipt === 'string' ? row.receipt : null
      };
    });

    return {
      state,
      payments,
      paidTotal: Number(result.paid_total ?? 0)
    };
  }

  async cancelSubscription(orderId: string): Promise<void> {
    await this.call('cancelsubscription', { order_id: orderId });
  }

  async refund(orderId: string, amount?: number): Promise<void> {
    await this.call('refund', {
      order_id: orderId,
      ...(amount !== undefined ? { amount } : {})
    });
  }

  verifyWebhook(rawBody: string, contentType: string): WebhookVerification {
    const payload = parseWebhookBody(rawBody, contentType);

    // The API key first: it is what signs payments this site created, which
    // is every payment in the normal flow. Per-link secrets are for the
    // manual fallback links made by hand in the dashboard.
    const candidates = [
      this.credentials.apiKey,
      ...this.credentials.webhookSecrets
    ];
    const valid = candidates.some((secret) =>
      verifySignature(payload, secret)
    );

    const code = Number(payload.status);
    const state =
      code === 1
        ? 'paid'
        : code === 3
          ? 'refunded'
          : code === 4
            ? 'partially_refunded'
            : 'other';

    return {
      valid,
      payload,
      orderId: str(payload.order_id) ?? str(payload.add_field_2),
      state,
      amount: payload.amount === undefined ? null : Number(payload.amount),
      currency: str(payload.currency),
      clientEmail: str(payload.client_email),
      receiptUrl: str(payload.receipt),
      groupId: str(payload.add_field_1)
    };
  }
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Allpay may post either JSON or a form encoding. Form values are all
 * strings, which is the easier case; JSON has already coerced numbers by
 * the time we see it, which is what `verifySignature` compensates for.
 */
export function parseWebhookBody(
  rawBody: string,
  contentType: string
): Record<string, unknown> {
  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(rawBody);
      return parsed && typeof parsed === 'object'
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }

  const params = new URLSearchParams(rawBody);
  const out: Record<string, unknown> = {};
  params.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}
