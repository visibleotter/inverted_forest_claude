'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface FragmentView {
  url: string;
  title: string;
  durationSec: number | null;
}

function time(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * A few minutes of a real class, to hear before signing up.
 *
 * One <audio> element for the whole list, so starting a fragment stops the
 * previous one. Nothing loads until the first press (`preload="none"`), so
 * a page with five clips costs nothing until someone listens. The progress
 * bar is a real slider: drag, click, or arrow keys to seek.
 */
export function AudioFragments({
  clips,
  labels
}: {
  clips: FragmentView[];
  labels: { play: string; pause: string; seek: string };
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [length, setLength] = useState<number | null>(null);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setPosition(el.currentTime);
    const onMeta = () => setLength(Number.isFinite(el.duration) ? el.duration : null);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => {
      setPlaying(false);
      setPosition(0);
    };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('play', onPlay);
    el.addEventListener('pause', onPause);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('play', onPlay);
      el.removeEventListener('pause', onPause);
      el.removeEventListener('ended', onEnd);
    };
  }, []);

  function toggle(index: number) {
    const el = audio.current;
    const clip = clips[index];
    if (!el || !clip) return;
    if (current === index) {
      if (el.paused) void el.play();
      else el.pause();
      return;
    }
    setCurrent(index);
    setPosition(0);
    setLength(clip.durationSec);
    el.src = clip.url;
    void el.play();
  }

  function seek(index: number, value: number) {
    const el = audio.current;
    if (!el || current !== index) return;
    el.currentTime = value;
    setPosition(value);
  }

  return (
    <div>
      <audio ref={audio} preload="none" className="hidden" />
      <ul className="space-y-3">
        {clips.map((clip, index) => {
          const active = current === index;
          const total = (active ? length : null) ?? clip.durationSec ?? 0;
          const at = active ? position : 0;
          const isPlaying = active && playing;
          return (
            <li
              key={clip.url}
              className={cn(
                'flex items-center gap-4 rounded-card border bg-card p-4 transition-colors',
                active ? 'border-accent/50' : 'border-border'
              )}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                aria-label={`${isPlaying ? labels.pause : labels.play}: ${clip.title}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" aria-hidden />
                ) : (
                  <Play className="ml-0.5 h-4 w-4" aria-hidden />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{clip.title}</p>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="range"
                    min={0}
                    max={total || 1}
                    step={1}
                    value={Math.min(at, total || 1)}
                    disabled={!active}
                    onChange={(event) => seek(index, Number(event.target.value))}
                    aria-label={`${labels.seek}: ${clip.title}`}
                    className="h-1 flex-1 cursor-pointer accent-[#2A4A3A] disabled:cursor-default"
                  />
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {active ? `${time(at)} / ` : ''}
                    {total ? time(total) : '—'}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
