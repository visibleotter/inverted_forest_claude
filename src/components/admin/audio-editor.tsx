'use client';

import { Trash2, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { adminCreateAudioUpload, adminDeleteAudio } from '@/lib/admin-actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { AudioClip, LocalizedString } from '@/lib/types';
import { cn } from '@/lib/utils';

const box =
  'w-full rounded-btn border border-border bg-background px-3 py-2 text-sm';

/** Read a file's length in the browser, before it is uploaded. */
function durationOf(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      audio.src = url;
    } catch {
      resolve(null);
    }
  });
}

function formatTime(sec: number | null): string {
  if (sec === null) return '—';
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/**
 * The course's audio fragments: upload, title in both languages, listen,
 * remove. The list is part of the course draft and is saved with the
 * course — uploading puts the file in Storage at once, but the clip
 * appears on the site only after "Save".
 */
export function AudioEditor({
  courseId,
  clips,
  onChange
}: {
  courseId: string;
  clips: AudioClip[];
  onChange: (next: AudioClip[]) => void;
}) {
  const t = useTranslations('admin.courseForm');
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!courseId) {
      setStatus(t('audioNeedsId'));
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setStatus(t('audioTooBig'));
      return;
    }
    setBusy(true);
    setStatus(t('audioUploading'));
    try {
      const [durationSec, ticket] = await Promise.all([
        durationOf(file),
        adminCreateAudioUpload(courseId, file.name)
      ]);
      if (!ticket.ok) {
        setStatus(
          ticket.message === 'no_bucket'
            ? t('audioNoBucket')
            : ticket.message === 'bad_type'
              ? t('audioBadType')
              : ticket.message === 'demo_mode'
                ? t('demoMode')
                : ticket.message
        );
        return;
      }
      const { error } = await createSupabaseBrowserClient()
        .storage.from('course-audio')
        .uploadToSignedUrl(ticket.path, ticket.token, file, {
          contentType: file.type || 'audio/mpeg'
        });
      if (error) {
        setStatus(error.message);
        return;
      }
      const name = file.name.replace(/\.[^.]+$/, '');
      onChange([
        ...clips,
        { url: ticket.publicUrl, title: { ru: name, en: '' }, durationSec }
      ]);
      setStatus(t('audioUploaded'));
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  async function remove(index: number) {
    const clip = clips[index];
    onChange(clips.filter((_, i) => i !== index));
    if (clip) await adminDeleteAudio(clip.url);
  }

  const setTitle = (index: number, title: LocalizedString) =>
    onChange(clips.map((clip, i) => (i === index ? { ...clip, title } : clip)));

  const move = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= clips.length) return;
    const next = [...clips];
    [next[index], next[to]] = [next[to]!, next[index]!];
    onChange(next);
  };

  return (
    <section className="space-y-5 border-t border-border pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t('audio')}</h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">{t('audioHint')}</p>
        </div>
        <label
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'cursor-pointer',
            busy && 'pointer-events-none opacity-60'
          )}
        >
          <Upload className="mr-1.5 h-4 w-4" aria-hidden />
          {t('audioAdd')}
          <input
            ref={input}
            type="file"
            accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav,audio/webm,.mp3,.m4a"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) upload(file);
            }}
          />
        </label>
      </div>

      {status && (
        <p role="status" className="text-sm text-muted-foreground">
          {status}
        </p>
      )}

      {clips.map((clip, index) => (
        <div
          key={clip.url}
          className="space-y-3 rounded-card border border-border bg-card p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm font-medium text-muted-foreground">
              {index + 1} · {formatTime(clip.durationSec)}
            </span>
            <div className="flex items-center gap-3 text-sm">
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => move(index, -1)} aria-label={t('audioUp')}>↑</button>
              <button type="button" className="text-muted-foreground hover:text-foreground" onClick={() => move(index, 1)} aria-label={t('audioDown')}>↓</button>
              <button
                type="button"
                aria-label={t('remove')}
                className="text-muted-foreground transition-colors hover:text-destructive"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
          <audio controls preload="none" src={clip.url} className="w-full" />
          <div className="grid gap-3 sm:grid-cols-2">
            {(['ru', 'en'] as const).map((locale) => (
              <label key={locale} className="block text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('audioTitle')} · {locale.toUpperCase()}
                </span>
                <input
                  className={box}
                  value={clip.title[locale]}
                  onChange={(event) =>
                    setTitle(index, { ...clip.title, [locale]: event.target.value })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
