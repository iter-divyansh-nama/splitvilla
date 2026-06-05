'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Avatar from '@/components/Avatar';
import { createClient } from '@/lib/supabase/client';
import { displayName } from '@/lib/balances';
import type { Profile } from '@/types/database';

export default function AccountPage() {
  const router = useRouter();
  const [me, setMe] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setMe(data as Profile);
      setName((data as Profile)?.full_name ?? '');
    })();
  }, []);

  async function saveName() {
    if (!me) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', me.id);
    setMe({ ...me, full_name: name.trim() });
    setEditing(false);
    setSaving(false);
    router.refresh();
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  const label = me ? displayName(me) : '';

  return (
    <AppShell title="Account">
      {/* Hero — kept in normal flow so nothing overlaps */}
      <section className="card mb-4 flex flex-col items-center gap-3 bg-gradient-to-b from-brand to-brand-600 p-6 text-white">
        <Avatar name={label || 'You'} size={88} />
        <div className="text-center">
          <p className="text-xl font-extrabold leading-tight">{label}</p>
          <p className="text-sm text-white/85">{me?.email}</p>
        </div>
      </section>

      {/* Profile card */}
      <section className="card mb-4 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink">Your profile</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-sm font-semibold text-brand">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="label">Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-2">
              <button onClick={saveName} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setName(me?.full_name ?? ''); }} className="btn-ghost flex-1">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted">Name</dt>
              <dd className="text-sm font-semibold text-ink">{label}</dd>
            </div>
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm text-muted">Email</dt>
              <dd className="text-sm font-semibold text-ink">{me?.email}</dd>
            </div>
          </dl>
        )}
      </section>

      <button onClick={signOut} className="btn-ghost w-full text-owe">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sign out
      </button>

      <p className="mt-4 text-center text-xs text-muted">Splitr · accounts are managed in Supabase</p>
    </AppShell>
  );
}
