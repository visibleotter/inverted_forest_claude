'use client';

import { RotateCcw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveMessages, type ContentFormState } from '@/lib/admin-actions';
import { cn } from '@/lib/utils';

export interface ContentRow {
  key: string;
  /** The key with its namespace stripped — what the editor reads. */
  label: string;
  defaultRu: string;
  defaultEn: string;
  ru: string;
  en: string;
}

interface Props {
  namespace: string;
  rows: ContentRow[];
}

function SubmitButton() {
  const t = useTranslations('admin.content');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

/**
 * Every visible string in one namespace, Russian beside English.
 *
 * Side by side rather than one language at a time because the two are
 * edited together — a headline changed in Russian and forgotten in English
 * is the failure this layout is meant to make obvious.
 *
 * An empty box means "use the shipped default", which is why the
 * placeholder shows that default rather than a hint: clearing a field is
 * how you undo an edit, and you can see what you would be going back to.
 */
export function ContentEditor({ namespace, rows }: Props) {
  const t = useTranslations('admin.content');
  const [query, setQuery] = useState('');
  const [state, formAction] = useFormState<ContentFormState, FormData>(
    adminSaveMessages,
    { status: 'idle' }
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) =>
      [row.label, row.defaultRu, row.defaultEn, row.ru, row.en]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, query]);

  const box =
    'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm leading-relaxed';

  return (
    <form action={formAction}>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search')}
            className="pl-9"
            aria-label={t('search')}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t('showing', { shown: visible.length, total: rows.length })}
        </p>
      </div>

      <div className="space-y-5">
        {visible.map((row) => {
          const edited = row.ru !== row.defaultRu || row.en !== row.defaultEn;
          return (
            <div
              key={row.key}
              className="rounded-card border border-border bg-card p-4"
            >
              <div className="mb-2.5 flex items-center gap-2">
                <code className="text-xs text-muted-foreground">
                  {row.label}
                </code>
                {edited && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                    <RotateCcw className="h-3 w-3" aria-hidden />
                    {t('edited')}
                  </span>
                )}
              </div>

              <div className="grid gap-3 lg:grid-cols-2">
                <div>
                  <label
                    htmlFor={`ru-${row.key}`}
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    RU
                  </label>
                  <textarea
                    id={`ru-${row.key}`}
                    name={`value:ru:${row.key}`}
                    defaultValue={row.ru}
                    placeholder={row.defaultRu}
                    rows={Math.min(8, Math.ceil(row.defaultRu.length / 70) + 1)}
                    className={box}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`en-${row.key}`}
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    EN
                  </label>
                  <textarea
                    id={`en-${row.key}`}
                    name={`value:en:${row.key}`}
                    defaultValue={row.en}
                    placeholder={row.defaultEn}
                    rows={Math.min(8, Math.ceil(row.defaultEn.length / 70) + 1)}
                    className={box}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-border bg-background/95 py-4 backdrop-blur">
        <SubmitButton />
        <input type="hidden" name="namespace" value={namespace} />

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-red-500">
            {state.message === 'demo_mode' ? t('demoMode') : state.message}
          </p>
        )}
        {state.status === 'saved' && (
          <div role="status" className="text-sm">
            <p className="text-moss">
              {t('savedCount', { changed: state.changed, reset: state.reset })}
            </p>
            {state.problems.length > 0 && (
              <div className="mt-1 text-red-500">
                <p>{t('placeholderProblem')}</p>
                <ul className="mt-1 space-y-0.5">
                  {state.problems.map((problem) => (
                    <li key={problem}>
                      <code className="text-xs">{problem}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}

export function NamespaceNav({
  namespaces,
  current,
  hrefFor
}: {
  namespaces: { name: string; count: number; edited: number }[];
  current: string;
  hrefFor: string;
}) {
  return (
    <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Namespaces">
      {namespaces.map((ns) => (
        <a
          key={ns.name}
          href={`${hrefFor}?ns=${ns.name}`}
          className={cn(
            'rounded-btn border px-3 py-1.5 text-sm transition-colors',
            ns.name === current
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border text-muted-foreground hover:border-accent/50'
          )}
        >
          {ns.name}
          <span className="ml-1.5 text-xs opacity-70">{ns.count}</span>
          {ns.edited > 0 && (
            <span className="ml-1 text-xs font-semibold text-accent">
              ·{ns.edited}
            </span>
          )}
        </a>
      ))}
    </nav>
  );
}
