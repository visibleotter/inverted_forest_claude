import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-muted text-muted-foreground',
        accent: 'bg-amber/15 text-amber dark:bg-amber/20 dark:text-amber-light',
        outline: 'border border-border text-muted-foreground',
        success:
          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
        warning:
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
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
