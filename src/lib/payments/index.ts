import { siteConfig } from '../config';
import { AllpayProvider, type AllpayCredentials } from './allpay';
import type { CheckoutProvider } from './provider';

export type {
  CheckoutProvider,
  CheckoutRequest,
  CheckoutSession,
  CheckoutLineItem,
  ProviderPayment,
  ProviderPaymentStatus,
  ProviderSubscriptionStatus,
  WebhookVerification
} from './provider';

function credentials(): AllpayCredentials | null {
  const login = process.env.ALLPAY_LOGIN?.trim();
  const apiKey = process.env.ALLPAY_API_KEY?.trim();
  if (!login || !apiKey) return null;

  // Optional, and comma-separated: Allpay has no account-wide webhook
  // secret. Payments this site creates are signed with the API key; a
  // payment *link* built by hand in the dashboard gets its own secret,
  // and each one that is actually in use belongs on this list.
  const webhookSecrets = (process.env.ALLPAY_WEBHOOK_SECRETS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return { login, apiKey, webhookSecrets };
}

let cached: CheckoutProvider | null = null;

/**
 * The active checkout provider, or null when Allpay is not configured.
 *
 * Null is a supported state, not an error: with no credentials the site
 * falls back to the study group's own `paymentUrl` — a link created by hand
 * in the Allpay dashboard — and demo mode keeps working with no
 * environment at all. Callers must handle null rather than assume it away.
 */
export function getCheckoutProvider(): CheckoutProvider | null {
  if (cached) return cached;
  const creds = credentials();
  if (!creds) return null;
  cached = new AllpayProvider(creds);
  return cached;
}

export function isCheckoutConfigured(): boolean {
  return credentials() !== null;
}

/** Where Allpay reports outcomes. One endpoint for every payment. */
export function webhookUrl(): string {
  return `${siteConfig.url}/api/webhooks/allpay`;
}

/** Where the payer lands after Allpay is done with them. */
export function successUrl(locale: string, enrollmentId: string): string {
  return `${siteConfig.url}/${locale}/enroll/${enrollmentId}/success`;
}

/**
 * VAT rate sent to Allpay on each course line item, as a percentage.
 *
 * Zero by default: the school trades as עוסק פטור, so no VAT is charged
 * and the price on a course page is the final price. Nothing in the copy
 * mentions VAT, and nothing should.
 *
 * If the business ever registers as עוסק מורשה, this single variable is
 * what changes — set `ALLPAY_VAT_RATE=18` (or whatever the rate is by
 * then) and decide separately whether the displayed prices stay the same
 * and absorb it, or rise. That is an accountant's call, not a default's.
 */
export function vatRate(): number {
  const raw = process.env.ALLPAY_VAT_RATE?.trim();
  if (raw === undefined || raw === '') return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
}
