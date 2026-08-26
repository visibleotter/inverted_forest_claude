import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Adapted from MagicUI's `dot-pattern`.
 *
 * The original renders one animated <circle> per dot, which for a
 * full-width hero is thousands of DOM nodes and a client component.
 * This version uses a tiled SVG <pattern>, so it is a static server
 * component with no runtime cost and no client JavaScript — and the
 * glow animation is dropped, which suits the brand anyway.
 */
interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  /** Spacing between dots. */
  spacing?: number;
  /** Dot radius. */
  radius?: number;
  className?: string;
}

export function DotPattern({
  spacing = 20,
  radius = 1,
  className,
  ...props
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 h-full w-full',
        className
      )}
      {...props}
    >
      <defs>
        <pattern
          id={id}
          width={spacing}
          height={spacing}
          patternUnits="userSpaceOnUse"
          patternContentUnits="userSpaceOnUse"
        >
          <circle cx={radius} cy={radius} r={radius} fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
