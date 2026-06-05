'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

// Self-contained: no '@/components' or '@/lib' imports, so it always compiles.
function supabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

type Profile = { id: string; email: string | null; full_name: string | null };

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const sb = supabase();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;
      const { data } = await sb.from('profiles').select('id,email,full_name').eq('id', user.id).single();
      const prof = (data as Profile) ?? { id: user.id, email: user.email ?? null, full_name: null };
      setMe(prof);
      setName(prof.full_name ?? '');
    })();
  }, []);

  const label = me?.full_name || me?.email?.split('@')[0] || 'You';

  async function saveName() {
    if (!me) return;
    setSaving(true);
    await supabase().from('profiles').update({ full_name: name.trim() }).eq('id', me.id);
    setMe({ ...me, full_name: name.trim() });
    setEditing(false);
    setSaving(false);
    router.refresh();
  }

  async function signOut() {
    await supabase().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-2xl bg-[#F7F8FA] px-4 py-4">
      <div className="mb-4 flex items-center gap-3 rounded-xl bg-[#1CC29F] px-4 py-3 text-white">
        <button onClick={() => router.push('/dashboard')} aria-label="Back" className="-ml-1 rounded-full p-1 hover:bg-white/15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <h1 className="flex-1 text-base font-bold">Account</h1>
      </div>

      {/* Hero — normal flow, no overlap */}
      <section className="mb-4 flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-b from-[#1CC29F] to-[#16A085] p-6 text-white shadow">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-white/20 text-2xl font-bold ring-4 ring-white/40">
          {initials(label)}
        </span>
        <div className="text-center">
          <p className="text-xl font-extrabold">{label}</p>
          <p className="text-sm text-white/85">{me?.email}</p>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-[#E9ECEF] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#2E3942]">Your profile</h2>
          {!editing && <button onClick={() => setEditing(true)} className="text-sm font-semibold text-[#1CC29F]">Edit</button>}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input className="w-full rounded-lg border border-[#E9ECEF] px-3 py-2.5 text-sm outline-none focus:border-[#1CC29F]"
              value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <button onClick={saveName} disabled={saving}
                className="flex-1 rounded-lg bg-[#1CC29F] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setName(me?.full_name ?? ''); }}
                className="flex-1 rounded-lg border border-[#E9ECEF] bg-white px-4 py-2.5 text-sm font-semibold text-[#2E3942]">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="divide-y divide-[#E9ECEF]">
            <div className="flex justify-between py-3"><dt className="text-sm text-[#8A9199]">Name</dt><dd className="text-sm font-semibold text-[#2E3942]">{label}</dd></div>
            <div className="flex justify-between py-3"><dt className="text-sm text-[#8A9199]">Email</dt><dd className="text-sm font-semibold text-[#2E3942]">{me?.email}</dd></div>
          </dl>
        )}
      </section>

      <button onClick={signOut} className="w-full rounded-lg border border-[#E9ECEF] bg-white px-4 py-2.5 text-sm font-semibold text-[#FF652F]">
        Sign out
      </button>
      <p className="mt-4 text-center text-xs text-[#8A9199]">Splitr · accounts are managed in Supabase</p>
    </div>
  );
}