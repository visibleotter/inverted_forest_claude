'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Adapted from MagicUI's `aurora-text`.
 *
 * Changes: Tailwind v3 syntax, and the default palette is the Inverted
 * Forest brand (accent through deep) rather than MagicUI's pink/purple/blue,
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
  colors = ['#31708E', '#8FC1E3', '#F7F9FB', '#8FC1E3'],
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
