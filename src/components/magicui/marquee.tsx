import { type ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Adapted from MagicUI's `marquee`.
 * Changes: Tailwind v3 syntax (the original uses v4-only `gap-(--gap)`),
 * and a slower default duration that suits a calm layout.
 */
interface MarqueeProps extends ComponentPropsWithoutRef<'div'> {
  reverse?: boolean;
  pauseOnHover?: boolean;
  vertical?: boolean;
  repeat?: number;
  children: React.ReactNode;
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = true,
  vertical = false,
  repeat = 4,
  children,
  ...props
}: MarqueeProps) {
  return (
    <div
      {...props}
      className={cn(
        'group flex gap-4 overflow-hidden p-2 [--duration:60s]',
        vertical ? 'flex-col' : 'flex-row',
        className
      )}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            'flex shrink-0 justify-around gap-4',
            vertical
              ? 'animate-marquee-vertical flex-col'
              : 'animate-marquee flex-row',
            pauseOnHover && 'group-hover:[animation-play-state:paused]',
            reverse && '[animation-direction:reverse]',
            'motion-reduce:animate-none'
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}
