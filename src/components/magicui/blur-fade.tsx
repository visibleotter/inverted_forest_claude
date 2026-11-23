'use client';

import {
  motion,
  useInView,
  useReducedMotion,
  type MotionProps,
  type Variants
} from 'framer-motion';
import { useRef } from 'react';

/**
 * Adapted from MagicUI's `blur-fade`.
 * Changes: imports from framer-motion (already a dependency) instead of
 * `motion/react`, and honours prefers-reduced-motion.
 */

interface BlurFadeProps extends MotionProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  offset?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  /** Animate when scrolled into view rather than on mount. */
  inView?: boolean;
  blur?: string;
}

export function BlurFade({
  children,
  className,
  duration = 0.5,
  delay = 0,
  offset = 8,
  direction = 'up',
  inView = true,
  blur = '5px',
  ...props
}: BlurFadeProps) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const inViewResult = useInView(ref, { once: true, margin: '-60px' });
  const isVisible = !inView || inViewResult;

  const axis = direction === 'left' || direction === 'right' ? 'x' : 'y';
  const sign = direction === 'right' || direction === 'down' ? -offset : offset;

  // Reduced motion keeps the identical element and simply lands on the
  // visible state instantly, rather than switching to a plain <div>, which
  // would change the tree between server and client.
  const variants: Variants = reduce
    ? {
        hidden: { opacity: 1, filter: 'none' },
        visible: { opacity: 1, filter: 'none' }
      }
    : {
        hidden: { [axis]: sign, opacity: 0, filter: `blur(${blur})` },
        visible: { [axis]: 0, opacity: 1, filter: 'blur(0px)' }
      };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={variants}
      transition={{
        delay: reduce ? 0 : 0.04 + delay,
        duration: reduce ? 0 : duration,
        ease: 'easeOut'
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
