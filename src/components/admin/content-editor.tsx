'use client';

import { ExternalLink, EyeOff, RotateCcw, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useSavedNotice } from '@/components/admin/save-feedback';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveMessages, type ContentFormState } from '@/lib/admin-actions';
import { placeholdersIn } from '@/lib/content/message-tree';
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

export interface ContentGroup {
  id: string;
  title: string;
  hint?: string;
  /** Kept in the catalogue, but the site does not render it today. */
  hidden?: boolean;
  rows: ContentRow[];
}

export interface ContentPlaceView {
  title: string;
  where: string;
  /** Full path to the live page, locale included. */
  href?: string;
}

interface Props {
  namespace: string;
  place: ContentPlaceView;
  groups: ContentGroup[];
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

const box =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm leading-relaxed';

function Field({
  id,
  name,
  label,
  value,
  fallback
}: {
  id: string;
  name: string;
  label: string;
  value: string;
  fallback: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1 block text-xs font-medium text-muted-foreground"
      >
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={value}
        placeholder={fallback}
        rows={Math.min(8, Math.ceil(fallback.length / 70) + 1)}
        className={box}
      />
    </div>
  );
}

/**
 * Every visible string, arranged the way the site reads.
 *
 * Two things this has to answer that a list of keys cannot. Where does
 * this text appear — hence the header naming the page and linking to it.
 * And what stands next to it — hence the grouping into the blocks a
 * reader actually meets, in reading order, so a card's text can be
 * weighed against the three cards beside it.
 *
 * Russian sits beside English because the two are edited together: a
 * headline changed in one language and forgotten in the other is the
 * failure this layout is meant to make obvious.
 *
 * An empty box means "use the shipped default", which is why the
 * placeholder shows that default rather than a hint: clearing a field is
 * how you undo an edit, and you can see what you would be going back to.
 */
export function ContentEditor({ namespace, place, groups }: Props) {
  const t = useTranslations('admin.content');
  const [query, setQuery] = useState('');
  const [state, formAction] = useFormState<ContentFormState, FormData>(
    adminSaveMessages,
    { status: 'idle' }
  );

  // Confirmation without leaving: this page has no level above it, and it
  // is worked through many fields at a time.
  useSavedNotice(state.status === 'saved');

  const total = useMemo(
    () => groups.reduce((sum, group) => sum + group.rows.length, 0),
    [groups]
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map((group) => ({
        ...group,
        rows: group.rows.filter((row) =>
          [row.label, row.defaultRu, row.defaultEn, row.ru, row.en]
            .join(' ')
            .toLowerCase()
            .includes(needle)
        )
      }))
      .filter((group) => group.rows.length > 0);
  }, [groups, query]);

  const shown = visible.reduce((sum, group) => sum + group.rows.length, 0);

  return (
    <form action={formAction}>
      <div className="mb-6 rounded-card border border-border bg-card p-4">
        <p className="text-base font-semibold">{place.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {place.where}
        </p>
        {place.href && (
          <a
            href={place.href}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            {t('openPage')}
          </a>
        )}
      </div>

      {/*
        Jumping between blocks matters more than it looks: the admin
        namespace alone runs past a hundred strings, and scrolling for the
        one block you came to fix is most of the work.
      */}
      {groups.length > 1 && (
        <nav className="mb-6 flex flex-wrap items-center gap-1.5" aria-label={t('jumpTo')}>
          <span className="mr-1 text-xs uppercase tracking-wider text-muted-foreground">
            {t('jumpTo')}
          </span>
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#block-${group.id}`}
              className="rounded-btn border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground"
            >
              {group.title}
            </a>
          ))}
        </nav>
      )}

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
          {t('showing', { shown, total })}
        </p>
      </div>

      {visible.length === 0 && (
        <p className="rounded-card border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
          {t('nothingFound')}
        </p>
      )}

      <div className="space-y-10">
        {visible.map((group) => (
          <section key={group.id} id={`block-${group.id}`} className="scroll-mt-6">
            <div className="mb-3 border-b border-border pb-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider">
                  {group.title}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {group.rows.length}
                </span>
                {group.hidden && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    <EyeOff className="h-3 w-3" aria-hidden />
                    {t('notShown')}
                  </span>
                )}
              </div>
              {group.hint && (
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  {group.hint}
                </p>
              )}
            </div>

            <div className="space-y-5">
              {group.rows.map((row) => {
                const edited =
                  row.ru !== row.defaultRu || row.en !== row.defaultEn;
                // Read from the shipped wording, not the edited value: it
                // is the tokens the code will pass that must survive.
                const tokens = placeholdersIn(row.defaultRu);
                return (
                  <div
                    key={row.key}
                    className={cn(
                      'rounded-card border border-border bg-card p-4',
                      group.hidden && 'opacity-70'
                    )}
                  >
                    <div className="mb-2.5 flex flex-wrap items-center gap-2">
                      <code className="text-xs text-muted-foreground">
                        {row.label}
                      </code>
                      {edited && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                          <RotateCcw className="h-3 w-3" aria-hidden />
                          {t('edited')}
                        </span>
                      )}
                      {tokens.length > 0 && (
                        <span className="text-[11px] text-muted-foreground">
                          {t('keepTokens', { tokens: tokens.join(' ') })}
                        </span>
                      )}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-2">
                      <Field
                        id={`ru-${row.key}`}
                        name={`value:ru:${row.key}`}
                        label="RU"
                        value={row.ru}
                        fallback={row.defaultRu}
                      />
                      <Field
                        id={`en-${row.key}`}
                        name={`value:en:${row.key}`}
                        label="EN"
                        value={row.en}
                        fallback={row.defaultEn}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-4 border-t border-border bg-background/95 py-4 backdrop-blur">
        <SubmitButton />
        <input type="hidden" name="namespace" value={namespace} />

        {state.status === 'error' && (
          <p role="alert" className="text-sm text-destructive">
            {state.message === 'demo_mode' ? t('demoMode') : state.message}
          </p>
        )}
        {state.status === 'saved' && (
          <div role="status" className="text-sm">
            <p className="text-moss">
              {t('savedCount', { changed: state.changed, reset: state.reset })}
            </p>
            {state.problems.length > 0 && (
              <div className="mt-1 text-destructive">
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

export interface NamespaceItem {
  name: string;
  title: string;
  area: 'site' | 'service' | 'admin';
  count: number;
  edited: number;
}

/**
 * The list of places, named the way the site is, not the way the code is.
 *
 * Grouped by area because "which page am I editing" and "is this even
 * visible to a student" are the two questions asked at this level, and
 * `nav`, `enrollSuccess` and `groupForm` sitting in one flat row answers
 * neither.
 */
export function NamespaceNav({
  namespaces,
  current,
  hrefFor
}: {
  namespaces: NamespaceItem[];
  current: string;
  hrefFor: string;
}) {
  const t = useTranslations('admin.content');
  const areas = [
    { id: 'site', label: t('areaSite') },
    { id: 'service', label: t('areaService') },
    { id: 'admin', label: t('areaAdmin') }
  ] as const;

  return (
    <nav className="mb-8 space-y-3" aria-label={t('title')}>
      {areas.map((area) => {
        const mine = namespaces.filter((ns) => ns.area === area.id);
        if (mine.length === 0) return null;
        return (
          <div key={area.id} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 w-full text-xs uppercase tracking-wider text-muted-foreground sm:w-auto">
              {area.label}
            </span>
            {mine.map((ns) => (
              <a
                key={ns.name}
                href={`${hrefFor}?ns=${ns.name}`}
                title={ns.name}
                className={cn(
                  'rounded-btn border px-3 py-1.5 text-sm transition-colors',
                  ns.name === current
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-muted-foreground hover:border-accent/50'
                )}
              >
                {ns.title}
                <span className="ml-1.5 text-xs opacity-70">{ns.count}</span>
                {ns.edited > 0 && (
                  <span className="ml-1 text-xs font-semibold text-accent">
                    ·{ns.edited}
                  </span>
                )}
              </a>
            ))}
          </div>
        );
      })}
    </nav>
  );
}
