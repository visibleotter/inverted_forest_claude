'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '@/i18n/navigation';

/**
 * Confirm a save, then go back up a level.
 *
 * The first version of this held a timer inside the form: show a notice,
 * wait, then navigate. It worked most of the time, which was the problem.
 * Every save action calls `revalidatePath(..., 'layout')`, so when the
 * action resolves Next may re-render — and remount — the form. A timer
 * owned by a component that has just been remounted is a timer that never
 * fires, and whether that happened came down to timing. Hence "sometimes".
 *
 * So nothing is timed inside the form any more. Saving records a flag and
 * navigates immediately; the notice is displayed by a host that lives in
 * the admin layout, which survives the navigation and the remount both.
 */

const FLAG = 'admin:saved';
const EVENT = 'admin:saved';
const VISIBLE_MS = 2600;

/** Record that something was saved, wherever the page goes next. */
export function notifySaved(): void {
  try {
    window.sessionStorage.setItem(FLAG, String(Date.now()));
  } catch {
    // Private windows and blocked storage: the event below still fires,
    // so a save without navigation is still confirmed.
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Confirm, then return to the list.
 *
 * Navigation is immediate — the notice travels with it rather than
 * delaying it.
 */
export function useSavedRedirect(saved: boolean, backTo: string): void {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!saved || done) return;
    setDone(true);
    notifySaved();
    router.push(backTo);
    // The list is rendered on the server; without this it can come back
    // from cache still showing what was just changed.
    router.refresh();
  }, [saved, done, backTo, router]);
}

/** Confirm without going anywhere — for the editor that has no level above. */
export function useSavedNotice(saved: boolean): void {
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!saved || done) return;
    setDone(true);
    notifySaved();
  }, [saved, done]);
}

/**
 * Displays the notice. Mounted once, in the admin layout.
 *
 * Being in the layout is what makes it reliable: it is still there after
 * the form that triggered it has been replaced by the list.
 */
export function AdminToastHost() {
  const t = useTranslations('admin.actions');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const show = () => {
      setVisible(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), VISIBLE_MS);
    };

    const consume = () => {
      try {
        if (window.sessionStorage.getItem(FLAG)) {
          window.sessionStorage.removeItem(FLAG);
          show();
        }
      } catch {
        // Nothing to consume; the event path covers the same-page case.
      }
    };

    // Two ways in: arriving on a new page after a save, and a save that
    // stayed put.
    consume();
    window.addEventListener(EVENT, consume);

    return () => {
      window.removeEventListener(EVENT, consume);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-card border border-border bg-card px-4 py-3 text-sm font-medium shadow-lg"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15">
        <Check className="h-3.5 w-3.5 text-accent" aria-hidden />
      </span>
      {t('savedToast')}
    </div>
  );
}
