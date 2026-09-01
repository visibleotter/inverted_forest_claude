'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Link } from '@/i18n/navigation';
import {
  SavedToast,
  useSavedRedirect
} from '@/components/admin/save-feedback';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminSaveCourse, type CourseFormState } from '@/lib/admin-actions';
import type {
  AgeGroup,
  Course,
  CourseCategory,
  Difficulty,
  Locale
} from '@/lib/types';

/**
 * The whole of a course, in both languages, on one page.
 *
 * The draft is kept in state and posted as a single JSON payload rather
 * than as a hundred named form fields. The shape is genuinely nested —
 * modules holding topic lists, FAQ pairs — and names like
 * `curriculum[0].topics.ru[2]` would move that nesting into string parsing
 * without removing any of it.
 *
 * Lists are edited as one item per line. That is the format people already
 * use when they paste from a document, and it needs no explaining.
 */

const AGE_GROUPS: AgeGroup[] = ['children', 'teens', 'adults'];
const CATEGORIES: CourseCategory[] = [
  'history',
  'philosophy',
  'literature',
  'anthropology'
];
const DIFFICULTIES: Difficulty[] = ['intro', 'intermediate', 'deep_dive'];

const field = 'mb-1.5 block text-sm font-medium';
const box =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm leading-relaxed';

function linesToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

const listToLines = (list: string[]) => list.join('\n');

function emptyCourse(teacherId: string): Course {
  const empty = { ru: '', en: '' };
  const emptyList = { ru: [] as string[], en: [] as string[] };
  return {
    id: '',
    slug: '',
    teacherId,
    category: 'history',
    difficulty: 'intro',
    ageGroups: ['adults'],
    durationMonths: 3,
    monthlyPrice: 220,
    currency: 'ILS',
    imageUrl: null,
    publicTelegramUrl: null,
    status: 'draft',
    featured: false,
    title: { ...empty },
    shortDescription: { ...empty },
    description: { ...empty },
    outcomes: { ...emptyList },
    audience: { ...emptyList },
    curriculum: [],
    faq: []
  };
}

function SubmitButton() {
  const t = useTranslations('admin.courseForm');
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="accent" size="lg" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  );
}

/** A label plus a Russian and an English box, side by side. */
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
            <span className="mb-1 block text-xs text-muted-foreground uppercase">
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

interface Props {
  course: Course | null;
  teachers: { id: string; label: string }[];
}

export function CourseForm({ course, teachers }: Props) {
  const t = useTranslations('admin.courseForm');
  const [draft, setDraft] = useState<Course>(
    course ?? emptyCourse(teachers[0]?.id ?? '')
  );
  const [state, formAction] = useFormState<CourseFormState, FormData>(
    adminSaveCourse,
    { status: 'idle' }
  );

  // Confirm, then return to the list — see save-feedback.tsx.
  const savedToast = useSavedRedirect(state.status === 'saved', '/admin/courses');

  const isNew = course === null;
  const set = <K extends keyof Course>(key: K, value: Course[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const setList = (
    key: 'outcomes' | 'audience',
    locale: Locale,
    text: string
  ) =>
    setDraft((current) => ({
      ...current,
      [key]: { ...current[key], [locale]: linesToList(text) }
    }));

  return (
    <>
      <SavedToast show={savedToast} />
      <form action={formAction} className="max-w-4xl space-y-10">
      <input type="hidden" name="payload" value={JSON.stringify(draft)} />

      {/* ── Basics ─────────────────────────────────────────────────── */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold">{t('basics')}</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="course-id" className={field}>
              ID
            </label>
            <Input
              id="course-id"
              value={draft.id}
              readOnly={!isNew}
              placeholder="course_010"
              onChange={(event) => set('id', event.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{t('idHint')}</p>
          </div>

          <div>
            <label htmlFor="course-slug" className={field}>
              Slug
            </label>
            <Input
              id="course-slug"
              value={draft.slug}
              placeholder="russia-twentieth-century"
              onChange={(event) => set('slug', event.target.value)}
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('slugHint')}
            </p>
          </div>

          <div>
            <label htmlFor="course-teacher" className={field}>
              {t('teacher')}
            </label>
            <select
              id="course-teacher"
              className={box}
              value={draft.teacherId}
              onChange={(event) => set('teacherId', event.target.value)}
            >
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-status" className={field}>
              {t('statusLabel')}
            </label>
            <select
              id="course-status"
              className={box}
              value={draft.status}
              onChange={(event) =>
                set('status', event.target.value as Course['status'])
              }
            >
              {(['published', 'draft', 'archived'] as const).map((value) => (
                <option key={value} value={value}>
                  {t(`status.${value}`)}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('statusHint')}
            </p>
          </div>

          <div>
            <label htmlFor="course-category" className={field}>
              {t('category')}
            </label>
            <select
              id="course-category"
              className={box}
              value={draft.category}
              onChange={(event) =>
                set('category', event.target.value as CourseCategory)
              }
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-difficulty" className={field}>
              {t('difficulty')}
            </label>
            <select
              id="course-difficulty"
              className={box}
              value={draft.difficulty}
              onChange={(event) =>
                set('difficulty', event.target.value as Difficulty)
              }
            >
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="course-duration" className={field}>
              {t('duration')}
            </label>
            <Input
              id="course-duration"
              inputMode="numeric"
              value={String(draft.durationMonths)}
              onChange={(event) =>
                set('durationMonths', Number(event.target.value) || 0)
              }
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              {t('durationHint')}
            </p>
          </div>

          <div>
            <label htmlFor="course-price" className={field}>
              {t('price')}
            </label>
            <div className="flex gap-2">
              <Input
                id="course-price"
                inputMode="decimal"
                value={String(draft.monthlyPrice)}
                onChange={(event) =>
                  set('monthlyPrice', Number(event.target.value) || 0)
                }
              />
              <select
                aria-label="currency"
                className={`${box} w-28`}
                value={draft.currency}
                onChange={(event) =>
                  set('currency', event.target.value as Course['currency'])
                }
              >
                {['ILS', 'USD', 'EUR'].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="sm:col-span-2">
            <span className={field}>{t('ageGroups')}</span>
            <div className="flex flex-wrap gap-4">
              {AGE_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#2A4A3A]"
                    checked={draft.ageGroups.includes(group)}
                    onChange={(event) =>
                      set(
                        'ageGroups',
                        event.target.checked
                          ? [...draft.ageGroups, group]
                          : draft.ageGroups.filter((value) => value !== group)
                      )
                    }
                  />
                  {group}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="course-image" className={field}>
              {t('image')}
            </label>
            <Input
              id="course-image"
              value={draft.imageUrl ?? ''}
              placeholder="https://…"
              onChange={(event) => set('imageUrl', event.target.value || null)}
            />
          </div>

          <div>
            <label htmlFor="course-telegram" className={field}>
              {t('publicChannel')}
            </label>
            <Input
              id="course-telegram"
              value={draft.publicTelegramUrl ?? ''}
              placeholder="https://t.me/…"
              onChange={(event) =>
                set('publicTelegramUrl', event.target.value || null)
              }
            />
          </div>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#2A4A3A]"
              checked={draft.featured}
              onChange={(event) => set('featured', event.target.checked)}
            />
            {t('featured')}
          </label>
        </div>
      </section>

      {/* ── Copy ───────────────────────────────────────────────────── */}
      <section className="space-y-6 border-t border-border pt-8">
        <h2 className="text-lg font-semibold">{t('copy')}</h2>

        <Bilingual
          label={t('titleField')}
          rows={2}
          value={draft.title}
          onChange={(next) => set('title', next)}
        />
        <Bilingual
          label={t('shortDescription')}
          rows={3}
          value={draft.shortDescription}
          onChange={(next) => set('shortDescription', next)}
        />
        <Bilingual
          label={t('description')}
          rows={8}
          value={draft.description}
          onChange={(next) => set('description', next)}
        />

        {(['outcomes', 'audience'] as const).map((key) => (
          <div key={key}>
            <span className={field}>{t(key)}</span>
            <p className="mb-2 text-xs text-muted-foreground">
              {t('onePerLine')}
            </p>
            <div className="grid gap-3 lg:grid-cols-2">
              {(['ru', 'en'] as const).map((locale) => (
                <div key={locale}>
                  <span className="mb-1 block text-xs uppercase text-muted-foreground">
                    {locale}
                  </span>
                  <textarea
                    rows={5}
                    className={box}
                    value={listToLines(draft[key][locale])}
                    onChange={(event) =>
                      setList(key, locale, event.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* ── Curriculum ─────────────────────────────────────────────── */}
      <section className="space-y-5 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{t('curriculum')}</h2>
          <button
            type="button"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            onClick={() =>
              set('curriculum', [
                ...draft.curriculum,
                {
                  title: { ru: '', en: '' },
                  topics: { ru: [], en: [] }
                }
              ])
            }
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {t('addModule')}
          </button>
        </div>

        {draft.curriculum.map((module, index) => (
          <div
            key={index}
            className="space-y-4 rounded-card border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {t('module')} {index + 1}
              </span>
              <button
                type="button"
                aria-label={t('remove')}
                className="text-muted-foreground transition-colors hover:text-red-500"
                onClick={() =>
                  set(
                    'curriculum',
                    draft.curriculum.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <Bilingual
              label={t('moduleTitle')}
              rows={2}
              value={module.title}
              onChange={(next) =>
                set(
                  'curriculum',
                  draft.curriculum.map((item, i) =>
                    i === index ? { ...item, title: next } : item
                  )
                )
              }
            />

            <div>
              <span className={field}>{t('topics')}</span>
              <p className="mb-2 text-xs text-muted-foreground">
                {t('onePerLine')}
              </p>
              <div className="grid gap-3 lg:grid-cols-2">
                {(['ru', 'en'] as const).map((locale) => (
                  <div key={locale}>
                    <span className="mb-1 block text-xs uppercase text-muted-foreground">
                      {locale}
                    </span>
                    <textarea
                      rows={4}
                      className={box}
                      value={listToLines(module.topics[locale])}
                      onChange={(event) =>
                        set(
                          'curriculum',
                          draft.curriculum.map((item, i) =>
                            i === index
                              ? {
                                  ...item,
                                  topics: {
                                    ...item.topics,
                                    [locale]: linesToList(event.target.value)
                                  }
                                }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────── */}
      <section className="space-y-5 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{t('faq')}</h2>
          <button
            type="button"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            onClick={() =>
              set('faq', [
                ...draft.faq,
                {
                  question: { ru: '', en: '' },
                  answer: { ru: '', en: '' }
                }
              ])
            }
          >
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            {t('addQuestion')}
          </button>
        </div>

        {draft.faq.map((item, index) => (
          <div
            key={index}
            className="space-y-4 rounded-card border border-border bg-card p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                {index + 1}
              </span>
              <button
                type="button"
                aria-label={t('remove')}
                className="text-muted-foreground transition-colors hover:text-red-500"
                onClick={() =>
                  set(
                    'faq',
                    draft.faq.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <Bilingual
              label={t('question')}
              rows={2}
              value={item.question}
              onChange={(next) =>
                set(
                  'faq',
                  draft.faq.map((entry, i) =>
                    i === index ? { ...entry, question: next } : entry
                  )
                )
              }
            />
            <Bilingual
              label={t('answer')}
              rows={4}
              value={item.answer}
              onChange={(next) =>
                set(
                  'faq',
                  draft.faq.map((entry, i) =>
                    i === index ? { ...entry, answer: next } : entry
                  )
                )
              }
            />
          </div>
        ))}
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 border-t border-border bg-background/95 py-4 backdrop-blur">
        <SubmitButton />
        <Link
          href="/admin/courses"
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
