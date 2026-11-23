'use client';

import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccordionItemProps {
  question: string;
  answer: string;
}

/** Native <details> accordion — accessible by default, zero JS state. */
export function AccordionItem({ question, answer }: AccordionItemProps) {
  return (
    <details className="group border-b border-border py-4 last:border-b-0">
      <summary
        className={cn(
          'flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium',
          '[&::-webkit-details-marker]:hidden'
        )}
      >
        <span>{question}</span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
      </summary>
      <p className="mt-3 pr-8 text-sm leading-relaxed text-muted-foreground">
        {answer}
      </p>
    </details>
  );
}
