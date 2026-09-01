'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from '@/i18n/navigation';

/**
 * Confirm a save, then go back up a level.
 *
 * Editing forms used to leave you exactly where you were, with a small
 * line of text as the only sign anything had happened — so the honest
 * question after pressing Save was "did that work?". Now the answer
 * arrives as a notice you cannot miss, and then the page returns to the
 * list you came from, which is where the next thing you want to do is.
 *
 * The pause is deliberate: navigating instantly would take the
 * confirmation away with it.
 */

const HOLD_MS = 1100;

export function useSavedRedirect(saved: boolean, backTo: string) {
  const router = useRouter();
  const [showing, setShowing] = useState(false);

  useEffect(() => {
    if (!saved) return;
    setShowing(true);

    const timer = setTimeout(() => {
      router.push(backTo);
      // The list is rendered on the server; without this it can come back
      // from cache still showing what was just changed.
      router.refresh();
    }, HOLD_MS);

    return () => clearTimeout(timer);
  }, [saved, backTo, router]);

  return showing;
}

/**
 * The notice itself.
 *
 * Portalled to the body because these forms sit inside cards and sticky
 * footers, and an ancestor with a transform or a backdrop filter becomes
 * the containing block for anything fixed inside it — which is how a
 * "bottom right of the screen" toast ends up pinned to the middle of a
 * form instead.
 */
export function SavedToast({ show }: { show: boolean }) {
  const t = useTranslations('admin.actions');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted || !show) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-card border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
      </span>
      {t('savedToast')}
    </div>,
    document.body
  );
}
