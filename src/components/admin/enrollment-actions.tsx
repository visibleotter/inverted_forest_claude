'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import {
  adminCancelSubscription,
  adminGrantAccess,
  adminResendInvite,
  adminRevokeAccess,
  type ActionResult
} from '@/lib/admin-actions';
import { cn } from '@/lib/utils';

type Action = 'grant' | 'resend' | 'revoke' | 'cancel';

interface Props {
  enrollmentId: string;
  telegramAccessStatus: string;
  plan: string;
  subscriptionCancellable: boolean;
}

/**
 * The four things an admin actually does to an enrollment.
 *
 * Revoking access and cancelling a subscription both ask first: one takes
 * a student out of their group, the other stops money arriving, and
 * neither is undone by clicking again.
 */
export function EnrollmentActions({
  enrollmentId,
  telegramAccessStatus,
  plan,
  subscriptionCancellable
}: Props) {
  const t = useTranslations('admin.actions');
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<Action | null>(null);
  const [result, setResult] = useState<ActionResult | null>(null);

  const hasInvite = telegramAccessStatus !== 'not_granted';

  function run(action: Action, confirmKey?: string) {
    if (confirmKey && !window.confirm(t(confirmKey as 'confirmRevoke'))) return;
    setRunning(action);
    setResult(null);

    startTransition(async () => {
      const outcome =
        action === 'grant'
          ? await adminGrantAccess(enrollmentId)
          : action === 'resend'
            ? await adminResendInvite(enrollmentId)
            : action === 'revoke'
              ? await adminRevokeAccess(enrollmentId)
              : await adminCancelSubscription(enrollmentId);
      setResult(outcome);
      setRunning(null);
    });
  }

  const button =
    'rounded-btn border border-border px-2.5 py-1 text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50';

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() => run(hasInvite ? 'resend' : 'grant')}
        >
          {running === 'grant' || running === 'resend' ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          ) : hasInvite ? (
            t('resend')
          ) : (
            t('grant')
          )}
        </button>

        {telegramAccessStatus !== 'removed' && (
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() => run('revoke', 'confirmRevoke')}
          >
            {running === 'revoke' ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              t('revoke')
            )}
          </button>
        )}

        {plan === 'monthly' && subscriptionCancellable && (
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() => run('cancel', 'confirmCancel')}
          >
            {running === 'cancel' ? (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            ) : (
              t('cancelSubscription')
            )}
          </button>
        )}
      </div>

      {result && (
        <p
          role="status"
          className={cn(
            'text-xs',
            // red-500 matches the form errors already in the project; it is
            // the one colour outside the palette this codebase uses, and
            // adding a second shade of it would be worse than reusing it.
            result.ok ? 'text-moss' : 'text-red-500'
          )}
        >
          {result.ok
            ? t('done')
            : result.error === 'demo_mode'
              ? t('demoMode')
              : result.error}
        </p>
      )}
    </div>
  );
}
