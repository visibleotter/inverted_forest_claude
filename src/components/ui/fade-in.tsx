interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  inView?: boolean;
}

/**
 * Formerly a scroll-reveal. Now renders its children as they are.
 *
 * The redesign drops entrance animation everywhere: content that waits to
 * be scrolled into view is content a skimming reader, a screenshot or a
 * link preview never sees. Kept as a pass-through so the remaining call
 * sites need no edit; `delay` and `inView` are accepted and ignored.
 */
export function FadeIn({ children, className }: FadeInProps) {
  return className ? <div className={className}>{children}</div> : <>{children}</>;
}
