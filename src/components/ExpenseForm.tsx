"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Check, Users2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile, SplitType } from "@/lib/types";
import { CATEGORIES } from "@/lib/categories";
import { Avatar } from "@/components/Avatar";
import { cn, displayName, formatMoney } from "@/lib/utils";

interface GroupLite {
  id: string;
  name: string;
  emoji: string | null;
  memberIds: string[];
}

export function ExpenseForm({
  meId,
  groups,
  profiles,
  initialGroupId,
}: {
  meId: string;
  groups: GroupLite[];
  profiles: Record<string, Profile>;
  initialGroupId?: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const firstGroup =
    groups.find((g) => g.id === initialGroupId)?.id ?? groups[0]?.id ?? "";

  const [groupId, setGroupId] = useState(firstGroup);
  const group = groups.find((g) => g.id === groupId);
  const members = group?.memberIds ?? [];

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(meId);
  const [category, setCategory] = useState("general");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [splitType, setSplitType] = useState<SplitType>("equal");

  // Who participates in the split (defaults to everyone in the group).
  const [participants, setParticipants] = useState<Set<string>>(
    () => new Set(members)
  );
  // Manual values for exact / percentage modes, keyed by user id (as strings).
  const [manual, setManual] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // When the group changes, reset participants + payer sensibly.
  function onGroupChange(id: string) {
    setGroupId(id);
    const g = groups.find((x) => x.id === id);
    const m = g?.memberIds ?? [];
    setParticipants(new Set(m));
    setPaidBy(m.includes(meId) ? meId : m[0] ?? meId);
    setManual({});
  }

  const totalCents = Math.round((parseFloat(amount) || 0) * 100);
  const participantIds = members.filter((m) => participants.has(m));

  // Compute the split preview (in rupees) for the current mode.
  const preview = useMemo(() => {
    const out: Record<string, number> = {};
    if (totalCents <= 0 || participantIds.length === 0) return out;

    if (splitType === "equal") {
      const base = Math.floor(totalCents / participantIds.length);
      const remainder = totalCents - base * participantIds.length;
      participantIds.forEach((id, i) => {
        out[id] = (base + (i < remainder ? 1 : 0)) / 100;
      });
    } else if (splitType === "exact") {
      for (const id of participantIds)
        out[id] = Math.round((parseFloat(manual[id]) || 0) * 100) / 100;
    } else {
      // percentage
      for (const id of participantIds) {
        const pct = parseFloat(manual[id]) || 0;
        out[id] = Math.round(totalCents * (pct / 100)) / 100;
      }
    }
    return out;
  }, [splitType, totalCents, participantIds, manual]);

  const previewSum = Object.values(preview).reduce((a, b) => a + b, 0);
  const previewSumCents = Math.round(previewSum * 100);
  const pctSum = participantIds.reduce(
    (a, id) => a + (parseFloat(manual[id]) || 0),
    0
  );

  function toggleParticipant(id: string) {
    setParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function validate(): string | null {
    if (!groupId) return "Pick a group";
    if (!description.trim()) return "Add a description";
    if (totalCents <= 0) return "Enter a valid amount";
    if (participantIds.length === 0) return "Select at least one person";
    if (splitType === "exact" && previewSumCents !== totalCents)
      return `Splits add up to ${formatMoney(previewSum)}, but the total is ${formatMoney(
        totalCents / 100
      )}`;
    if (splitType === "percentage" && Math.round(pctSum) !== 100)
      return `Percentages add up to ${pctSum.toFixed(0)}%, they must total 100%`;
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);

    const { data: expense, error: eErr } = await supabase
      .from("expenses")
      .insert({
        group_id: groupId,
        description: description.trim(),
        amount: totalCents / 100,
        category,
        paid_by: paidBy,
        split_type: splitType,
        expense_date: date,
        created_by: meId,
      })
      .select()
      .single();

    if (eErr || !expense) {
      setError(eErr?.message ?? "Could not save the expense");
      setSaving(false);
      return;
    }

    // Build split rows, fixing any rounding drift on the last participant
    // so the splits always sum exactly to the expense amount.
    let assigned = 0;
    const rows = participantIds.map((id, i) => {
      let cents = Math.round((preview[id] ?? 0) * 100);
      if (i === participantIds.length - 1) cents = totalCents - assigned;
      assigned += i === participantIds.length - 1 ? 0 : cents;
      return { expense_id: expense.id, user_id: id, amount: cents / 100 };
    });

    const { error: sErr } = await supabase.from("expense_splits").insert(rows);
    if (sErr) {
      // Roll back the orphaned expense so we don't leave bad data.
      await supabase.from("expenses").delete().eq("id", expense.id);
      setError(sErr.message);
      setSaving(false);
      return;
    }

    router.push(`/groups/${groupId}`);
    router.refresh();
  }

  if (groups.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <FormHeader saving={false} onSave={() => {}} disabled />
        <div className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cloud text-2xl">
            🧾
          </div>
          <p className="font-display text-lg font-bold">No groups yet</p>
          <p className="max-w-xs text-[14px] text-muted">
            Create a group first, then you can add expenses to it.
          </p>
          <Link href="/groups/new" className="btn-primary mt-1">
            Create a group
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-10">
      <FormHeader
        saving={saving}
        onSave={save}
        disabled={!description.trim() || totalCents <= 0}
      />

      <div className="space-y-6 px-5 py-5">
        {/* Group selector (only when more than one) */}
        {groups.length > 1 && (
          <div>
            <label className="label">Group</label>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => onGroupChange(g.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-[14px] font-semibold transition-all duration-75 active:scale-95",
                    g.id === groupId
                      ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                      : "bg-cloud text-ink"
                  )}
                >
                  <span>{g.emoji || "🧾"}</span>
                  {g.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Description + amount */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cloud text-2xl">
              {CATEGORIES.find((c) => c.key === category)?.emoji}
            </div>
            <input
              className="input"
              placeholder="What was it for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              autoFocus
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted">
              ₹
            </span>
            <input
              type="number"
              inputMode="decimal"
              className="input pl-9 text-2xl font-extrabold"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Category chips */}
        <div>
          <label className="label">Category</label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-semibold transition-all duration-75 active:scale-95",
                  c.key === category
                    ? "bg-teal-100 text-teal-700 ring-2 ring-teal-500"
                    : "bg-cloud text-muted"
                )}
              >
                <span className="text-lg">{c.emoji}</span>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Paid by + date */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="label">Paid by</label>
            <select
              value={paidBy}
              onChange={(e) => setPaidBy(e.target.value)}
              className="input appearance-none"
            >
              {members.map((m) => (
                <option key={m} value={m}>
                  {m === meId ? "You" : displayName(profiles[m])}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input"
            />
          </div>
        </div>

        {/* Split type */}
        <div>
          <label className="label">Split</label>
          <div className="flex rounded-xl bg-line/60 p-1 text-[13px] font-bold">
            {(
              [
                ["equal", "Equally"],
                ["exact", "Exact"],
                ["percentage", "Percent"],
              ] as [SplitType, string][]
            ).map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setSplitType(key)}
                className={cn(
                  "flex-1 rounded-lg py-2 transition-all duration-75 active:scale-95",
                  splitType === key ? "bg-white text-ink shadow-card" : "text-muted"
                )}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="mt-3 overflow-hidden rounded-2xl border border-line">
            {members.map((id) => {
              const on = participants.has(id);
              return (
                <div
                  key={id}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5",
                    !on && "opacity-50"
                  )}
                >
                  <button
                    onClick={() => toggleParticipant(id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-md border-2",
                        on ? "border-teal-500 bg-teal-500 text-white" : "border-line"
                      )}
                    >
                      {on && <Check size={13} strokeWidth={3} />}
                    </span>
                    <Avatar profile={profiles[id]} size={32} />
                    <span className="text-[14px] font-semibold">
                      {id === meId ? "You" : displayName(profiles[id])}
                    </span>
                  </button>

                  {on && splitType === "equal" && (
                    <span className="text-[13px] font-semibold text-muted">
                      {preview[id] != null ? formatMoney(preview[id]) : "—"}
                    </span>
                  )}
                  {on && splitType === "exact" && (
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                        ₹
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={manual[id] ?? ""}
                        onChange={(e) =>
                          setManual((m) => ({ ...m, [id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-line py-1.5 pl-5 pr-2 text-right text-[14px] font-semibold outline-none focus:border-teal-500"
                      />
                    </div>
                  )}
                  {on && splitType === "percentage" && (
                    <div className="relative w-20">
                      <input
                        type="number"
                        inputMode="decimal"
                        value={manual[id] ?? ""}
                        onChange={(e) =>
                          setManual((m) => ({ ...m, [id]: e.target.value }))
                        }
                        placeholder="0"
                        className="w-full rounded-lg border border-line py-1.5 pl-2 pr-6 text-right text-[14px] font-semibold outline-none focus:border-teal-500"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[13px] text-muted">
                        %
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Split status line */}
          {totalCents > 0 && participantIds.length > 0 && (
            <div className="mt-2 flex items-center justify-between px-1 text-[12.5px]">
              <span className="flex items-center gap-1 text-muted">
                <Users2 size={14} /> {participantIds.length} of {members.length}
              </span>
              {splitType === "exact" ? (
                <span
                  className={cn(
                    "font-semibold",
                    previewSumCents === totalCents ? "text-owed" : "text-owe"
                  )}
                >
                  {formatMoney(previewSum)} of {formatMoney(totalCents / 100)}
                </span>
              ) : splitType === "percentage" ? (
                <span
                  className={cn(
                    "font-semibold",
                    Math.round(pctSum) === 100 ? "text-owed" : "text-owe"
                  )}
                >
                  {pctSum.toFixed(0)}% of 100%
                </span>
              ) : (
                <span className="font-semibold text-muted">
                  {formatMoney(totalCents / participantIds.length / 100)} each
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-owe/10 px-3 py-2.5 text-[13px] font-medium text-owe">
            {error}
          </p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary w-full"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            "Save expense"
          )}
        </button>
      </div>
    </div>
  );
}

function FormHeader({
  saving,
  onSave,
  disabled,
}: {
  saving: boolean;
  onSave: () => void;
  disabled?: boolean;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-4 py-3">
      <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-cloud">
        <ArrowLeft size={22} />
      </Link>
      <h1 className="font-display text-lg font-bold">Add an expense</h1>
      <button
        onClick={onSave}
        disabled={saving || disabled}
        className="ml-auto text-[15px] font-bold text-teal-600 disabled:text-muted"
      >
        {saving ? <Loader2 size={20} className="animate-spin" /> : "Save"}
      </button>
    </header>
  );
}
