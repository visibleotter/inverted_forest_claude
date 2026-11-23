'use client';

import { BlurFade } from '@/components/magicui/blur-fade';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  /**
   * Reveal on scroll-into-view (default) or immediately on mount. The
   * sticky hero needs the latter — it is already in view at load, and its
   * position changes as the page scrolls.
   */
  inView?: boolean;
}

/**
 * Scroll-reveal used across the marketing pages.
 *
 * Delegates to MagicUI's BlurFade — same call signature as before, but the
 * reveal now resolves a slight blur as well as opacity, which reads softer
 * than a plain translate. Reduced motion is handled inside BlurFade.
 */
export function FadeIn({
  children,
  delay = 0,
  className,
  inView = true
}: FadeInProps) {
  return (
    <BlurFade delay={delay} className={className} inView={inView}>
      {children}
    </BlurFade>
  );
}
