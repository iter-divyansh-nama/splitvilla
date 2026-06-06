"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Receipt,
  Scale,
  Trash2,
  ChevronDown,
  HandCoins,
  UserPlus,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  DebtTransfer,
  Expense,
  ExpenseSplit,
  Group,
  Profile,
  Settlement,
} from "@/lib/types";
import { Avatar } from "@/components/Avatar";
import { SettleUpModal } from "@/components/SettleUpModal";
import { cn, displayName, formatMoney, formatDate } from "@/lib/utils";

type ExpenseWithSplits = Expense & { splits: ExpenseSplit[] };

export function GroupView({
  group,
  meId,
  memberIds,
  profiles,
  expenses,
  settlements,
  net,
  transfers,
}: {
  group: Group;
  meId: string;
  memberIds: string[];
  profiles: Record<string, Profile>;
  expenses: ExpenseWithSplits[];
  settlements: Settlement[];
  net: Record<string, number>;
  transfers: DebtTransfer[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"expenses" | "balances">("expenses");
  const [settle, setSettle] = useState<null | {
    from?: string;
    to?: string;
    amount?: number;
  }>(null);
  const [addOpen, setAddOpen] = useState(false);

  const myNet = net[meId] ?? 0;

  // transfers that involve me, for the summary
  const myTransfers = transfers.filter((t) => t.from === meId || t.to === meId);

  return (
    <div>
      {/* Header */}
      <header className="teal-gradient relative overflow-hidden px-4 pb-6 pt-5">
        <div className="bg-dotted pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-center gap-2 text-white">
          <Link href="/dashboard" className="rounded-full p-1.5 hover:bg-white/10">
            <ArrowLeft size={22} />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-xl">
            {group.emoji || "🧾"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-extrabold">
              {group.name}
            </h1>
            <p className="text-[12.5px] text-white/85">
              {memberIds.length} member{memberIds.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-full bg-white/15 p-2 hover:bg-white/25"
            aria-label="Manage members"
          >
            <UserPlus size={20} />
          </button>
        </div>

        {/* My balance */}
        <div className="relative mt-5 text-white">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">
            {Math.abs(myNet) < 0.005
              ? "You are settled up"
              : myNet > 0
              ? "You are owed"
              : "You owe"}
          </p>
          <p className="mt-0.5 font-display text-3xl font-extrabold">
            {Math.abs(myNet) < 0.005 ? "₹0" : formatMoney(Math.abs(myNet))}
          </p>
        </div>

        <div className="relative mt-4 flex gap-2">
          <Link
            href={`/expense/new?group=${group.id}`}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white py-2.5 text-[14px] font-bold text-teal-700 shadow-card active:scale-[.98]"
          >
            <Plus size={18} /> Add expense
          </Link>
          <button
            onClick={() => setSettle({})}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/15 py-2.5 text-[14px] font-bold text-white active:scale-[.98]"
          >
            <HandCoins size={18} /> Settle up
          </button>
        </div>
      </header>

      {/* My owe/owed quick lines */}
      {myTransfers.length > 0 && (
        <div className="space-y-1.5 px-4 pt-4">
          {myTransfers.map((t, i) => {
            const owed = t.to === meId;
            const other = owed ? t.from : t.to;
            return (
              <div
                key={i}
                className="card flex items-center gap-3 px-3.5 py-2.5"
              >
                <Avatar profile={profiles[other]} size={36} />
                <p className="flex-1 text-[14px]">
                  {owed ? (
                    <>
                      <span className="font-semibold">
                        {displayName(profiles[other])}
                      </span>{" "}
                      owes you{" "}
                      <span className="font-bold text-owed">
                        {formatMoney(t.amount)}
                      </span>
                    </>
                  ) : (
                    <>
                      You owe{" "}
                      <span className="font-semibold">
                        {displayName(profiles[other])}
                      </span>{" "}
                      <span className="font-bold text-owe">
                        {formatMoney(t.amount)}
                      </span>
                    </>
                  )}
                </p>
                {!owed && (
                  <button
                    onClick={() =>
                      setSettle({ from: meId, to: other, amount: t.amount })
                    }
                    className="pill bg-teal-100 text-teal-700"
                  >
                    Settle
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tabs */}
      <div className="mt-4 px-4">
        <div className="flex rounded-xl bg-line/60 p-1 text-[14px] font-bold">
          <TabBtn active={tab === "expenses"} onClick={() => setTab("expenses")}>
            <Receipt size={16} /> Expenses
          </TabBtn>
          <TabBtn active={tab === "balances"} onClick={() => setTab("balances")}>
            <Scale size={16} /> Balances
          </TabBtn>
        </div>
      </div>

      <div className="px-4 py-4">
        {tab === "expenses" ? (
          <ExpensesFeed
            meId={meId}
            group={group}
            profiles={profiles}
            expenses={expenses}
            settlements={settlements}
            onChanged={() => router.refresh()}
          />
        ) : (
          <BalancesList meId={meId} net={net} profiles={profiles} />
        )}
      </div>

      {settle && (
        <SettleUpModal
          groupId={group.id}
          meId={meId}
          members={memberIds}
          profiles={profiles}
          presetFrom={settle.from}
          presetTo={settle.to}
          presetAmount={settle.amount}
          onClose={() => setSettle(null)}
        />
      )}

      {addOpen && (
        <ManageMembers
          group={group}
          meId={meId}
          memberIds={memberIds}
          profiles={profiles}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 transition-all duration-75 active:scale-95",
        active ? "bg-white text-ink shadow-card" : "text-muted"
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------- Expenses feed ----------------------------- */

function ExpensesFeed({
  meId,
  group,
  profiles,
  expenses,
  settlements,
  onChanged,
}: {
  meId: string;
  group: Group;
  profiles: Record<string, Profile>;
  expenses: ExpenseWithSplits[];
  settlements: Settlement[];
  onChanged: () => void;
}) {
  type Item =
    | { kind: "expense"; ts: string; data: ExpenseWithSplits }
    | { kind: "settle"; ts: string; data: Settlement };

  const items: Item[] = useMemo(() => {
    const e = expenses.map((x) => ({
      kind: "expense" as const,
      ts: x.created_at,
      data: x,
    }));
    const s = settlements.map((x) => ({
      kind: "settle" as const,
      ts: x.created_at,
      data: x,
    }));
    return [...e, ...s].sort((a, b) => (a.ts < b.ts ? 1 : -1));
  }, [expenses, settlements]);

  if (items.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Receipt size={32} className="text-muted" />
        <p className="font-display text-base font-bold">No expenses yet</p>
        <p className="max-w-xs text-[13px] text-muted">
          Tap “Add expense” to record the first one.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) =>
        item.kind === "expense" ? (
          <ExpenseRow
            key={item.data.id}
            meId={meId}
            expense={item.data}
            profiles={profiles}
            onChanged={onChanged}
            delay={i * 30}
          />
        ) : (
          <SettleRow
            key={item.data.id}
            meId={meId}
            settlement={item.data}
            profiles={profiles}
            onChanged={onChanged}
            delay={i * 30}
          />
        )
      )}
    </div>
  );
}

function ExpenseRow({
  meId,
  expense,
  profiles,
  onChanged,
  delay,
}: {
  meId: string;
  expense: ExpenseWithSplits;
  profiles: Record<string, Profile>;
  onChanged: () => void;
  delay: number;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const myShare =
    expense.splits.find((s) => s.user_id === meId)?.amount ?? 0;
  const paidByMe = expense.paid_by === meId;
  const involvement = paidByMe
    ? Number(expense.amount) - Number(myShare)
    : -Number(myShare);

  async function remove() {
    setDeleting(true);
    await supabase.from("expenses").delete().eq("id", expense.id);
    setDeleting(false);
    onChanged();
  }

  return (
    <div className="card rise overflow-hidden" style={{ animationDelay: `${delay}ms` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cloud text-lg">
          {categoryEmoji(expense.category)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">
            {expense.description}
          </p>
          <p className="truncate text-[12.5px] text-muted">
            {displayName(profiles[expense.paid_by])} paid{" "}
            {formatMoney(Number(expense.amount))} · {formatDate(expense.expense_date)}
          </p>
        </div>
        <div className="text-right">
          {Math.abs(involvement) < 0.005 ? (
            <p className="text-[12px] font-semibold text-muted">not involved</p>
          ) : (
            <>
              <p
                className={cn(
                  "text-[12px] font-semibold",
                  involvement > 0 ? "text-owed" : "text-owe"
                )}
              >
                {involvement > 0 ? "you lent" : "you borrowed"}
              </p>
              <p
                className={cn(
                  "font-bold",
                  involvement > 0 ? "text-owed" : "text-owe"
                )}
              >
                {formatMoney(Math.abs(involvement))}
              </p>
            </>
          )}
        </div>
        <ChevronDown
          size={18}
          className={cn("text-muted transition-transform duration-75", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-t border-line bg-cloud/60 px-3.5 py-3">
          <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted">
            Split breakdown
          </p>
          <div className="space-y-1.5">
            {expense.splits.map((s) => (
              <div key={s.id} className="flex items-center gap-2 text-[13.5px]">
                <Avatar profile={profiles[s.user_id]} size={26} />
                <span className="flex-1">{displayName(profiles[s.user_id])}</span>
                <span className="font-semibold">
                  {formatMoney(Number(s.amount))}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={remove}
            disabled={deleting}
            className="mt-3 flex items-center gap-1.5 text-[13px] font-semibold text-owe"
          >
            {deleting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Trash2 size={15} />
            )}
            Delete expense
          </button>
        </div>
      )}
    </div>
  );
}

function SettleRow({
  meId,
  settlement,
  profiles,
  onChanged,
  delay,
}: {
  meId: string;
  settlement: Settlement;
  profiles: Record<string, Profile>;
  onChanged: () => void;
  delay: number;
}) {
  const supabase = createClient();
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    await supabase.from("settlements").delete().eq("id", settlement.id);
    setDeleting(false);
    onChanged();
  }

  return (
    <div
      className="rise flex items-center gap-3 rounded-2xl border border-dashed border-teal-400/50 bg-teal-50 px-3.5 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
        <HandCoins size={18} />
      </div>
      <p className="flex-1 text-[13.5px]">
        <span className="font-semibold">
          {displayName(profiles[settlement.payer_id])}
        </span>{" "}
        paid{" "}
        <span className="font-semibold">
          {displayName(profiles[settlement.payee_id])}
        </span>{" "}
        <span className="font-bold text-teal-700">
          {formatMoney(Number(settlement.amount))}
        </span>
      </p>
      <button onClick={remove} disabled={deleting} aria-label="Delete payment">
        {deleting ? (
          <Loader2 size={15} className="animate-spin text-muted" />
        ) : (
          <Trash2 size={15} className="text-muted" />
        )}
      </button>
    </div>
  );
}

/* ----------------------------- Balances tab ----------------------------- */

function BalancesList({
  meId,
  net,
  profiles,
}: {
  meId: string;
  net: Record<string, number>;
  profiles: Record<string, Profile>;
}) {
  const rows = Object.entries(net).sort((a, b) => b[1] - a[1]);
  return (
    <div className="card divide-y divide-line">
      {rows.map(([id, value]) => {
        const settled = Math.abs(value) < 0.005;
        return (
          <div key={id} className="flex items-center gap-3 px-3.5 py-3">
            <Avatar profile={profiles[id]} size={38} />
            <span className="flex-1 font-semibold text-ink">
              {displayName(profiles[id])} {id === meId && "(you)"}
            </span>
            {settled ? (
              <span className="text-[13px] font-medium text-muted">
                settled up
              </span>
            ) : (
              <span
                className={cn(
                  "text-right text-[13px] font-bold",
                  value > 0 ? "text-owed" : "text-owe"
                )}
              >
                {value > 0 ? "gets back" : "owes"}
                <br />
                {formatMoney(Math.abs(value))}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------- Manage members ----------------------------- */

function ManageMembers({
  group,
  meId,
  memberIds,
  profiles,
  onClose,
}: {
  group: Group;
  meId: string;
  memberIds: string[];
  profiles: Record<string, Profile>;
  onClose: () => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [all, setAll] = useState<Profile[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useMemo(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("full_name")
      .then(({ data }) => setAll((data ?? []) as Profile[]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(id: string) {
    setBusy(id);
    await supabase
      .from("group_members")
      .insert({ group_id: group.id, user_id: id });
    setBusy(null);
    router.refresh();
    onClose();
  }

  async function removeMember(id: string) {
    setBusy(id);
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", group.id)
      .eq("user_id", id);
    setBusy(null);
    router.refresh();
    onClose();
  }

  const others = (all ?? []).filter((p) => !memberIds.includes(p.id));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">Members</h3>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-cloud">
            <X size={20} />
          </button>
        </div>

        <p className="label">In this group</p>
        <div className="mb-4 divide-y divide-line rounded-2xl border border-line">
          {memberIds.map((id) => (
            <div key={id} className="flex items-center gap-3 px-3.5 py-2.5">
              <Avatar profile={profiles[id]} size={34} />
              <span className="flex-1 text-[14px] font-semibold">
                {displayName(profiles[id])} {id === meId && "(you)"}
              </span>
              {id !== meId && (
                <button
                  onClick={() => removeMember(id)}
                  disabled={busy === id}
                  className="text-[13px] font-semibold text-owe"
                >
                  {busy === id ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    "Remove"
                  )}
                </button>
              )}
            </div>
          ))}
        </div>

        <p className="label">Add someone</p>
        {all === null ? (
          <p className="py-4 text-center text-[13px] text-muted">Loading…</p>
        ) : others.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-muted">
            Everyone is already in this group.
          </p>
        ) : (
          <div className="divide-y divide-line rounded-2xl border border-line">
            {others.map((p) => (
              <button
                key={p.id}
                onClick={() => add(p.id)}
                disabled={busy === p.id}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-cloud"
              >
                <Avatar profile={p} size={34} />
                <span className="flex-1 text-[14px] font-semibold">
                  {displayName(p)}
                </span>
                {busy === p.id ? (
                  <Loader2 size={16} className="animate-spin text-teal-600" />
                ) : (
                  <Plus size={18} className="text-teal-600" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- helpers -------------------------------- */

function categoryEmoji(category: string): string {
  const map: Record<string, string> = {
    general: "🧾",
    food: "🍽️",
    groceries: "🛒",
    transport: "🚕",
    travel: "✈️",
    rent: "🏠",
    utilities: "💡",
    entertainment: "🎬",
    shopping: "🛍️",
    health: "💊",
  };
  return map[category] ?? "🧾";
}
