'use client';

import { Check, Loader2, Send, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type State = 'checking' | 'pending' | 'ready' | 'paid_no_invite' | 'demo';

interface Props {
  enrollmentId: string;
  contactHref: string;
}

/**
 * Watches an enrollment resolve after the payer comes back from Allpay.
 *
 * The webhook usually lands within a second or two, but "usually" is not
 * good enough for the one screen where someone has just handed over money.
 * So this polls, and backs off: quick at first, then slower, then it stops
 * and says something true rather than spinning forever.
 */
export function EnrollmentStatus({ enrollmentId, contactHref }: Props) {
  const t = useTranslations('enrollSuccess');
  const [state, setState] = useState<State>('checking');
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    async function poll() {
      if (cancelled) return;
      attempt += 1;

      try {
        const response = await fetch(`/api/enroll/${enrollmentId}/status`, {
          cache: 'no-store'
        });
        const body = (await response.json()) as {
          state?: State;
          inviteLink?: string;
        };

        if (cancelled) return;

        if (body.state === 'ready' && body.inviteLink) {
          setInviteLink(body.inviteLink);
          setState('ready');
          return; // Resolved — stop asking.
        }
        if (body.state === 'demo') {
          setState('demo');
          return;
        }
        if (body.state === 'paid_no_invite') {
          setState('paid_no_invite');
        }
      } catch {
        // A dropped request is not an answer; keep trying.
      }

      // ~2s for the first half-minute, then every 5s, giving up at ~2 min.
      if (attempt > 30) {
        setState((current) =>
          current === 'checking' ? 'pending' : current
        );
        return;
      }
      setTimeout(poll, attempt <= 15 ? 2000 : 5000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  if (state === 'ready' && inviteLink) {
    return (
      <div className="rounded-card border border-border bg-card p-8">
        <Check className="h-7 w-7 text-accent" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">{t('readyTitle')}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('readyText')}
        </p>
        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'accent', size: 'lg' }), 'mt-6')}
        >
          <Send className="mr-2 h-4 w-4" aria-hidden />
          {t('join')}
        </a>
        <p className="mt-4 text-sm text-muted-foreground">{t('emailedToo')}</p>
      </div>
    );
  }

  if (state === 'paid_no_invite') {
    return (
      <div className="rounded-card border border-border bg-card p-8">
        <TriangleAlert className="h-7 w-7 text-accent" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">{t('manualTitle')}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('manualText')}
        </p>
        <a
          href={contactHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
        >
          {t('contact')}
        </a>
      </div>
    );
  }

  if (state === 'pending' || state === 'demo') {
    return (
      <div className="rounded-card border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold">{t('pendingTitle')}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('pendingText')}
        </p>
        <a
          href={contactHref}
          className={cn(buttonVariants({ variant: 'outline' }), 'mt-6')}
        >
          {t('contact')}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-border bg-card p-8" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
      <h1 className="mt-4 text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {t('waiting')}
      </p>
    </div>
  );
}
