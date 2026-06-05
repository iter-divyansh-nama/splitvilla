'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Brand panel — top on mobile, left half on desktop. Separate section, no overlap. */}
      <section className="flex flex-col justify-center gap-4 bg-gradient-to-br from-brand to-brand-700 px-6 py-10 text-white md:w-1/2 md:px-12 md:py-0">
        <div className="flex items-center gap-2">
          <img src="/icons/icon-192.png" alt="" width={44} height={44} className="rounded-xl shadow-card" />
          <span className="text-2xl font-extrabold tracking-tight">Splitr</span>
        </div>
        <h1 className="text-3xl font-extrabold leading-tight md:text-4xl">
          Split bills.<br />Stay friends.
        </h1>
        <p className="max-w-sm text-sm text-white/85 md:text-base">
          Track shared expenses with groups and settle up in a tap.
        </p>
      </section>

      {/* Form panel — bottom on mobile, right half on desktop. */}
      <section className="flex flex-1 items-center justify-center bg-canvas px-6 py-10">
        <div className="w-full max-w-sm">
          <h2 className="mb-1 text-2xl font-extrabold text-ink">Welcome back</h2>
          <p className="mb-6 text-sm text-muted">Sign in with the account you were given.</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" />
                </svg>
                <input id="email" type="email" required className="input pl-10" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="4" y="11" width="16" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <input id="password" type="password" required className="input pl-10" value={password}
                  onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>

            {error && <p className="rounded-lg bg-owe/10 px-3 py-2 text-sm text-owe">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted">
            Accounts are created by your administrator in Supabase. Contact them if you need access.
          </p>
        </div>
      </section>
    </div>
  );
}
