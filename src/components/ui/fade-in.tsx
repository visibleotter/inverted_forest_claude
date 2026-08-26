'use client';

import { BlurFade } from '@/components/magicui/blur-fade';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Scroll-reveal used across the marketing pages.
 *
 * Delegates to MagicUI's BlurFade — same call signature as before, but the
 * reveal now resolves a slight blur as well as opacity, which reads softer
 * than a plain translate. Reduced motion is handled inside BlurFade.
 */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  return (
    <BlurFade delay={delay} className={className}>
      {children}
    </BlurFade>
  );
}
