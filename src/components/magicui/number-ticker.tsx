'use client';

import {
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring
} from 'framer-motion';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  type ComponentPropsWithoutRef
} from 'react';
import { cn } from '@/lib/utils';

/** useLayoutEffect warns during SSR; fall back to useEffect on the server. */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Adapted from MagicUI's `number-ticker`.
 *
 * Changes: framer-motion imports; locale-aware formatting (the original
 * hardcodes en-US, which would print "1,234" on Russian pages instead of
 * "1 234"); optional currency; no hardcoded black/white text colour so it
 * inherits the design tokens; and it renders the final value immediately
 * under prefers-reduced-motion.
 */
interface NumberTickerProps extends ComponentPropsWithoutRef<'span'> {
  value: number;
  locale?: string;
  currency?: string;
  decimalPlaces?: number;
  delay?: number;
}

export function NumberTicker({
  value,
  locale = 'en-US',
  currency,
  decimalPlaces = 0,
  delay = 0,
  className,
  ...props
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const isInView = useInView(ref, { once: true, margin: '0px' });

  const format = (n: number) =>
    new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
      ...(currency ? { style: 'currency', currency } : {})
    }).format(n);

  // The server renders the real value so the page is correct without
  // JavaScript. Once hydrated, reset to zero before paint (no flash) and
  // let the spring count up.
  useIsomorphicLayoutEffect(() => {
    if (reduce || !ref.current) return;
    ref.current.textContent = format(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  useEffect(() => {
    if (reduce || !isInView) return;
    const timer = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(timer);
  }, [motionValue, isInView, delay, value, reduce]);

  useEffect(() => {
    if (reduce) return;
    return springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = format(Number(latest.toFixed(decimalPlaces)));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [springValue, decimalPlaces, locale, currency, reduce]);

  return (
    <span
      ref={ref}
      className={cn('inline-block tabular-nums', className)}
      suppressHydrationWarning
      {...props}
    >
      {format(value)}
    </span>
  );
}
