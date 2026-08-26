'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders children into document.body.
 *
 * Required for anything `position: fixed` that must cover the viewport. An
 * ancestor with `transform`, `filter`, `backdrop-filter`, `perspective` or
 * `contain` becomes the containing block for fixed descendants, which
 * silently traps the overlay inside that ancestor's box. Two such ancestors
 * already exist here: the header's `backdrop-blur`, and BlurFade, which
 * leaves `filter: blur(0px)` behind once its reveal finishes.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
