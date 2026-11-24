'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * "All / Adults / Teens" chips above the catalogue.
 *
 * The cards are rendered on the server as usual; each wrapper carries
 * `data-ages`, and this only shows or hides them. So the list works fully
 * without JavaScript — every course is simply shown — and a parent who
 * picks "Teens" stops reading about groups their child cannot join.
 */
export function AgeFilter({
  options,
  label,
  children
}: {
  options: { value: string; label: string }[];
  label: string;
  children: React.ReactNode;
}) {
  const [selected, setSelected] = useState('all');
  const list = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = list.current?.querySelectorAll<HTMLElement>('[data-ages]') ?? [];
    items.forEach((item) => {
      const ages = (item.dataset.ages ?? '').split(' ');
      item.hidden = selected !== 'all' && !ages.includes(selected);
    });
  }, [selected]);

  return (
    <>
      <div role="group" aria-label={label} className="mt-10 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setSelected(option.value)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                active
                  ? 'border-accent bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:border-accent/60 hover:text-foreground'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <div ref={list}>{children}</div>
    </>
  );
}
