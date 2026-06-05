"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { displayName, formatMoney } from "@/lib/utils";

export function SettleUpModal({
  groupId,
  meId,
  members,
  profiles,
  presetFrom,
  presetTo,
  presetAmount,
  onClose,
}: {
  groupId: string;
  meId: string;
  members: string[];
  profiles: Record<string, Profile>;
  presetFrom?: string;
  presetTo?: string;
  presetAmount?: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [from, setFrom] = useState(presetFrom ?? meId);
  const [to, setTo] = useState(
    presetTo ?? members.find((m) => m !== (presetFrom ?? meId)) ?? meId
  );
  const [amount, setAmount] = useState(
    presetAmount ? String(presetAmount) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const value = parseFloat(amount);
    if (!value || value <= 0) return setError("Enter a valid amount");
    if (from === to) return setError("Payer and receiver must differ");
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("settlements").insert({
      group_id: groupId,
      payer_id: from,
      payee_id: to,
      amount: value,
      created_by: meId,
    });
    setSaving(false);
    if (error) return setError(error.message);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Record a payment</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-cloud">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex items-center justify-center gap-3">
          <PersonPicker
            label="Paid by"
            value={from}
            onChange={setFrom}
            members={members}
            profiles={profiles}
          />
          <ArrowRight size={20} className="mt-6 text-muted" />
          <PersonPicker
            label="Paid to"
            value={to}
            onChange={setTo}
            members={members}
            profiles={profiles}
          />
        </div>

        <label className="label">Amount</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-muted">
            ₹
          </span>
          <input
            type="number"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="input pl-9 text-lg font-bold"
            autoFocus
          />
        </div>

        {error && (
          <p className="mt-2 text-[13px] font-medium text-owe">{error}</p>
        )}

        <button
          onClick={save}
          disabled={saving}
          className="btn-primary mt-5 w-full"
        >
          {saving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            `Record ${amount ? formatMoney(parseFloat(amount) || 0) : "payment"}`
          )}
        </button>
      </div>
    </div>
  );
}

function PersonPicker({
  label,
  value,
  onChange,
  members,
  profiles,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  members: string[];
  profiles: Record<string, Profile>;
}) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="mb-1 text-[12px] font-semibold text-muted">{label}</span>
      <Avatar profile={profiles[value]} size={48} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 max-w-[110px] truncate rounded-lg bg-cloud px-2 py-1 text-center text-[13px] font-semibold"
      >
        {members.map((m) => (
          <option key={m} value={m}>
            {displayName(profiles[m])}
          </option>
        ))}
      </select>
    </div>
  );
}
