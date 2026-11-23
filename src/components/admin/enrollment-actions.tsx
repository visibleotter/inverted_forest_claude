'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import {
  adminCancelSubscription,
  adminGrantAccess,
  adminMoveGroup,
  adminRecordManualPayment,
  adminResendInvite,
  adminRevokeAccess,
  type ActionResult
} from '@/lib/admin-actions';
import { cn } from '@/lib/utils';

type Panel = 'move' | 'manual' | null;

interface Props {
  enrollmentId: string;
  telegramAccessStatus: string;
  plan: string;
  subscriptionCancellable: boolean;
  /** Other slots of the same course; a move anywhere else is a refund. */
  moveTargets: { id: string; label: string }[];
  defaultAmount: number;
  currency: string;
}

/**
 * Everything an admin does to one enrollment.
 *
 * Two of these open a small panel rather than firing immediately, because
 * they need a value: which slot to move to, and how much arrived by Bit.
 * The destructive pair — revoking access and cancelling a subscription —
 * ask first; neither is undone by clicking again.
 */
export function EnrollmentActions({
  enrollmentId,
  telegramAccessStatus,
  plan,
  subscriptionCancellable,
  moveTargets,
  defaultAmount,
  currency
}: Props) {
  const t = useTranslations('admin.actions');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [target, setTarget] = useState(moveTargets[0]?.id ?? '');
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reference, setReference] = useState('');

  const hasInvite = telegramAccessStatus !== 'not_granted';

  function run(action: () => Promise<ActionResult>, confirmKey?: string) {
    if (confirmKey && !window.confirm(t(confirmKey as 'confirmRevoke'))) return;
    setResult(null);
    startTransition(async () => {
      setResult(await action());
      setPanel(null);
    });
  }

  const button =
    'rounded-btn border border-border px-2.5 py-1 text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50';
  const input =
    'w-full rounded-btn border border-border bg-background px-2 py-1 text-xs';

  return (
    <div className="flex min-w-[200px] flex-col gap-1.5">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() =>
            run(() =>
              hasInvite
                ? adminResendInvite(enrollmentId)
                : adminGrantAccess(enrollmentId)
            )
          }
        >
          {pending ? (
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
            onClick={() =>
              run(() => adminRevokeAccess(enrollmentId), 'confirmRevoke')
            }
          >
            {t('revoke')}
          </button>
        )}

        {moveTargets.length > 0 && (
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() => setPanel(panel === 'move' ? null : 'move')}
          >
            {t('moveGroup')}
          </button>
        )}

        <button
          type="button"
          className={button}
          disabled={pending}
          onClick={() => setPanel(panel === 'manual' ? null : 'manual')}
        >
          {t('manualPayment')}
        </button>

        {plan === 'monthly' && subscriptionCancellable && (
          <button
            type="button"
            className={button}
            disabled={pending}
            onClick={() =>
              run(
                () => adminCancelSubscription(enrollmentId),
                'confirmCancel'
              )
            }
          >
            {t('cancelSubscription')}
          </button>
        )}
      </div>

      {panel === 'move' && (
        <div className="rounded-btn border border-border p-2">
          <label className="mb-1 block text-xs text-muted-foreground">
            {t('movePrompt')}
          </label>
          <select
            className={input}
            value={target}
            onChange={(event) => setTarget(event.target.value)}
          >
            {moveTargets.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={cn(button, 'mt-2 w-full')}
            disabled={pending || !target}
            onClick={() => run(() => adminMoveGroup(enrollmentId, target))}
          >
            {t('confirm')}
          </button>
        </div>
      )}

      {panel === 'manual' && (
        <div className="space-y-2 rounded-btn border border-border p-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t('manualAmount')} ({currency})
            </label>
            <input
              className={input}
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              {t('manualReference')}
            </label>
            <input
              className={input}
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="bit 2026-09-01"
            />
          </div>
          <button
            type="button"
            className={cn(button, 'w-full')}
            disabled={pending || !reference.trim() || !Number(amount)}
            onClick={() =>
              run(() =>
                adminRecordManualPayment({
                  enrollmentId,
                  amount: Number(amount),
                  currency,
                  reference: reference.trim()
                })
              )
            }
          >
            {t('confirm')}
          </button>
        </div>
      )}

      {result && (
        <p
          role="status"
          className={cn(
            'text-xs',
            // red-500 matches the form errors already in the project; it is
            // the one colour outside the palette this codebase uses.
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
