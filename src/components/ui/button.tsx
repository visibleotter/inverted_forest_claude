import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-btn font-sans font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // One main action per screen. No shadows: a flat block of fern is
        // already the heaviest thing on a paper page.
        primary: 'bg-primary text-primary-foreground hover:bg-forest',
        // Fern on light, glow on dark — the surface classes swap it.
        accent: 'bg-accent text-accent-foreground hover:opacity-90',
        outline:
          'border border-input bg-transparent hover:bg-muted text-foreground',
        ghost: 'hover:bg-muted text-foreground',
        // The secondary action: a quiet underlined link, not a second button.
        link: 'h-auto px-0 text-accent underline underline-offset-4 decoration-1 hover:decoration-2'
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6 text-base',
        lg: 'h-12 px-8 text-base'
      }
    },
    // A link has no box: undo the size's height and padding, which would
    // otherwise win because sizes are applied after variants.
    compoundVariants: [
      { variant: 'link', size: 'sm', class: 'h-auto px-0' },
      { variant: 'link', size: 'md', class: 'h-auto px-0' },
      { variant: 'link', size: 'lg', class: 'h-auto px-0' }
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export { buttonVariants };
