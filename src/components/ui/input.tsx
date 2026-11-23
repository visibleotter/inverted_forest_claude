import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'h-12 w-full rounded-btn border border-input bg-card px-4 text-base text-card-foreground placeholder:text-muted-foreground focus-visible:border-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent aria-[invalid=true]:border-destructive disabled:opacity-50',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';
