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
  const webhookSecret = process.env.ALLPAY_WEBHOOK_SECRET?.trim();
  if (!login || !apiKey || !webhookSecret) return null;
  return { login, apiKey, webhookSecret };
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
 * VAT rate applied to course line items, as a percentage.
 *
 * Set `ALLPAY_VAT_RATE=0` for a business not registered to charge VAT
 * (עוסק פטור). The default follows the Israeli standard rate, but the
 * correct value is a question for the accountant, not a default worth
 * trusting — it also decides whether the price shown on a course page is
 * VAT-inclusive.
 */
export function vatRate(): number {
  const raw = process.env.ALLPAY_VAT_RATE?.trim();
  if (raw === undefined || raw === '') return 18;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 18;
}
