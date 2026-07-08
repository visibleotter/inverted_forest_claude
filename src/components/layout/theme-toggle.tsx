'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/**
 * Class-based dark mode with localStorage persistence.
 * An inline script in the root layout applies the class before paint.
 */
export function ThemeToggle({ label }: { label: string }) {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-btn text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {dark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  );
}
