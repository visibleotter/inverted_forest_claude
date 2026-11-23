'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { adminRefund, type ActionResult } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';

/**
 * Refund one payment.
 *
 * Only the enrollment id is needed: the provider refunds against the order,
 * and the enrollment *is* the order. Nothing here writes the outcome — the
 * refund webhook does that, which is what keeps a refund taken in the
 * Allpay dashboard and one taken here from ending differently.
 */
export function PaymentActions({
  enrollmentId,
  refundable
}: {
  enrollmentId: string;
  refundable: boolean;
}) {
  const t = useTranslations('admin.actions');
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  if (!refundable) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={pending}
        className="rounded-btn border border-border px-2.5 py-1 text-xs transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        onClick={() => {
          if (!window.confirm(t('confirmRefund'))) return;
          setResult(null);
          startTransition(async () => {
            setResult(await adminRefund(enrollmentId));
          });
        }}
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
        ) : (
          t('refund')
        )}
      </button>

      {result && (
        <p
          role="status"
          className={cn('text-xs', result.ok ? 'text-moss' : 'text-red-500')}
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
