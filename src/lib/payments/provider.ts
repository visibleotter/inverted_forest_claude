import type { EnrollmentPlan, Locale } from '../types';

/**
 * Checkout contract.
 *
 * Named `CheckoutProvider` rather than `PaymentProvider` because that name
 * is already taken by the union of provider *names* in `types.ts`. One
 * concrete implementation exists (Allpay); a second could be added without
 * the enrollment flow noticing, which is the point.
 *
 * The site still never processes a payment. Everything here either builds
 * a URL to send the payer to, or asks the provider what it already did.
 */

export interface CheckoutLineItem {
  name: string;
  price: number;
  qty: number;
  /** VAT rate as a percentage. 0 for a business not charging VAT. */
  vat: number;
}

export interface CheckoutRequest {
  /** Our enrollment id. Comes back untouched in the webhook. */
  orderId: string;
  /** Immutable study group id, carried for the automation layer. */
  groupId: string;
  items: CheckoutLineItem[];
  currency: string;
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  locale: Locale;
  plan: EnrollmentPlan;
  /** Number of monthly charges. Ignored when `plan` is 'full'. */
  installments: number;
  /** Where the provider reports the outcome. Always our own endpoint. */
  webhookUrl: string;
  /** Where the payer lands afterwards. */
  successUrl: string;
  backlinkUrl?: string;
}

export interface CheckoutSession {
  paymentUrl: string;
  /** Present when the provider mints its own reference. */
  externalId?: string;
}

export interface ProviderPayment {
  /** Index within a subscription: 1 = first month. 1 for one-off payments. */
  periodIndex: number;
  amount: number;
  currency: string;
  paidAt: string | null;
  receiptUrl: string | null;
}

export interface ProviderPaymentStatus {
  /** Normalised: what the provider says about this order right now. */
  state: 'unpaid' | 'paid' | 'refunded' | 'partially_refunded';
  amount: number | null;
  currency: string | null;
}

export interface ProviderSubscriptionStatus {
  state: 'active' | 'completed' | 'error' | 'cancelled' | 'unknown';
  /** Charges the provider has actually taken, oldest first. */
  payments: ProviderPayment[];
  paidTotal: number;
}

export interface WebhookVerification {
  valid: boolean;
  /** Parsed payload; present even when invalid, for logging the rejection. */
  payload: Record<string, unknown>;
  orderId: string | null;
  /** Provider's own status code, normalised. */
  state: 'paid' | 'refunded' | 'partially_refunded' | 'other';
  amount: number | null;
  currency: string | null;
  clientEmail: string | null;
  receiptUrl: string | null;
  groupId: string | null;
}

export interface CheckoutProvider {
  readonly name: 'allpay';
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  getPaymentStatus(orderId: string): Promise<ProviderPaymentStatus>;
  getSubscriptionStatus(orderId: string): Promise<ProviderSubscriptionStatus>;
  cancelSubscription(orderId: string): Promise<void>;
  refund(orderId: string, amount?: number): Promise<void>;
  /**
   * Verify an inbound webhook against the raw request body. Takes the body
   * as text, never a re-serialised object — re-serialising changes the
   * bytes the signature was computed over.
   */
  verifyWebhook(rawBody: string, contentType: string): WebhookVerification;
}
