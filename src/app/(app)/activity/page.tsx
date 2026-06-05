import Link from "next/link";
import { Receipt, HandCoins } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadWorkspace } from "@/lib/data";
import { categoryEmoji } from "@/lib/categories";
import { displayName, formatMoney, formatDate } from "@/lib/utils";
import { Expense, ExpenseSplit, Group, Settlement } from "@/lib/types";

export const dynamic = "force-dynamic";

type Item =
  | { kind: "expense"; ts: string; group: Group; data: Expense; splits: ExpenseSplit[] }
  | { kind: "settle"; ts: string; group: Group; data: Settlement };

export default async function ActivityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ws = await loadWorkspace(supabase, user.id);
  const groupById: Record<string, Group> = {};
  for (const g of ws.groups) groupById[g.id] = g;

  const items: Item[] = [];
  for (const g of ws.groups) {
    for (const e of ws.expensesByGroup[g.id] ?? []) {
      items.push({
        kind: "expense",
        ts: e.created_at,
        group: g,
        data: e,
        splits: ws.splitsByExpense[e.id] ?? [],
      });
    }
    for (const s of ws.settlementsByGroup[g.id] ?? []) {
      items.push({ kind: "settle", ts: s.created_at, group: g, data: s });
    }
  }
  items.sort((a, b) => (a.ts < b.ts ? 1 : -1));

  return (
    <div>
      <header className="teal-gradient relative overflow-hidden px-5 pb-6 pt-6">
        <div className="bg-dotted pointer-events-none absolute inset-0 opacity-40" />
        <h1 className="relative font-display text-2xl font-extrabold text-white">
          Activity
        </h1>
        <p className="relative mt-0.5 text-[13px] text-white/85">
          Everything happening across your groups
        </p>
      </header>

      <div className="px-4 py-4">
        {items.length === 0 ? (
          <div className="card flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Receipt size={32} className="text-muted" />
            <p className="font-display text-base font-bold">Nothing yet</p>
            <p className="max-w-xs text-[13px] text-muted">
              When you add expenses or settle up, it will show up here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) =>
              item.kind === "expense" ? (
                <ExpenseItem
                  key={item.data.id}
                  meId={user.id}
                  item={item}
                  delay={i * 25}
                />
              ) : (
                <SettleItem
                  key={item.data.id}
                  meId={user.id}
                  item={item}
                  profiles={ws.profiles}
                  delay={i * 25}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExpenseItem({
  meId,
  item,
  delay,
}: {
  meId: string;
  item: Extract<Item, { kind: "expense" }>;
  delay: number;
}) {
  const { data: expense, splits, group } = item;
  const myShare = splits.find((s) => s.user_id === meId)?.amount ?? 0;
  const paidByMe = expense.paid_by === meId;
  const involvement = paidByMe
    ? Number(expense.amount) - Number(myShare)
    : -Number(myShare);
  const settled = Math.abs(involvement) < 0.005;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="card rise flex items-center gap-3 px-3.5 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cloud text-lg">
        {categoryEmoji(expense.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-ink">{expense.description}</p>
        <p className="truncate text-[12.5px] text-muted">
          {group.emoji || "🧾"} {group.name} · {formatDate(expense.expense_date)}
        </p>
      </div>
      <div className="text-right">
        {settled ? (
          <p className="text-[12px] font-semibold text-muted">not involved</p>
        ) : (
          <>
            <p
              className={`text-[12px] font-semibold ${
                involvement > 0 ? "text-owed" : "text-owe"
              }`}
            >
              {involvement > 0 ? "you lent" : "you borrowed"}
            </p>
            <p
              className={`font-bold ${
                involvement > 0 ? "text-owed" : "text-owe"
              }`}
            >
              {formatMoney(Math.abs(involvement))}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}

function SettleItem({
  meId,
  item,
  profiles,
  delay,
}: {
  meId: string;
  item: Extract<Item, { kind: "settle" }>;
  profiles: Record<string, import("@/lib/types").Profile>;
  delay: number;
}) {
  const { data: s, group } = item;
  const payer = s.payer_id === meId ? "You" : displayName(profiles[s.payer_id]);
  const payee = s.payee_id === meId ? "you" : displayName(profiles[s.payee_id]);

  return (
    <Link
      href={`/groups/${group.id}`}
      className="rise flex items-center gap-3 rounded-2xl border border-dashed border-teal-400/50 bg-teal-50 px-3.5 py-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
        <HandCoins size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px]">
          <span className="font-semibold">{payer}</span> paid{" "}
          <span className="font-semibold">{payee}</span>
        </p>
        <p className="truncate text-[12.5px] text-muted">
          {group.emoji || "🧾"} {group.name} · {formatDate(s.created_at)}
        </p>
      </div>
      <p className="font-bold text-teal-700">{formatMoney(Number(s.amount))}</p>
    </Link>
  );
}
