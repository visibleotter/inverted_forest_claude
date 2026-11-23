import Image from 'next/image';
import { artworks } from '@/lib/content/artworks';
import type { Locale } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * An artwork in a paper mat with a museum label underneath.
 *
 * The frame, not a filter, is what makes paintings from five centuries
 * read as one series: the same 4:3 window, the same light mat, the same
 * caption. The colour of the work is left alone.
 */
export function CourseArt({
  src,
  alt,
  locale,
  sizes,
  priority,
  className
}: {
  src: string | null;
  alt: string;
  locale: Locale;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return null;
  const caption = artworks[src]?.[locale];

  return (
    <figure className={cn('m-0', className)}>
      <div className="border border-border bg-card p-3">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="object-cover"
          />
        </div>
      </div>
      {caption && (
        <figcaption className="mt-2 text-[13px] leading-snug text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
