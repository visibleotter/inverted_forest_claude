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
 * clipped window as the page scrolls, while the image settles from
 * oversized to natural scale. Once the image has fully opened, the copy
 * rises into it — so the first screen reads as one continuous gesture,
 * and only after the text has arrived does the page scroll on.
 *
 * Adapted from the supplied source:
 *  - `bg-black` became `bg-forest` to stay in the palette.
 *  - A `children` slot: the original renders background only, and this
 *    hero has to carry the eyebrow, headline, subtitle and button.
 *  - The copy is scroll-driven rather than revealed on mount, and is
 *    inert while invisible so its links cannot be tabbed to or clicked
 *    before they appear.
 *  - A veil sits under the copy for contrast. It is deliberately light:
 *    a heavy scrim hides the artwork, which makes the reveal invisible —
 *    a dark rectangle widening against a dark page.
 *  - prefers-reduced-motion shows the final state at once and collapses
 *    the section to one screen, instead of demanding a long scroll to
 *    reach the content.
 */

interface SmoothScrollHeroProps {
  /** Scroll distance over which the image reveal completes, in pixels. */
  scrollHeight?: number;
  desktopImage: string;
  mobileImage?: string;
  initialClipPercentage?: number;
  finalClipPercentage?: number;
  children?: React.ReactNode;
  className?: string;
}

export function SmoothScrollHero({
  scrollHeight = 1200,
  desktopImage,
  mobileImage,
  initialClipPercentage = 25,
  finalClipPercentage = 75,
  children,
  className
}: SmoothScrollHeroProps) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  /*
   * The first screen is one gesture in three phases, all inside the sticky
   * section's own scroll budget:
   *   0 .. 0.60   the image opens out of its clipped window
   *   0.62 .. 0.85 the copy rises into the opened image
   *   0.85 .. 1    it simply rests, so the reader arrives at a finished
   *                frame before the page moves on
   * Everything must finish before 1.0 — that is where the sticky releases
   * and the hero starts scrolling away.
   */
  const imageDone = scrollHeight * 0.6;
  const copyFrom = scrollHeight * 0.62;
  const copyTo = scrollHeight * 0.85;

  const clipStart = useTransform(
    scrollY,
    [0, imageDone],
    [initialClipPercentage, 0]
  );
  const clipEnd = useTransform(
    scrollY,
    [0, imageDone],
    [finalClipPercentage, 100]
  );
  const clipPath = useMotionTemplate`polygon(${clipStart}% ${clipStart}%, ${clipEnd}% ${clipStart}%, ${clipEnd}% ${clipEnd}%, ${clipStart}% ${clipEnd}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, imageDone],
    ['170%', '100%']
  );

  const contentOpacity = useTransform(scrollY, [copyFrom, copyTo], [0, 1]);
  const contentY = useTransform(scrollY, [copyFrom, copyTo], [28, 0]);
  const contentBlur = useTransform(
    scrollY,
    [copyFrom, copyTo],
    ['blur(6px)', 'blur(0px)']
  );
  // Invisible copy must not be clickable or tabbable.
  const contentPointer = useTransform(scrollY, (v) =>
    v > copyFrom ? 'auto' : 'none'
  );
  const veilOpacity = useTransform(scrollY, [copyFrom, copyTo], [0, 1]);

  const mobile = mobileImage ?? desktopImage;

  return (
    <div
      className={cn('relative w-full', className)}
      style={{ height: reduce ? '100vh' : `calc(${scrollHeight}px + 100vh)` }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-forest">
        <motion.div
          className="absolute inset-0"
          style={reduce ? undefined : { clipPath, willChange: 'clip-path' }}
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

          {/* Veil, faded in with the copy — absent while the image opens. */}
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-forest/95 via-forest/60 to-forest/15"
            style={reduce ? undefined : { opacity: veilOpacity }}
          />
        </motion.div>

        {children && (
          <motion.div
            className="relative flex h-full items-center"
            style={
              reduce
                ? undefined
                : {
                    opacity: contentOpacity,
                    y: contentY,
                    filter: contentBlur,
                    pointerEvents: contentPointer
                  }
            }
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SmoothScrollHero;
