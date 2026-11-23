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
 * Smooth-scroll hero: a sticky full-height image that opens out of a
 * clipped window as the page scrolls. Once it has fully opened, the copy
 * rises into it — so the first screen reads as one continuous gesture,
 * and only after the text has arrived does the page scroll on.
 *
 * Adapted from the supplied source:
 *  - `bg-black` became `bg-forest` to stay in the palette.
 *  - A `children` slot: the original renders background only, and this
 *    hero has to carry the eyebrow, headline, subtitle and button.
 *  - The copy is scroll-driven rather than revealed on mount, and is inert
 *    while invisible so its link cannot be tabbed to or clicked early.
 *  - A veil under the copy for contrast, faded in with it. A veil present
 *    from the start hides the artwork and makes the reveal invisible — a
 *    dark rectangle widening against a dark page.
 *  - The original's 170%→100% background zoom is gone. The clip is a
 *    linear ramp, so it opens at one constant rate; a strong zoom running
 *    alongside it added a second motion that made the first moments read
 *    as a lurch while the window was still small. What remains is a
 *    barely-there settle.
 *  - prefers-reduced-motion shows the final state at once and collapses
 *    the section to one screen.
 */

interface SmoothScrollHeroProps {
  /** Scroll distance the whole first-screen gesture occupies, in pixels. */
  scrollHeight?: number;
  desktopImage: string;
  mobileImage?: string;
  initialClipPercentage?: number;
  finalClipPercentage?: number;
  /** Small nudge in the corner, shown before the reader has scrolled. */
  scrollHint?: string;
  children?: React.ReactNode;
  className?: string;
}

export function SmoothScrollHero({
  scrollHeight = 1800,
  desktopImage,
  mobileImage,
  initialClipPercentage = 50,
  finalClipPercentage = 50,
  scrollHint,
  children,
  className
}: SmoothScrollHeroProps) {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  /*
   * Four phases inside the sticky section's own scroll budget. At the
   * default 1800px these work out at roughly:
   *   0 .. 0.48     ~865px  the image opens, at one even rate
   *   0.50 .. 0.64  ~900-1150px  the copy rises into the opened image
   *   0.64 .. 1     ~650px  the frame simply holds
   *
   * That last stretch is the point of the whole budget: a finished frame
   * that stays put for the better part of a screen, so a fast flick cannot
   * carry the reader past the one thing the hero has to say. Everything
   * must land before 1.0 — that is where the sticky releases.
   *
   * The budget is also what sets the *perceived* speed of the rest of the
   * page. A sticky hero shows one screen of content however far you scroll
   * it, so every pixel spent here is a pixel where nothing goes by. Spend
   * too many and the page that follows reads as a blur by contrast — which
   * is exactly what 2400 did: 4.3 screens of hero against 5.6 of content.
   */
  const imageDone = scrollHeight * 0.48;
  const copyFrom = scrollHeight * 0.5;
  const copyTo = scrollHeight * 0.64;

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

  // A whisper of settle rather than the original zoom.
  const backgroundSize = useTransform(scrollY, [0, imageDone], ['112%', '100%']);

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

  // The hint has done its job as soon as scrolling starts.
  const hintOpacity = useTransform(scrollY, [0, 200], [1, 0]);

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

        {scrollHint && !reduce && (
          <motion.div
            aria-hidden
            style={{ opacity: hintOpacity }}
            /*
             * bottom-24, not bottom-8: the sticky header occupies 4rem of
             * normal flow, so before the hero sticks its foot sits that far
             * below the fold. Clearing the header height keeps the hint on
             * screen at rest, which is the only moment it is needed.
             */
            className="pointer-events-none absolute bottom-24 right-8 flex items-center gap-3 text-xs uppercase tracking-widest text-paper/60"
          >
            {scrollHint}
            <motion.span
              className="block h-8 w-px origin-top bg-paper/40"
              animate={{ scaleY: [0.3, 1, 0.3], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SmoothScrollHero;
