'use client';

import { Mail } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type State = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Sign-in by emailed link.
 *
 * No password to store, lose or leak, and the same mechanism will carry
 * the student portal later. Who is actually allowed in is decided
 * server-side by `ADMIN_EMAILS` — a link delivered to an address that is
 * not on that list authenticates a person who then gets nothing.
 *
 * The response is intentionally identical whether or not the address is an
 * admin one, so this form cannot be used to find out who the admins are.
 */
export function AdminLoginForm({ demo }: { demo: boolean }) {
  const t = useTranslations('adminLogin');
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setState('sending');

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?locale=${locale}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false }
      });
      // `shouldCreateUser: false` means an unknown address returns an
      // error. Report success regardless — see the note above.
      setState(error && error.status && error.status >= 500 ? 'error' : 'sent');
    } catch {
      setState('error');
    }
  }

  if (demo) {
    return (
      <div className="rounded-card border border-border bg-card p-8">
        <h1 className="text-2xl font-semibold">{t('title')}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('demoNote')}
        </p>
      </div>
    );
  }

  if (state === 'sent') {
    return (
      <div className="rounded-card border border-border bg-card p-8" role="status">
        <Mail className="h-7 w-7 text-accent" aria-hidden />
        <h1 className="mt-4 text-2xl font-semibold">{t('sentTitle')}</h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          {t('sentText')}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-card border border-border bg-card p-8"
    >
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {t('subtitle')}
      </p>

      <label htmlFor="admin-email" className="mb-1.5 mt-6 block text-sm font-medium">
        {t('email')}
      </label>
      <Input
        id="admin-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      {state === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {t('error')}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={state === 'sending'}
        className="mt-6 w-full"
      >
        {state === 'sending' ? t('sending') : t('submit')}
      </Button>
    </form>
  );
}
