import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        accent: 'bg-accent/10 text-accent',
        outline: 'border border-border text-muted-foreground',
        // Palette only: fern for fine, glow wash for attention, brick
        // (the approved error colour) for trouble.
        success: 'bg-fern/10 text-fern',
        warning: 'bg-glow/30 text-forest',
        danger: 'bg-brick/10 text-brick'
      }
    },
    defaultVariants: { variant: 'default' }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
