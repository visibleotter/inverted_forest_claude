'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';
import {
  ACCEPT_ALL,
  DENY_ALL,
  isBannerRequired,
  OPEN_COOKIE_SETTINGS_EVENT,
  OPTIONAL_CATEGORIES,
  readConsent,
  writeConsent,
  type ConsentChoices
} from '@/lib/consent';
import { cn } from '@/lib/utils';

/**
 * Cookie consent banner and preferences panel.
 *
 * Choices here are deliberately symmetrical: rejecting is one click, exactly
 * like accepting, and every optional category starts off. A banner where
 * "accept" is easy and "reject" is buried does not collect valid consent.
 *
 * The banner does not trap focus — nothing non-essential is set before a
 * choice is made, so blocking the page would be hostile for no benefit. The
 * preferences panel, which is a genuine modal, does trap focus.
 */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function CookieConsent() {
  const t = useTranslations('cookies');
  const reduce = useReducedMotion();

  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [draft, setDraft] = useState<ConsentChoices>(DENY_ALL);

  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Read the cookie only after mount; the server cannot know it, and
  // rendering the banner during SSR would mismatch on hydration.
  useEffect(() => {
    setMounted(true);
    const existing = readConsent();
    if (existing) {
      setDraft(existing.choices);
    } else if (isBannerRequired()) {
      // Nothing optional is loaded yet, so there is nothing to interrupt
      // anyone for. The panel stays reachable from the footer regardless.
      setBannerOpen(true);
    }
  }, []);

  const openPanel = useCallback(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setDraft(readConsent()?.choices ?? DENY_ALL);
    setPanelOpen(true);
  }, []);

  // Footer "Manage cookies" reopens the panel.
  useEffect(() => {
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPanel);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openPanel);
  }, [openPanel]);

  // Modal behaviour for the panel only.
  useEffect(() => {
    if (!panelOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPanelOpen(false);
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const items = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((el) => el.offsetParent !== null);
        if (items.length === 0) return;
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus();
    };
  }, [panelOpen]);

  function commit(choices: ConsentChoices) {
    writeConsent(choices);
    setDraft(choices);
    setBannerOpen(false);
    setPanelOpen(false);
  }

  if (!mounted) return null;

  const transition = { duration: reduce ? 0 : 0.4, ease: 'easeOut' as const };

  return (
    <Portal>
      {/* ── Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {bannerOpen && !panelOpen && (
          <motion.div
            key="cookie-banner"
            role="dialog"
            aria-label={t('title')}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            transition={transition}
            className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:p-6"
          >
            <div className="container-content flex max-w-3xl flex-col gap-4 rounded-card border border-border bg-card p-5 shadow-2xl sm:p-6">
              <div>
                <h2 className="font-sans text-base font-semibold">
                  {t('title')}
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t('body')}{' '}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {t('privacyLink')}
                  </Link>
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="accent" onClick={() => commit(ACCEPT_ALL)}>
                  {t('acceptAll')}
                </Button>
                {/* Same weight as accept — rejecting must not be harder. */}
                <Button variant="outline" onClick={() => commit(DENY_ALL)}>
                  {t('rejectAll')}
                </Button>
                <Button variant="ghost" onClick={openPanel}>
                  {t('customise')}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Preferences panel ──────────────────────────────────── */}
      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              key="cookie-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              onClick={() => setPanelOpen(false)}
              className="fixed inset-0 z-[60] bg-deep/70 backdrop-blur-sm"
            />
            <motion.div
              key="cookie-panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="cookie-panel-title"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
              transition={transition}
              className="fixed inset-0 z-[61] m-auto flex h-fit max-h-[88vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-y-auto rounded-card border border-border bg-card p-6 shadow-2xl sm:p-8"
            >
              <h2
                id="cookie-panel-title"
                className="font-display text-2xl font-semibold"
              >
                {t('panelTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t('panelBody')}
              </p>
              {!isBannerRequired() && (
                <p className="mt-3 rounded-btn bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
                  {t('noOptionalInUse')}
                </p>
              )}

              <ul className="mt-6 space-y-4">
                <li className="rounded-btn border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {t('categories.essentials.name')}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('categories.essentials.desc')}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      {t('alwaysOn')}
                    </span>
                  </div>
                </li>

                {OPTIONAL_CATEGORIES.map((category) => (
                  <li
                    key={category}
                    className="rounded-btn border border-border p-4"
                  >
                    <label className="flex cursor-pointer items-start justify-between gap-4">
                      <span>
                        <span className="block text-sm font-semibold">
                          {t(`categories.${category}.name`)}
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {t(`categories.${category}.desc`)}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={draft[category]}
                        onChange={(event) =>
                          setDraft((prev) => ({
                            ...prev,
                            [category]: event.target.checked
                          }))
                        }
                        className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-[#31708E]"
                      />
                    </label>
                  </li>
                ))}
              </ul>

              <div
                className={cn(
                  'mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end'
                )}
              >
                <Button variant="outline" onClick={() => commit(DENY_ALL)}>
                  {t('rejectAll')}
                </Button>
                <Button variant="accent" onClick={() => commit(draft)}>
                  {t('save')}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </Portal>
  );
}
