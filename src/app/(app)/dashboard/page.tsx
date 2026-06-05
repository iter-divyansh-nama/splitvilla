import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { loadWorkspace, splitsForGroup } from "@/lib/data";
import { computeGroupNet } from "@/lib/balances";
import { formatMoney, displayName } from "@/lib/utils";
import { Wordmark } from "@/components/Logo";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ws = await loadWorkspace(supabase, user.id);
  const me = ws.profiles[user.id];

  let totalOwed = 0;
  let totalOwe = 0;

  const cards = ws.groups
    .map((g) => {
      const members = ws.memberIdsByGroup[g.id] ?? [];
      const net = computeGroupNet(
        members,
        ws.expensesByGroup[g.id] ?? [],
        splitsForGroup(ws, g.id),
        ws.settlementsByGroup[g.id] ?? []
      );
      const myNet = net[user.id] ?? 0;
      if (myNet > 0.005) totalOwed += myNet;
      else if (myNet < -0.005) totalOwe += -myNet;
      return { group: g, myNet };
    })
    .sort((a, b) => Math.abs(b.myNet) - Math.abs(a.myNet));

  const net = totalOwed - totalOwe;

  return (
    <div>
      {/* Header */}
      <header className="teal-gradient relative overflow-hidden px-5 pb-20 pt-6">
        <div className="bg-dotted pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative flex items-center justify-between text-white">
          <Wordmark size={28} />
          <span className="text-[14px] font-medium text-white/90">
            Hi, {displayName(me).split(" ")[0]}
          </span>
        </div>

        <div className="relative mt-6 text-white">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-white/80">
            {net > 0.005
              ? "You are owed overall"
              : net < -0.005
              ? "You owe overall"
              : "You're all settled up"}
          </p>
          <p className="mt-1 font-display text-4xl font-extrabold">
            {net === 0 ? "₹0" : formatMoney(Math.abs(net))}
          </p>
          <div className="mt-3 flex gap-4 text-[13px]">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              owed {formatMoney(totalOwed)}
            </span>
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold">
              owe {formatMoney(totalOwe)}
            </span>
          </div>
        </div>
      </header>

      {/* Group list */}
      <section className="-mt-12 px-4">
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-display text-[15px] font-bold text-white/0">.</h2>
        </div>

        <div className="space-y-2.5">
          {cards.length === 0 && (
            <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
              <div className="teal-gradient flex h-14 w-14 items-center justify-center rounded-2xl text-2xl">
                🧾
              </div>
              <p className="font-display text-lg font-bold text-ink">
                No groups yet
              </p>
              <p className="max-w-xs text-[14px] text-muted">
                Create a group for your trip, flat, or friends to start
                splitting expenses.
              </p>
              <Link href="/groups/new" className="btn-primary mt-1">
                <Plus size={18} /> Create a group
              </Link>
            </div>
          )}

          {cards.map(({ group, myNet }, i) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="card rise flex items-center gap-3 px-3.5 py-3.5"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cloud text-2xl">
                {group.emoji || "🧾"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[16px] font-bold text-ink">
                  {group.name}
                </p>
                <BalanceLine myNet={myNet} />
              </div>
              <ChevronRight size={20} className="text-muted" />
            </Link>
          ))}
        </div>

        {cards.length > 0 && (
          <Link
            href="/groups/new"
            className="btn-ghost mt-4 w-full border border-dashed border-line bg-white"
          >
            <Plus size={18} /> Create a group
          </Link>
        )}
      </section>
    </div>
  );
}

function BalanceLine({ myNet }: { myNet: number }) {
  if (Math.abs(myNet) < 0.005)
    return <p className="text-[13px] font-medium text-muted">settled up</p>;
  const owed = myNet > 0;
  return (
    <p className="text-[13px] font-semibold">
      <span className={owed ? "text-owed" : "text-owe"}>
        {owed ? "you are owed " : "you owe "}
        {formatMoney(Math.abs(myNet))}
      </span>
    </p>
  );
}
