'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import './login.css';

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

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
    const { error } = await supabase().auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.replace('/dashboard');
    router.refresh();
  }

  return (
    <div className="login-page flex min-h-screen flex-col lg:flex-row">
      {/* ===== LEFT BRAND PANEL ===== */}
      <section className="brand-bg relative flex flex-col justify-center overflow-hidden px-8 py-14 text-white lg:w-[52%] lg:px-16 lg:py-0">
        {/* Floating blobs */}
        <div className="blob-1 pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="blob-2 pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-white/8" />
        <div className="blob-3 pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-white/6" />

        {/* Logo */}
        <div className="anim-slide-up relative z-10 mb-8 flex items-center gap-3">
          <div className="pulse-ring flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 14l-2 4M16 14l2 4M12 14v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <span className="text-3xl font-black tracking-tight">Splitr</span>
        </div>

        {/* Headline */}
        <h1 className="anim-slide-up delay-1 relative z-10 text-4xl font-black leading-[1.15] lg:text-5xl">
          Split bills.<br />
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            Stay friends.
          </span>
        </h1>
        <p className="anim-slide-up delay-2 relative z-10 mt-5 max-w-md text-base leading-relaxed text-white/85 lg:text-lg">
          Track shared expenses with groups, split fairly, and settle up — all in one tap.
        </p>

        {/* Feature cards */}
        <div className="anim-slide-up delay-3 relative z-10 mt-10 grid grid-cols-2 gap-3 lg:max-w-lg">
          <div className="feature-card flex items-start gap-3">
            <div className="float-icon-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Group splits</p>
              <p className="text-xs text-white/70">Split with any group</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-3">
            <div className="float-icon-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Track debts</p>
              <p className="text-xs text-white/70">Who owes what</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-3">
            <div className="float-icon-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Activity log</p>
              <p className="text-xs text-white/70">Real-time updates</p>
            </div>
          </div>

          <div className="feature-card flex items-start gap-3">
            <div className="float-icon-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold">Settle up</p>
              <p className="text-xs text-white/70">One-tap payments</p>
            </div>
          </div>
        </div>

        {/* Bottom floating icons */}
        <div className="pointer-events-none absolute bottom-8 right-8 hidden opacity-60 lg:block">
          <div className="float-icon-1 absolute -left-16 -top-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          </div>
          <div className="float-icon-3 absolute -top-32 left-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
        </div>
      </section>

      {/* ===== RIGHT FORM PANEL ===== */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#F8FAFB] to-[#EEF2F5] px-6 py-14 lg:px-12">
        <div className="w-full max-w-[400px]">
          {/* Welcome text */}
          <div className="anim-slide-left mb-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1CC29F] to-[#16A085] shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[#1E293B]">Welcome back</h2>
            <p className="mt-2 text-[15px] text-[#64748B]">Sign in to continue splitting expenses</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="anim-slide-left delay-1">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Email address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  required
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="anim-slide-left delay-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="anim-fade flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}

            <div className="anim-slide-left delay-3 pt-1">
              <button type="submit" disabled={loading} className="login-btn">
                {loading ? (
                  <><span className="spinner" /> Signing in...</>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          {/* Divider */}
          <div className="anim-slide-left delay-4 my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E2E8F0]" />
            <span className="text-xs font-semibold text-[#CBD5E1]">NEW HERE?</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E2E8F0]" />
          </div>

          {/* Sign up link */}
          <div className="anim-slide-left delay-5 text-center">
            <a
              href="/register"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white px-6 py-3 text-sm font-bold text-[#1CC29F] shadow-sm transition-all hover:border-[#1CC29F] hover:shadow-md"
            >
              Create a free account
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          {/* Trust badges */}
          <div className="anim-fade delay-5 mt-8 flex items-center justify-center gap-6 text-[#CBD5E1]">
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span className="text-[11px] font-semibold">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span className="text-[11px] font-semibold">Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span className="text-[11px] font-semibold">Free forever</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
