'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { Portal } from '@/components/ui/portal';
import { cn } from '@/lib/utils';

/**
 * Full-height navigation drawer.
 *
 * Motion follows the VM Robotics navbar the brief pointed at:
 *  - three background panels wipe in from the edge on a 0.1s stagger, so the
 *    surface arrives in layers rather than as one slab;
 *  - the trigger label is two stacked elements sliding on a shared axis, with
 *    an invisible copy of the wider word holding the button's width steady;
 *  - the hamburger's middle rule collapses horizontally while the outer two
 *    rotate into a cross;
 *  - each link's number and label rise out of an overflow-hidden box on a
 *    per-item stagger, and on hover the label slides up by exactly 1em into
 *    a text-shadow ghost of itself.
 *
 * Palette is ours, not the reference's: a pale-light flash, then moss, then the
 * deep the drawer finally rests on.
 *
 * Added on top of the reference: a focus trap, focus restore, aria wiring,
 * a portal (the header's backdrop-blur would otherwise trap the fixed
 * overlay inside it), and a reduced-motion path.
 */

const MAIN_EASE = [0.65, 0.01, 0.05, 0.99] as const;
const TEXT_EASE = [0.22, 1, 0.36, 1] as const;

/** Pale-light flash, then moss, then the forest the drawer rests on. */
const WIPE_PANELS = ['#C7BB74', '#3D6552', '#16281F'];

const navLinks = [
  { href: '/', num: '01', key: 'home' },
  { href: '/courses', num: '02', key: 'courses' },
  { href: '/about', num: '03', key: 'about' },
  { href: '/faq', num: '04', key: 'faq' },
  { href: '/contacts', num: '05', key: 'contacts' }
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

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [open]);

  const menuLabel = t('menu');
  const closeLabel = t('close');
  const widest = closeLabel.length > menuLabel.length ? closeLabel : menuLabel;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t('closeMenu') : t('menu')}
        className={cn(
          'group flex select-none items-center gap-3 rounded-btn border px-3 py-2 text-xs font-medium uppercase tracking-widest transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          open
            ? 'border-glow/60 bg-glow/10 text-glow'
            : 'border-border hover:border-glow/50 hover:text-glow'
        )}
      >
        {/* Two stacked labels sliding on one axis. The invisible copy of the
            wider word keeps the button from resizing as they swap. */}
        <span
          className="relative block overflow-hidden leading-none"
          style={{ height: '1em' }}
        >
          <span className="invisible block leading-none" aria-hidden>
            {widest}
          </span>
          <motion.span
            aria-hidden
            animate={{ y: open ? '-100%' : '0%' }}
            transition={{ duration: reduce ? 0 : 0.4, ease: TEXT_EASE }}
            className="absolute left-0 top-0 block leading-none"
          >
            {menuLabel}
          </motion.span>
          <motion.span
            aria-hidden
            animate={{ y: open ? '0%' : '100%' }}
            transition={{ duration: reduce ? 0 : 0.4, ease: TEXT_EASE }}
            className="absolute left-0 top-0 block leading-none"
          >
            {closeLabel}
          </motion.span>
        </span>

        {/* Three rules: the outer two rotate into a cross, the middle one
            collapses to the right. */}
        <span
          aria-hidden
          className="relative flex h-[13px] w-5 flex-col justify-between"
        >
          <motion.span
            className="block h-px origin-center bg-current"
            animate={open ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: MAIN_EASE }}
          />
          <motion.span
            className="block h-px bg-current"
            style={{ width: '70%', transformOrigin: 'right' }}
            animate={open ? { scaleX: 0, opacity: 0 } : { scaleX: 1, opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: MAIN_EASE }}
          />
          <motion.span
            className="block h-px origin-center bg-current"
            animate={open ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, ease: MAIN_EASE }}
          />
        </span>
      </button>

      <Portal>
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="nav-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: reduce ? 0 : 0.45, ease: 'easeIn' }
                }}
                transition={{ duration: reduce ? 0 : 0.5, ease: MAIN_EASE }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[41] bg-forest/70"
              />

              {/* Staggered wipe: the surface arrives in three layers. */}
              {(reduce ? WIPE_PANELS.slice(-1) : WIPE_PANELS).map((color, i) => (
                <motion.div
                  key={`wipe-${i}`}
                  aria-hidden
                  initial={{ x: reduce ? 0 : '101%' }}
                  animate={{ x: 0 }}
                  exit={{
                    x: reduce ? 0 : '101%',
                    transition: {
                      duration: reduce ? 0 : 0.52,
                      delay: reduce ? 0 : 0.14 + i * 0.1,
                      ease: MAIN_EASE
                    }
                  }}
                  transition={{
                    duration: reduce ? 0 : 0.6,
                    delay: reduce ? 0 : i * 0.1,
                    ease: MAIN_EASE
                  }}
                  className="fixed bottom-0 right-0 top-0 z-[42] w-full rounded-l-2xl sm:w-[32em]"
                  style={{ backgroundColor: color }}
                />
              ))}

              <motion.div
                key="nav-inner"
                id={panelId}
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('menu')}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: reduce ? 0 : 0.12, ease: 'easeIn' }
                }}
                transition={{ duration: reduce ? 0 : 0.15, ease: 'easeOut' }}
                className="pointer-events-none fixed bottom-0 right-0 top-0 z-[43] flex w-full flex-col justify-between overflow-y-auto px-8 pb-8 pt-24 sm:w-[32em] sm:px-12"
              >
                <nav className="pointer-events-auto" aria-label={t('menu')}>
                  <ul>
                    {navLinks.map((link, i) => {
                      const isActive =
                        link.href === '/'
                          ? pathname === '/'
                          : pathname.startsWith(link.href);
                      const delay = reduce ? 0 : 0.28 + i * 0.055;
                      return (
                        <li
                          key={link.href}
                          className="overflow-hidden border-b border-paper/10"
                        >
                          <Link
                            href={link.href}
                            onClick={() => setOpen(false)}
                            aria-current={isActive ? 'page' : undefined}
                            className="group relative flex items-baseline gap-4 py-4 focus-visible:outline-none md:py-5"
                          >
                            {/* Hover wash, growing from the bottom edge. */}
                            <span
                              aria-hidden
                              className="absolute inset-0 origin-bottom scale-y-0 bg-paper/[0.06] transition-transform duration-[550ms] ease-[cubic-bezier(.65,.05,0,1)] group-hover:scale-y-100 group-focus-visible:scale-y-100"
                            />

                            <span className="relative z-10 block shrink-0 overflow-hidden">
                              <motion.span
                                initial={{ y: '100%' }}
                                animate={{ y: '0%' }}
                                transition={{
                                  duration: reduce ? 0 : 0.55,
                                  delay,
                                  ease: 'linear'
                                }}
                                className="block font-sans text-xs tabular-nums tracking-wider text-glow"
                              >
                                {link.num}
                              </motion.span>
                            </span>

                            <span className="relative z-10 block overflow-hidden">
                              <motion.span
                                initial={{ y: '100%' }}
                                animate={{ y: '0%' }}
                                transition={{
                                  duration: reduce ? 0 : 0.55,
                                  delay,
                                  ease: 'linear'
                                }}
                                className={cn(
                                  'block font-display text-3xl font-semibold tracking-tight transition-transform duration-[550ms] ease-[cubic-bezier(.65,.05,0,1)] group-hover:-translate-y-[1em] group-focus-visible:-translate-y-[1em] md:text-4xl',
                                  isActive ? 'text-glow' : 'text-paper'
                                )}
                                style={{
                                  textShadow: '0px 1em 0px rgba(200,146,42,0.35)'
                                }}
                              >
                                {t(link.key)}
                              </motion.span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="pointer-events-auto space-y-4 pt-10">
                  <div className="h-px bg-paper/10" />
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduce ? 0 : 0.45,
                      delay: reduce ? 0 : 0.56,
                      ease: TEXT_EASE
                    }}
                  >
                    <Link
                      href="/courses"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-center rounded-btn bg-glow px-4 py-3 text-sm font-semibold text-forest transition-all duration-300 hover:bg-glow hover:shadow-[0_0_20px_rgba(200,146,42,0.3)]"
                    >
                      {t('explore')}
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}
