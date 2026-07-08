'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/** Subtle scroll-reveal used across marketing pages. Respects reduced motion. */
export function FadeIn({ children, delay = 0, className }: FadeInProps) {
  const reduce = useReducedMotion();

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
