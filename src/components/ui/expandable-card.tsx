'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Portal } from './portal';

/**
 * Expandable card — a collapsed preview that morphs into a modal panel via
 * a framer-motion shared layout transition.
 *
 * Adapted from the supplied source. Changes, and why:
 *  - Palette: hardcoded zinc/black/white replaced with the project's semantic
 *    tokens, so it follows light/dark and the brand rather than fighting them.
 *  - The collapsed card carried `role="dialog"` + `aria-modal` while being a
 *    trigger, and pointed `aria-labelledby` at an id that never existed. It is
 *    now a real <button>, so it is keyboard reachable; the dialog roles live on
 *    the expanded panel where they belong, labelled by the actual title node.
 *  - Focus is moved into the panel on open and restored to the trigger on
 *    close, Tab is trapped inside the panel, and body scroll is locked.
 *  - Listeners attach only while open instead of for the page's lifetime.
 *  - next/image instead of <img>, and prefers-reduced-motion is honoured.
 *  - AnimatePresence's direct child is a keyed motion component. A plain
 *    unkeyed div cannot have its removal managed, which is how the original
 *    was written.
 *  - The full-screen wrapper and backdrop are pointer-events-none, with the
 *    panel opting back in. If an exit animation is ever left unfinished (it
 *    is driven by requestAnimationFrame, which browsers pause in hidden
 *    tabs), the leftover wrapper is inert instead of an invisible sheet
 *    swallowing every click on the page.
 */

interface ExpandableCardProps {
  title: string;
  src: string;
  /** Small kicker above the title — e.g. a category. */
  eyebrow?: string;
  /** One-sentence summary shown on the collapsed card. */
  summary?: string;
  /** Expanded-panel body. */
  children?: React.ReactNode;
  className?: string;
  classNameExpanded?: string;
  openLabel?: string;
  closeLabel?: string;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function ExpandableCard({
  title,
  src,
  eyebrow,
  summary,
  children,
  className,
  classNameExpanded,
  openLabel = 'Open',
  closeLabel = 'Close'
}: ExpandableCardProps) {
  const [active, setActive] = React.useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const id = React.useId();
  const titleId = `expandable-title-${id}`;

  React.useEffect(() => {
    if (!active) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(false);
        return;
      }
      // Keep Tab inside the panel while it behaves as a modal.
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

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setActive(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [active]);

  const transition = { duration: reduce ? 0 : 0.35, ease: 'easeOut' as const };
  // Shared-layout ids drive the morph between collapsed card and panel.
  const layout = (name: string) => (reduce ? undefined : `${name}-${id}`);

  return (
    <>
      <Portal>
        <AnimatePresence>
          {active && (
            <motion.div
              key={`backdrop-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transition}
              className="pointer-events-none fixed inset-0 z-40 bg-forest/60 backdrop-blur-md"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {active && (
            <motion.div
              key={`panel-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
              className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4 sm:p-6"
            >
              <motion.div
                ref={panelRef}
                layoutId={layout('card')}
                transition={transition}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                  'pointer-events-auto relative flex max-h-[88vh] w-full max-w-[850px] flex-col overflow-y-auto rounded-card border border-border bg-card text-card-foreground shadow-2xl',
                  classNameExpanded
                )}
              >
                <motion.div
                  layoutId={layout('image')}
                  transition={transition}
                  className="relative h-64 w-full shrink-0 sm:h-80"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="850px"
                    className="object-cover object-center"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card to-transparent" />
                </motion.div>

                <div className="flex items-start justify-between gap-4 p-6 sm:p-8">
                  <div>
                    {eyebrow && (
                      <motion.p
                        layoutId={layout('eyebrow')}
                        transition={transition}
                        className="text-sm font-semibold uppercase tracking-widest text-accent"
                      >
                        {eyebrow}
                      </motion.p>
                    )}
                    <motion.h3
                      id={titleId}
                      layoutId={layout('title')}
                      transition={transition}
                      className="mt-1 font-display text-3xl font-semibold sm:text-4xl"
                    >
                      {title}
                    </motion.h3>
                  </div>

                  <motion.button
                    ref={closeRef}
                    type="button"
                    aria-label={closeLabel}
                    layoutId={layout('button')}
                    transition={transition}
                    onClick={() => setActive(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="flex rotate-45">
                      <Plus className="h-5 w-5" aria-hidden />
                    </span>
                  </motion.button>
                </div>

                <div className="px-6 pb-8 sm:px-8">{children}</div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>

      <motion.button
        ref={triggerRef}
        type="button"
        layoutId={layout('card')}
        transition={transition}
        onClick={() => setActive(true)}
        aria-expanded={active}
        aria-label={`${openLabel}: ${title}`}
        className={cn(
          'group flex w-full flex-col gap-4 rounded-card border border-border bg-card p-3 text-left text-card-foreground shadow-sm transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className
        )}
      >
        <motion.div
          layoutId={layout('image')}
          transition={transition}
          className="relative h-40 w-full overflow-hidden rounded-lg"
        >
          <Image
            src={src}
            alt=""
            fill
            sizes="280px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          />
        </motion.div>

        <div className="flex items-start justify-between gap-3 px-1 pb-1">
          <div className="min-w-0">
            {eyebrow && (
              <motion.p
                layoutId={layout('eyebrow')}
                transition={transition}
                className="text-xs font-semibold uppercase tracking-widest text-accent"
              >
                {eyebrow}
              </motion.p>
            )}
            <motion.h3
              layoutId={layout('title')}
              transition={transition}
              className="mt-0.5 font-sans font-semibold"
            >
              {title}
            </motion.h3>
            {summary && (
              <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                {summary}
              </p>
            )}
          </div>

          <motion.span
            layoutId={layout('button')}
            transition={transition}
            aria-hidden
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors group-hover:border-accent group-hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </motion.span>
        </div>
      </motion.button>
    </>
  );
}
