'use client';

import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform
} from 'framer-motion';
import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Smooth-scroll hero: a sticky full-height image that widens out of a
 * clipped window as the page scrolls, while the image itself settles from
 * oversized to natural scale.
 *
 * Adapted from the supplied source:
 *  - `bg-black` replaced with `bg-night` so it sits in the palette.
 *  - A `children` slot, because the original renders background only and
 *    this hero has to carry the eyebrow, headline, subtitle and buttons.
 *  - A scrim behind that slot. The artwork is mid-tone and busy, so copy
 *    laid straight on it would fail contrast; the scrim guarantees a dark
 *    ground under the words while still letting the image read.
 *  - prefers-reduced-motion renders the final state immediately: no clip
 *    animation, no scale drift, and the page collapses to a normal-height
 *    hero rather than forcing a long scroll to reach the content.
 */

interface SmoothScrollHeroProps {
  /** Scroll distance over which the reveal completes, in pixels. */
  scrollHeight?: number;
  desktopImage: string;
  mobileImage?: string;
  /** Clip window at rest, as a percentage inset. */
  initialClipPercentage?: number;
  finalClipPercentage?: number;
  children?: React.ReactNode;
  className?: string;
}

export function SmoothScrollHero({
  scrollHeight = 1500,
  desktopImage,
  mobileImage,
  initialClipPercentage = 25,
  finalClipPercentage = 75,
  children,
  className
}: SmoothScrollHeroProps) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  const clipStart = useTransform(
    scrollY,
    [0, scrollHeight],
    [initialClipPercentage, 0]
  );
  const clipEnd = useTransform(
    scrollY,
    [0, scrollHeight],
    [finalClipPercentage, 100]
  );
  const clipPath = useMotionTemplate`polygon(${clipStart}% ${clipStart}%, ${clipEnd}% ${clipStart}%, ${clipEnd}% ${clipEnd}%, ${clipStart}% ${clipEnd}%)`;
  const backgroundSize = useTransform(
    scrollY,
    [0, scrollHeight + 500],
    ['170%', '100%']
  );

  const mobile = mobileImage ?? desktopImage;

  return (
    <div
      className={cn('relative w-full', className)}
      style={{
        height: reduce ? '100vh' : `calc(${scrollHeight}px + 100vh)`
      }}
    >
      <motion.div
        className="sticky top-0 h-screen w-full overflow-hidden bg-night"
        style={
          reduce
            ? undefined
            : { clipPath, willChange: 'transform, opacity' }
        }
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 md:hidden"
          style={{
            backgroundImage: `url(${mobile})`,
            backgroundSize: reduce ? 'cover' : backgroundSize,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />
        <motion.div
          aria-hidden
          className="absolute inset-0 hidden md:block"
          style={{
            backgroundImage: `url(${desktopImage})`,
            backgroundSize: reduce ? 'cover' : backgroundSize,
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Scrim — heavy where the copy sits, thinning across the frame. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-night via-night/85 to-night/45"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-night via-transparent to-night/60"
        />

        {children && (
          <div className="relative flex h-full items-center">{children}</div>
        )}
      </motion.div>
    </div>
  );
}

export default SmoothScrollHero;
