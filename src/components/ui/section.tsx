import { cn } from '@/lib/utils';

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
}

/**
 * A page section: a hairline above, a heading, and room around it.
 *
 * Sections are told apart by the rule and the space, never by a change of
 * ground — every section sits on the same paper. 48px of air on phones,
 * 72px on wide screens, both on the 8px step.
 */
export function Section({
  eyebrow,
  title,
  subtitle,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn('relative py-12 sm:py-[72px]', className)} {...props}>
      <div className="container-content">
        <div className="border-t border-border pt-8 sm:pt-12">
          {(eyebrow || title || subtitle) && (
            <div className="mb-8 max-w-prose sm:mb-12">
              {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
              {title && (
                <h2 className="text-balance text-[26px] leading-tight sm:text-[32px]">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="mt-3 font-serif text-[17px] leading-relaxed text-muted-foreground sm:text-lg">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
