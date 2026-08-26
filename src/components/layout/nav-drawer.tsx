'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { Portal } from '@/components/ui/portal';
import { cn } from '@/lib/utils';

/**
 * Full-height navigation drawer with a MENU/CLOSE text-roll trigger.
 *
 * Used at every breakpoint rather than only on mobile, so the header stays
 * to logo + controls + trigger. Nav items are numbered to give the short
 * list some structure at large type.
 */

const items = [
  { href: '/', key: 'home' },
  { href: '/courses', key: 'courses' },
  { href: '/teachers', key: 'teachers' },
  { href: '/about', key: 'about' },
  { href: '/faq', key: 'faq' },
  { href: '/contacts', key: 'contacts' }
] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function NavDrawer() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const id = useId();
  const panelId = `nav-drawer-${id}`;

  // Close on route change so a link tap doesn't leave the drawer hanging.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
        ).filter((el) => el.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0]!;
        const last = focusable[focusable.length - 1]!;
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
      triggerRef.current?.focus();
    };
  }, [open]);

  const label = open ? t('close') : t('menu');

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t('closeMenu') : t('menu')}
        className="group flex items-center gap-2.5 rounded-btn border border-border px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors hover:border-amber hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {/* Text roll: an invisible copy of the longer word reserves the width
            so the button never changes size as the label swaps. */}
        <span className="relative block overflow-hidden leading-none">
          <span className="invisible block leading-none" aria-hidden>
            {t('close').length > t('menu').length ? t('close') : t('menu')}
          </span>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={label}
              initial={reduce ? false : { y: '100%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              exit={reduce ? { opacity: 0 } : { y: '-100%', opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.28, ease: 'easeOut' }}
              className="absolute inset-x-0 top-0 block leading-none"
            >
              {label}
            </motion.span>
          </AnimatePresence>
        </span>

        <span
          aria-hidden
          className="relative flex h-3 w-4 flex-col justify-between"
        >
          <motion.span
            animate={
              reduce ? undefined : { rotate: open ? 45 : 0, y: open ? 5 : 0 }
            }
            transition={{ duration: reduce ? 0 : 0.28 }}
            className="block h-px w-full bg-current"
          />
          <motion.span
            animate={reduce ? undefined : { opacity: open ? 0 : 1 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="block h-px w-full bg-current"
          />
          <motion.span
            animate={
              reduce ? undefined : { rotate: open ? -45 : 0, y: open ? -5 : 0 }
            }
            transition={{ duration: reduce ? 0 : 0.28 }}
            className="block h-px w-full bg-current"
          />
        </span>
      </button>

      <Portal>
        <AnimatePresence>
          {open && (
            <motion.div
              key={`backdrop-${id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.3 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-navy-deep/70 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              key={`drawer-${id}`}
              id={panelId}
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={t('menu')}
              initial={reduce ? { opacity: 0 } : { x: '100%' }}
              animate={reduce ? { opacity: 1 } : { x: 0 }}
              exit={reduce ? { opacity: 0 } : { x: '100%' }}
              transition={{ duration: reduce ? 0 : 0.42, ease: [0.4, 0, 0.2, 1] }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full flex-col justify-between overflow-y-auto bg-navy px-8 pb-8 pt-24 text-cream dark:bg-navy-deep sm:w-[26rem] sm:px-12"
            >
              <nav aria-label={t('menu')}>
                <ul className="space-y-1">
                  {items.map((item, i) => {
                    const isActive =
                      item.href === '/'
                        ? pathname === '/'
                        : pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={isActive ? 'page' : undefined}
                          className="group flex items-baseline gap-4 py-2 focus-visible:outline-none"
                        >
                          <span className="font-sans text-xs tabular-nums text-amber/70">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span
                            className={cn(
                              'font-display text-2xl transition-transform duration-300 group-hover:translate-x-1.5 group-focus-visible:translate-x-1.5',
                              isActive ? 'text-amber' : 'text-cream/90'
                            )}
                          >
                            {t(item.key)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="pt-10">
                <Link
                  href="/courses"
                  onClick={() => setOpen(false)}
                  className={cn(
                    buttonVariants({ variant: 'accent', size: 'lg' }),
                    'w-full'
                  )}
                >
                  {t('explore')}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
