'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useFormState, useFormStatus } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  SavedToast,
  useSavedRedirect
} from '@/components/admin/save-feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveTeacher, type TeacherFormState } from '@/lib/admin-actions';
import type { Locale, Teacher } from '@/lib/types';

/**
 * One teacher, both languages.
 *
 * Deliberately the same shape as the course editor — one JSON payload,
 * Russian beside English, lists edited one item per line — because the two
 * screens are used in the same sitting and a second set of conventions
 * would be one more thing to remember.
 */

const field = 'mb-1.5 block text-sm font-medium';
const box =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm leading-relaxed';

const linesToList = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

const listToLines = (list: string[]) => list.join('\n');

function emptyTeacher(): Teacher {
  return {
    id: '',
    slug: '',
    photoUrl: null,
    name: { ru: '', en: '' },
    title: { ru: '', en: '' },
    bio: { ru: '', en: '' },
    highlights: { ru: [], en: [] }
  };
}

function SubmitButton() {
  const t = useTranslations('admin.teacherForm');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

function Bilingual({
  label,
  value,
  rows,
  onChange
}: {
  label: string;
  value: Record<Locale, string>;
  rows: number;
  onChange: (next: Record<Locale, string>) => void;
}) {
  return (
    <div>
      <span className={field}>{label}</span>
      <div className="grid gap-3 lg:grid-cols-2">
        {(['ru', 'en'] as const).map((locale) => (
          <div key={locale}>
            <span className="mb-1 block text-xs uppercase text-muted-foreground">
              {locale}
            </span>
            <textarea
              rows={rows}
              className={box}
              value={value[locale]}
              onChange={(event) =>
                onChange({ ...value, [locale]: event.target.value })
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeacherForm({ teacher }: { teacher: Teacher | null }) {
  const t = useTranslations('admin.teacherForm');
  const [draft, setDraft] = useState<Teacher>(teacher ?? emptyTeacher());
  const [state, formAction] = useFormState<TeacherFormState, FormData>(
    adminSaveTeacher,
    { status: 'idle' }
  );

  // Confirm, then return to the list — see save-feedback.tsx.
  const savedToast = useSavedRedirect(state.status === 'saved', '/admin/teachers');

  const isNew = teacher === null;
  const set = <K extends keyof Teacher>(key: K, value: Teacher[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <>
      <SavedToast show={savedToast} />
      <form action={formAction} className="max-w-4xl space-y-8">
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="teacher-id" className={field}>
            ID
          </label>
          <Input
            id="teacher-id"
            value={draft.id}
            readOnly={!isNew}
            placeholder="teacher_002"
            onChange={(event) => set('id', event.target.value)}
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t('idHint')}</p>
        </div>

        <div>
          <label htmlFor="teacher-slug" className={field}>
            Slug
          </label>
          <Input
            id="teacher-slug"
            value={draft.slug}
            placeholder="vadim-markov"
            onChange={(event) => set('slug', event.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="teacher-photo" className={field}>
            {t('photo')}
          </label>
          <Input
            id="teacher-photo"
            value={draft.photoUrl ?? ''}
            placeholder="https://…"
            onChange={(event) => set('photoUrl', event.target.value || null)}
          />
        </div>
      </div>

      <div className="space-y-6 border-t border-border pt-8">
        <Bilingual
          label={t('name')}
          rows={1}
          value={draft.name}
          onChange={(next) => set('name', next)}
        />
        <Bilingual
          label={t('role')}
          rows={1}
          value={draft.title}
          onChange={(next) => set('title', next)}
        />
        <Bilingual
          label={t('bio')}
          rows={8}
          value={draft.bio}
          onChange={(next) => set('bio', next)}
        />

        <div>
          <span className={field}>{t('highlights')}</span>
          <p className="mb-2 text-xs text-muted-foreground">{t('onePerLine')}</p>
          <div className="grid gap-3 lg:grid-cols-2">
            {(['ru', 'en'] as const).map((locale) => (
              <div key={locale}>
                <span className="mb-1 block text-xs uppercase text-muted-foreground">
                  {locale}
                </span>
                <textarea
                  rows={6}
                  className={box}
                  value={listToLines(draft.highlights[locale])}
                  onChange={(event) =>
                    set('highlights', {
                      ...draft.highlights,
                      [locale]: linesToList(event.target.value)
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-border bg-background/95 py-4 backdrop-blur">
        <SubmitButton />
        <Link
          href="/admin/teachers"
          className={buttonVariants({ variant: 'outline' })}
        >
          {t('cancel')}
        </Link>
        {state.status === 'error' && (
          <p role="alert" className="text-sm text-red-500">
            {state.message === 'demo_mode' ? t('demoMode') : state.message}
          </p>
        )}
        {state.status === 'saved' && (
          <p role="status" className="text-sm text-moss">
            {t('saved')} · {state.id}
          </p>
        )}
      </div>
    </form>
    </>
  );
}
