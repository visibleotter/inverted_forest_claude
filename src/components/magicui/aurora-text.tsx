'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Adapted from MagicUI's `aurora-text`.
 *
 * Changes: Tailwind v3 syntax, and the default palette is the Inverted
 * Forest brand (amber through navy) rather than MagicUI's pink/purple/blue,
 * which would be badly off-brand here.
 */
interface AuroraTextProps {
  children: React.ReactNode;
  className?: string;
  colors?: string[];
  speed?: number;
}

export const AuroraText = memo(function AuroraText({
  children,
  className,
  colors = ['#C8922A', '#E5A93A', '#F8F5EF', '#E5A93A'],
  speed = 1
}: AuroraTextProps) {
  return (
    <span className={cn('relative inline-block', className)}>
      <span className="sr-only">{children}</span>
      <span
        aria-hidden
        className="animate-aurora relative bg-clip-text text-transparent motion-reduce:animate-none"
        style={{
          backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
          backgroundSize: '200% auto',
          animationDuration: `${10 / speed}s`
        }}
      >
        {children}
      </span>
    </span>
  );
});
