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
  /** Shown at the centre, where the image is about to open, until scrolling starts. */
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
  /*
   * The window the picture opens through: rounded corners from the clip,
   * and a soft edge from a mask — two crossed linear ramps, so the
   * painting dissolves into the dark ground instead of ending on a line.
   *
   * The feather is in pixels, the same on all four sides — a percentage
   * made the long edges of a phone soft and its short ones hard. It is a
   * quarter of the window's shorter side, up to 48px: a fixed width would
   * be wider than the window in the first moments and the ramps would
   * cross into a hard step. Everything is derived from scrollY alone, so
   * the four stops can never come from different frames.
   */
  const clipPath = useMotionTemplate`inset(${clipStart}% round 24px)`;
  const edgeMask = useTransform(scrollY, (v) => {
    const p = Math.min(1, Math.max(0, v / imageDone));
    const s = initialClipPercentage * (1 - p);
    const e = finalClipPercentage + (100 - finalClipPercentage) * p;
    const shorter =
      typeof window === 'undefined'
        ? 0
        : Math.min(window.innerWidth, window.innerHeight);
    const f = Math.min(48, (((e - s) / 100) * shorter) / 4);
    const ramp = (dir: string) =>
      `linear-gradient(to ${dir}, transparent ${s}%, #000 calc(${s}% + ${f}px), #000 calc(${e}% - ${f}px), transparent ${e}%)`;
    return `${ramp('right')}, ${ramp('bottom')}`;
  });

  /*
   * A whisper of settle rather than the original zoom. It is a scale over
   * a `cover` image, not a background-size: '100%' sizes the painting to
   * the frame's width only, so on a phone or any window taller than the
   * painting's 5:4 it stopped short of the bottom and ended on a hard
   * line above a band of plain forest.
   */
  const imageScale = useTransform(scrollY, [0, imageDone], [1.12, 1]);

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

  /*
   * The hint sits at the exact point the image opens from, wrapped in a
   * faint glow — the light on the water the palette is named after. It
   * melts while the window opens rather than vanishing at the first
   * pixel: fading, growing a little and blurring over the first half of
   * the opening, so the glow reads as becoming the picture.
   */
  const hintEnd = imageDone * 0.55;
  const hintOpacity = useTransform(scrollY, [0, hintEnd], [1, 0]);
  const hintScale = useTransform(scrollY, [0, hintEnd], [1, 1.12]);
  const hintBlur = useTransform(scrollY, [0, hintEnd], ['blur(0px)', 'blur(8px)']);

  const mobile = mobileImage ?? desktopImage;

  return (
    <>
      <div
        className={cn('relative w-full', className)}
        style={{ height: reduce ? '100vh' : `calc(${scrollHeight}px + 100vh)` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-forest">
          <motion.div
            className="absolute inset-0"
            style={
              reduce
                ? undefined
                : {
                    clipPath,
                    maskImage: edgeMask,
                    WebkitMaskImage: edgeMask,
                    // Visible only where both ramps are: the four soft edges.
                    maskComposite: 'intersect',
                    WebkitMaskComposite: 'source-in',
                    willChange: 'clip-path, mask-image'
                  }
            }
          >
            <motion.div
              aria-hidden
              className="absolute inset-0 md:hidden"
              style={{
                backgroundImage: `url(${mobile})`,
                backgroundSize: 'cover',
                scale: reduce ? 1 : imageScale,
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
              }}
            />
            <motion.div
              aria-hidden
              className="absolute inset-0 hidden md:block"
              style={{
                backgroundImage: `url(${desktopImage})`,
                backgroundSize: 'cover',
                scale: reduce ? 1 : imageScale,
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
              style={{ opacity: hintOpacity, scale: hintScale, filter: hintBlur }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <div className="relative flex flex-col items-center">
                {/* The glow: a soft ellipse of warm light that slowly breathes.
                    Centred through x/y rather than translate classes, which
                    the breathing scale would otherwise overwrite. */}
                <motion.span
                  className="absolute left-1/2 top-1/2 h-56 w-80 rounded-full bg-[radial-gradient(ellipse_at_center,rgb(199_187_116/0.28),rgb(199_187_116/0.08)_45%,transparent_70%)] blur-2xl"
                  style={{ x: '-50%', y: '-50%' }}
                  animate={{ opacity: [0.6, 1, 0.6], scale: [0.94, 1.06, 0.94] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                {/* pl- balances the trailing letter-spacing, so the word
                    centres on its letters rather than on its box. */}
                <span className="relative pl-[0.4em] text-xs font-medium uppercase tracking-[0.4em] text-glow/90 [text-shadow:0_0_16px_rgb(199_187_116/0.55)]">
                  {scrollHint}
                </span>
                {/* The trail: a thread of light running down from the word. */}
                <motion.span
                  className="relative mt-4 block h-12 w-px origin-top bg-gradient-to-b from-glow/80 to-transparent"
                  animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
      {/* The hero's lower edge, carried softly into the page: its sticky
          frame must stay solid while it plays, so the fade is a strip
          after it rather than a mask on it. */}
      <div aria-hidden className="fade-from-forest h-12" />
    </>
  );
}

export default SmoothScrollHero;
