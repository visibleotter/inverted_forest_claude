'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { getData } from './data';
import { clientIpFrom, maskEmail, rateLimit } from './security';
import type { Locale } from './types';
import { seatsRemaining } from './types';

const registrationSchema = z.object({
  groupId: z.string().min(1).max(64),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: z.string().trim().max(320).email(),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  locale: z.enum(['ru', 'en'])
});

export type RegistrationState =
  | { status: 'idle' }
  | {
      status: 'error';
      code: 'validation' | 'group_full' | 'rate_limited' | 'unknown';
    }
  | { status: 'success'; paymentUrl: string | null; enrollmentId: string };

/**
 * Registration flow: validate → persist enrollment → notify the
 * Make.com pipeline → hand the payment URL back to the client for redirect.
 * The site never processes payments itself.
 */
export async function submitRegistration(
  _prev: RegistrationState,
  formData: FormData
): Promise<RegistrationState> {
  // Honeypot: a hidden field real users never see. Bots fill every input,
  // so anything here means automation. Answer as a plain validation error
  // rather than revealing that the trap exists.
  if (String(formData.get('website') ?? '') !== '') {
    return { status: 'error', code: 'validation' };
  }

  const ip = clientIpFrom(headers());
  const limit = rateLimit(`register:${ip}`, 5, 10 * 60_000);
  if (!limit.allowed) return { status: 'error', code: 'rate_limited' };

  const parsed = registrationSchema.safeParse({
    groupId: formData.get('groupId'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    locale: formData.get('locale')
  });

  if (!parsed.success) return { status: 'error', code: 'validation' };
  const input = parsed.data;

  try {
    const data = getData();
    const group = await data.getGroupById(input.groupId);
    if (!group) return { status: 'error', code: 'unknown' };
    if (group.status !== 'enrolling' || seatsRemaining(group) === 0) {
      return { status: 'error', code: 'group_full' };
    }

    const result = await data.createRegistration({
      groupId: input.groupId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone || undefined,
      locale: input.locale as Locale
    });

    // The automation pipeline needs the real contact details — that is the
    // point of the integration — but our own logs only ever see masked data.
    await notifyMake('registration.created', {
      enrollment_id: result.enrollmentId,
      group_id: group.id,
      course_id: group.courseId,
      first_name: input.firstName,
      last_name: input.lastName,
      email: input.email,
      phone: input.phone || null,
      locale: input.locale
    });

    return {
      status: 'success',
      paymentUrl: result.paymentUrl,
      enrollmentId: result.enrollmentId
    };
  } catch (error) {
    console.error(
      `[registration] failed for ${maskEmail(input.email)} on ${input.groupId}`,
      error
    );
    return { status: 'error', code: 'unknown' };
  }
}

const newsletterSchema = z.object({
  email: z.string().trim().max(320).email(),
  locale: z.enum(['ru', 'en'])
});

export async function subscribeNewsletter(
  _prev: { status: 'idle' | 'success' | 'error' | 'rate_limited' },
  formData: FormData
): Promise<{ status: 'idle' | 'success' | 'error' | 'rate_limited' }> {
  if (String(formData.get('website') ?? '') !== '') {
    return { status: 'error' };
  }

  const ip = clientIpFrom(headers());
  const limit = rateLimit(`newsletter:${ip}`, 5, 10 * 60_000);
  if (!limit.allowed) return { status: 'rate_limited' };

  const parsed = newsletterSchema.safeParse({
    email: formData.get('email'),
    locale: formData.get('locale')
  });
  if (!parsed.success) return { status: 'error' };

  try {
    await getData().subscribeToNewsletter(
      parsed.data.email,
      parsed.data.locale
    );
    await notifyMake('newsletter.subscribed', parsed.data);
    return { status: 'success' };
  } catch (error) {
    console.error(
      `[newsletter] failed for ${maskEmail(parsed.data.email)}`,
      error
    );
    return { status: 'error' };
  }
}

/** Fire-and-forget notification into the existing Make.com automation. */
async function notifyMake(event: string, payload: Record<string, unknown>) {
  const url = process.env.MAKE_REGISTRATION_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, ...payload }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    console.error(`[make] webhook failed for ${event}`, error);
  }
}
