'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/components/ui/button';

type State = 'checking' | 'pending' | 'ready' | 'paid_no_invite' | 'demo';

interface Props {
  enrollmentId: string;
}

/**
 * Watches an enrollment resolve after the payer comes back from Allpay.
 *
 * The webhook usually lands within a second or two, but "usually" is not
 * good enough for the one screen where someone has just handed over money.
 * So this polls, and backs off: quick at first, then slower, then it stops
 * and says something true rather than spinning forever. An enrollment the
 * server does not know at all is answered at once, not after two minutes.
 */
export function EnrollmentStatus({ enrollmentId }: Props) {
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
        if (response.status === 404) {
          if (!cancelled) setState('pending');
          return;
        }
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
        setState((current) => (current === 'checking' ? 'pending' : current));
        return;
      }
      setTimeout(poll, attempt <= 15 ? 2000 : 5000);
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  const contact = (
    <Link href="/contacts" className={buttonVariants({ variant: 'link', className: 'mt-6' })}>
      {t('contact')}
    </Link>
  );

  if (state === 'ready' && inviteLink) {
    return (
      <div>
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
          {t('readyTitle')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('readyText')}</p>
        <a
          href={inviteLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ className: 'mt-8' })}
        >
          {t('join')}
        </a>
        <p className="mt-4 text-[15px] text-muted-foreground">{t('emailedToo')}</p>
      </div>
    );
  }

  if (state === 'paid_no_invite') {
    return (
      <div>
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
          {t('manualTitle')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('manualText')}</p>
        {contact}
      </div>
    );
  }

  if (state === 'pending' || state === 'demo') {
    return (
      <div>
        <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
          {t('pendingTitle')}
        </h1>
        <p className="text-body mt-4 text-muted-foreground">{t('pendingText')}</p>
        {contact}
      </div>
    );
  }

  return (
    <div role="status">
      <h1 className="text-balance text-[34px] leading-[1.15] sm:text-[44px]">
        {t('title')}
      </h1>
      <p className="text-body mt-4 text-muted-foreground">{t('waiting')}</p>
    </div>
  );
}
