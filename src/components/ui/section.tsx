import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

export function Section({
  eyebrow,
  title,
  subtitle,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn(
        // Rhythm, not decoration: the sections after the hero are short —
        // most under a screen — so with tight padding they flick past one
        // heading after another. The extra air gives each one room to
        // register before the next arrives.
        'relative py-20 sm:py-28',
        // Dark bands bring their own ground; everything else gets the
        // light one, so no section is a flat fill.
        !className?.includes('surface-dark') &&
          !className?.includes('section-soft') &&
          'ground-light',
        className
      )}
      {...props}
    >
      <div className="container-content">
        {(eyebrow || title || subtitle) && (
          <div className="mb-10 max-w-2xl sm:mb-14">
            {eyebrow && (
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-accent">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                {subtitle}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
