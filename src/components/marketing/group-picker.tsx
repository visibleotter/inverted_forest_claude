'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';
import { SlotTime } from '@/components/marketing/slot-time';
import { cn } from '@/lib/utils';
import type { Locale } from '@/lib/types';

export interface PickerGroup {
  id: string;
  day: string;
  time: string;
  timezone: string;
  weekday: number;
  referenceDate: string;
  audience: string;
  status: string;
  /** Shown under the audience, e.g. who signs a teenager up. */
  note?: string;
  open: boolean;
  /** Why a closed group cannot be chosen. */
  closedLabel?: string;
}

interface Labels {
  title: string;
  timezoneNote: string;
  holidaysNote: string;
  price: string;
  perMonth: string;
  priceTerms: string;
  refund: string;
  join: string;
  joinShort: string;
  noneOpen: string;
  contact: string;
}

/**
 * Choose a group, then one button.
 *
 * The old schedule gave every slot its own identical "Join" button, so the
 * decision and the action were the same click and the price sat elsewhere
 * on the page. Here the choice is a choice — radio rows — and the single
 * action sits next to the price and the terms.
 *
 * The chosen group goes into the address (`?group=`), so the browser's
 * Back button, a refresh and a link shared from Telegram all come back to
 * the same selection. Each row keeps its old `slot-<id>` anchor, so links
 * already posted still land on the right group.
 */
export function GroupPicker({
  groups,
  initialId,
  locale,
  labels
}: {
  groups: PickerGroup[];
  initialId: string | null;
  locale: Locale;
  labels: Labels;
}) {
  const openGroups = groups.filter((group) => group.open);
  const [selected, setSelected] = useState<string | null>(
    initialId ?? openGroups[0]?.id ?? null
  );

  // An old anchor link (#slot-group_106) selects that group too.
  useEffect(() => {
    const match = window.location.hash.match(/^#slot-(.+)$/);
    if (match && openGroups.some((group) => group.id === match[1])) {
      setSelected(match[1]!);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function choose(id: string) {
    setSelected(id);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('group', id);
      url.hash = '';
      window.history.replaceState(window.history.state, '', url);
    } catch {
      // The selection still works; only the address is not updated.
    }
  }

  const chosen = groups.find((group) => group.id === selected) ?? null;

  return (
    <>
      <div className="min-w-0">
        <h2 className="text-[26px] leading-tight sm:text-[32px]">{labels.title}</h2>

        {openGroups.length === 0 && (
          <p className="text-body mt-4 max-w-prose text-muted-foreground">
            {labels.noneOpen}{' '}
            <Link href="/contacts" className="text-accent underline underline-offset-4">
              {labels.contact}
            </Link>
          </p>
        )}

        <fieldset className="mt-6 grid gap-3">
          <legend className="sr-only">{labels.title}</legend>
          {groups.map((group) => {
            const checked = group.id === selected;
            return (
              <label
                key={group.id}
                id={`slot-${group.id}`}
                htmlFor={`pick-${group.id}`}
                className={cn(
                  'grid scroll-mt-24 grid-cols-[20px_1fr] gap-4 border bg-card px-5 py-4',
                  group.open ? 'cursor-pointer' : 'cursor-not-allowed opacity-70',
                  checked ? 'border-2 border-fern px-[19px] py-[15px]' : 'border-border'
                )}
              >
                <input
                  type="radio"
                  name="group"
                  id={`pick-${group.id}`}
                  value={group.id}
                  checked={checked}
                  disabled={!group.open}
                  onChange={() => choose(group.id)}
                  className="mt-1.5 h-5 w-5 accent-[#2A4A3A]"
                />
                <span className="min-w-0">
                  <span className="block font-serif text-[19px] font-medium">
                    {group.day},{' '}
                    <SlotTime
                      weekday={group.weekday}
                      time={group.time}
                      timezone={group.timezone}
                      referenceDate={group.referenceDate}
                      locale={locale}
                    />
                  </span>
                  <span className="mt-1 block text-sm text-muted-foreground">
                    {group.audience} · {group.open ? group.status : group.closedLabel}
                  </span>
                  {group.note && (
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {group.note}
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </fieldset>

        <p className="mt-4 text-sm text-muted-foreground">
          {labels.timezoneNote} {labels.holidaysNote}
        </p>
      </div>

      <aside className="mt-10 lg:mt-0">
        <div className="border border-border bg-card p-6 lg:sticky lg:top-24">
          <p className="font-serif text-[30px] font-medium leading-none">
            {labels.price}{' '}
            <span className="font-sans text-base font-normal text-muted-foreground">
              {labels.perMonth}
            </span>
          </p>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground">
            <li>{labels.priceTerms}</li>
            <li>{labels.refund}</li>
          </ul>
          {chosen?.open && (
            <Link
              href={`/register/${chosen.id}`}
              className={buttonVariants({ className: 'mt-6 hidden w-full lg:flex' })}
            >
              {labels.join}
            </Link>
          )}
        </div>
      </aside>

      {/* Phones: the action stays under the thumb, with the price and the
          chosen time, wherever the reader has scrolled to. */}
      {chosen?.open && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-input bg-background pb-[env(safe-area-inset-bottom)] lg:hidden">
          <div className="container-content flex items-center justify-between gap-4 py-3">
            <p className="min-w-0 text-sm leading-tight text-muted-foreground">
              <span className="block text-base font-medium text-foreground">
                {labels.price} {labels.perMonth}
              </span>
              {chosen.day}, {chosen.time}
            </p>
            <Link href={`/register/${chosen.id}`} className={buttonVariants()}>
              {labels.joinShort}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
