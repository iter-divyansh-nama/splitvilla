'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import './register.css';

function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    const { data, error } = await supabase().auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo:
          typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      router.replace('/dashboard');
      router.refresh();
    } else {
      setInfo('Almost done! Check your email and click the confirm link, then log in.');
      setLoading(false);
    }
  }

  return (
    <div className="register-page flex min-h-screen flex-col lg:flex-row">
      {/* ===== LEFT BRAND PANEL ===== */}
      <section className="reg-brand-bg relative flex flex-col justify-center overflow-hidden px-8 py-14 text-white lg:w-[52%] lg:px-16 lg:py-0">
        <div className="reg-blob-1 pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="reg-blob-2 pointer-events-none absolute -bottom-16 right-10 h-48 w-48 rounded-full bg-white/8" />

        {/* Logo */}
        <div className="reg-anim-slide-up relative z-10 mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.2)"/>
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 14l-2 4M16 14l2 4M12 14v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7"/>
            </svg>
          </div>
          <span className="text-3xl font-black tracking-tight">Splitr</span>
        </div>

        <h1 className="reg-anim-slide-up reg-delay-1 relative z-10 text-4xl font-black leading-[1.15] lg:text-5xl">
          Join the<br />
          <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            smart split.
          </span>
        </h1>
        <p className="reg-anim-slide-up reg-delay-2 relative z-10 mt-5 max-w-md text-base leading-relaxed text-white/85 lg:text-lg">
          Create your free account and start splitting expenses with friends in seconds.
        </p>

        {/* Stats */}
        <div className="reg-anim-slide-up reg-delay-3 relative z-10 mt-10 flex gap-8">
          <div>
            <div className="reg-float-1 text-2xl font-black">∞</div>
            <p className="text-xs text-white/70">Free forever</p>
          </div>
          <div>
            <div className="reg-float-2 text-2xl font-black">⚡</div>
            <p className="text-xs text-white/70">Instant setup</p>
          </div>
          <div>
            <div className="reg-float-3 text-2xl font-black">🔒</div>
            <p className="text-xs text-white/70">Bank-level security</p>
          </div>
        </div>
      </section>

      {/* ===== RIGHT FORM PANEL ===== */}
      <section className="flex flex-1 items-center justify-center bg-gradient-to-br from-[#F8FAFB] to-[#EEF2F5] px-6 py-14 lg:px-12">
        <div className="w-full max-w-[400px]">
          <div className="reg-anim-slide-left mb-8">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1CC29F] to-[#16A085] shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
            </div>
            <h2 className="text-3xl font-black text-[#1E293B]">Create account</h2>
            <p className="mt-2 text-[15px] text-[#64748B]">It only takes a moment</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="reg-anim-slide-left reg-delay-1">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Full name</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <input type="text" required className="reg-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" />
              </div>
            </div>

            <div className="reg-anim-slide-left reg-delay-2">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Email address</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>
                  </svg>
                </div>
                <input type="email" required className="reg-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>

            <div className="reg-anim-slide-left reg-delay-3">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="4" y="11" width="16" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>
                  </svg>
                </div>
                <input type="password" required minLength={6} className="reg-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete="new-password" />
              </div>
            </div>

            {error && (
              <div className="reg-anim-fade flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <p className="text-sm font-medium text-red-600">{error}</p>
              </div>
            )}
            {info && (
              <div className="reg-anim-fade flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <p className="text-sm font-medium text-emerald-700">{info}</p>
              </div>
            )}

            <div className="reg-anim-slide-left reg-delay-4 pt-1">
              <button type="submit" disabled={loading} className="reg-btn">
                {loading ? <><span className="reg-spinner" /> Creating...</> : 'Create account'}
              </button>
            </div>
          </form>

          <div className="reg-anim-slide-left reg-delay-5 my-7 flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[#E2E8F0]" />
            <span className="text-xs font-semibold text-[#CBD5E1]">ALREADY A MEMBER?</span>
            <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[#E2E8F0]" />
          </div>

          <div className="reg-anim-slide-left reg-delay-5 text-center">
            <a
              href="/login"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-[#E2E8F0] bg-white px-6 py-3 text-sm font-bold text-[#1CC29F] shadow-sm transition-all hover:border-[#1CC29F] hover:shadow-md"
            >
              Sign in instead
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
