'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

/**
 * A weekly slot, in the school's timezone and — when they differ — in the
 * reader's.
 *
 * Two problems this solves. The old note said "GMT+3", which is true in
 * Israel only from spring to autumn; the rest of the year it was simply
 * wrong. And half the audience is English-speaking and not in Israel, for
 * whom "Tuesday 20:00" is a small piece of arithmetic standing between
 * them and a decision.
 *
 * The conversion runs in the browser because only the browser knows where
 * the reader is. Until it does, the server-rendered Israel time is shown
 * on its own — correct, just not yet personalised.
 */

interface Props {
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
  /** Local wall-clock time in the group's zone, e.g. "20:00". */
  time: string;
  /** IANA zone the group is scheduled in, e.g. "Asia/Jerusalem". */
  timezone: string;
  /** Any date the slot runs on; used as the reference instant. */
  referenceDate: string;
  locale: string;
}

/** How far `timeZone` is from UTC at that instant, in milliseconds. */
function zoneOffsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0');

  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second')
  );
  return asUtc - at.getTime();
}

/** The real instant of a wall-clock time in a named zone. */
function instantOf(date: string, time: string, timeZone: string): Date {
  const naive = new Date(`${date}T${time}:00Z`);
  return new Date(naive.getTime() - zoneOffsetMs(naive, timeZone));
}

export function SlotTime({
  weekday,
  time,
  timezone,
  referenceDate,
  locale
}: Props) {
  const t = useTranslations('schedule');
  const [local, setLocal] = useState<string | null>(null);
  const [zoneLabel, setZoneLabel] = useState<string | null>(null);

  useEffect(() => {
    try {
      const viewerZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const tag = locale === 'ru' ? 'ru-RU' : 'en-US';

      // The reference date is a date the course runs on, so the offset is
      // the one that will actually apply — not today's.
      const instant = instantOf(referenceDate, time, timezone);

      setZoneLabel(
        new Intl.DateTimeFormat(tag, {
          timeZone: timezone,
          timeZoneName: 'short'
        })
          .formatToParts(instant)
          .find((part) => part.type === 'timeZoneName')?.value ?? null
      );

      if (!viewerZone || viewerZone === timezone) return;

      const there = new Intl.DateTimeFormat(tag, {
        timeZone: viewerZone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(instant);

      const here = new Intl.DateTimeFormat(tag, {
        timeZone: timezone,
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(instant);

      // Same wall clock in both zones — nothing worth saying.
      if (there !== here) setLocal(there);
    } catch {
      // A browser without a usable timezone database just sees the
      // school's time, which is what the page already said.
    }
  }, [weekday, time, timezone, referenceDate, locale]);

  return (
    <span>
      <span className="tabular-nums">{time}</span>
      {zoneLabel && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          {zoneLabel}
        </span>
      )}
      {local && (
        <span className="mt-1 block text-xs text-muted-foreground">
          {t('yourTime', { time: local })}
        </span>
      )}
    </span>
  );
}
