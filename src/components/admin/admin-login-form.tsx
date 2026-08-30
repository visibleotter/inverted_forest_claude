'use client';

import { Mail } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

type Mode = 'password' | 'link';
type State = 'idle' | 'working' | 'sent' | 'error';

/**
 * Two ways in, and the order matters.
 *
 * **Password** is the default because it needs nothing configured: no
 * redirect URL allow-listed, no mail provider, no waiting for a message.
 * Create the user in the Supabase dashboard with a password and sign in.
 * It works identically on localhost and in production, which the emailed
 * link does not — that one has to be told, per host, where it may return.
 *
 * **The emailed link** stays as the second option, for the day someone
 * forgets the password.
 *
 * Who is actually allowed in is decided server-side by `ADMIN_EMAILS`.
 * Authenticating with an address that is not on that list gets you a
 * session and nothing else.
 */
export function AdminLoginForm({ demo }: { demo: boolean }) {
  const t = useTranslations('adminLogin');
  const locale = useLocale();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function signInWithPassword(event: React.FormEvent) {
    event.preventDefault();
    setState('working');
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      });

      if (error) {
        setState('error');
        setMessage(t('badCredentials'));
        return;
      }

      // The session cookie is set by the browser client. `refresh` makes
      // the server re-read it, so the admin layout sees a signed-in user
      // rather than bouncing straight back here.
      router.replace(`/${locale}/admin`);
      router.refresh();
    } catch {
      setState('error');
      setMessage(t('error'));
    }
  }

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setState('working');
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/api/auth/callback?locale=${locale}`;
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo, shouldCreateUser: false }
      });
      // An unknown address returns an error. Report success anyway, so this
      // form cannot be used to find out who the admins are.
      setState(error && error.status && error.status >= 500 ? 'error' : 'sent');
    } catch {
      setState('error');
      setMessage(t('error'));
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

  const busy = state === 'working';

  return (
    <form
      onSubmit={mode === 'password' ? signInWithPassword : sendLink}
      className="rounded-card border border-border bg-card p-8"
    >
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-3 leading-relaxed text-muted-foreground">
        {mode === 'password' ? t('subtitlePassword') : t('subtitle')}
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

      {mode === 'password' && (
        <>
          <label
            htmlFor="admin-password"
            className="mb-1.5 mt-4 block text-sm font-medium"
          >
            {t('password')}
          </label>
          <Input
            id="admin-password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </>
      )}

      {state === 'error' && (
        <p role="alert" className="mt-3 text-sm text-red-500">
          {message ?? t('error')}
        </p>
      )}

      <Button
        type="submit"
        variant="accent"
        size="lg"
        disabled={busy}
        className="mt-6 w-full"
      >
        {busy
          ? mode === 'password'
            ? t('signingIn')
            : t('sending')
          : mode === 'password'
            ? t('signIn')
            : t('submit')}
      </Button>

      <button
        type="button"
        className="mt-4 w-full text-sm text-muted-foreground underline transition-colors hover:text-foreground"
        onClick={() => {
          setMode(mode === 'password' ? 'link' : 'password');
          setState('idle');
          setMessage(null);
        }}
      >
        {mode === 'password' ? t('useLink') : t('usePassword')}
      </button>
    </form>
  );
}
