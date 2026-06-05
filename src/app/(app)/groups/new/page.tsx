"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { displayName } from "@/lib/utils";

const EMOJIS = ["🧾", "🏠", "✈️", "🍽️", "🎉", "⛰️", "🏖️", "🚗", "💼", "❤️"];

export default function NewGroupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [meId, setMeId] = useState<string | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🧾");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setMeId(user?.id ?? null);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true });
      setPeople((data ?? []) as Profile[]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function createGroup() {
    if (!name.trim() || !meId) return;
    setLoading(true);
    setError(null);

    const { data: group, error: gErr } = await supabase
      .from("groups")
      .insert({ name: name.trim(), emoji, created_by: meId })
      .select()
      .single();

    if (gErr || !group) {
      setError(gErr?.message ?? "Could not create group");
      setLoading(false);
      return;
    }

    const rows = Array.from(selected)
      .filter((id) => id !== meId)
      .map((id) => ({ group_id: group.id, user_id: id }));

    if (rows.length) {
      const { error: mErr } = await supabase.from("group_members").insert(rows);
      if (mErr) {
        setError(mErr.message);
        setLoading(false);
        return;
      }
    }

    router.push(`/groups/${group.id}`);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-4 py-3">
        <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-cloud">
          <ArrowLeft size={22} />
        </Link>
        <h1 className="font-display text-lg font-bold">New group</h1>
        <button
          onClick={createGroup}
          disabled={loading || !name.trim()}
          className="ml-auto text-[15px] font-bold text-teal-600 disabled:text-muted"
        >
          {loading ? <Loader2 size={20} className="animate-spin" /> : "Create"}
        </button>
      </header>

      <div className="space-y-6 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cloud text-3xl">
            {emoji}
          </div>
          <div className="flex-1">
            <label className="label">Group name</label>
            <input
              className="input"
              placeholder="Goa Trip, Flat 4B…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="label">Pick an icon</label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                onClick={() => setEmoji(e)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${
                  emoji === e
                    ? "bg-teal-100 ring-2 ring-teal-500"
                    : "bg-cloud"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Add members</label>
          {error && (
            <p className="mb-2 rounded-xl bg-owe/10 px-3 py-2 text-[13px] font-medium text-owe">
              {error}
            </p>
          )}
          <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
            {people.filter((p) => p.id !== meId).length === 0 && (
              <p className="px-4 py-6 text-center text-[13px] text-muted">
                No other users found. Add more users in Supabase Auth, then they
                will appear here.
              </p>
            )}
            {people
              .filter((p) => p.id !== meId)
              .map((p) => {
                const on = selected.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 bg-white px-4 py-3 text-left hover:bg-cloud"
                  >
                    <Avatar profile={p} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">
                        {displayName(p)}
                      </p>
                      <p className="truncate text-[12.5px] text-muted">
                        {p.email}
                      </p>
                    </div>
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        on
                          ? "border-teal-500 bg-teal-500 text-white"
                          : "border-line"
                      }`}
                    >
                      {on && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
          </div>
          <p className="mt-2 text-[12.5px] text-muted">
            You will be added automatically. You can add or remove members later.
          </p>
        </div>
      </div>
    </div>
  );
}
