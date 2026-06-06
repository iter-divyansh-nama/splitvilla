import { createClient } from "@/lib/supabase/server";
import { loadWorkspace, splitsForGroup } from "@/lib/data";
import { computeGroupNet } from "@/lib/balances";
import { CATEGORIES } from "@/lib/categories";
import { formatMoney, displayName } from "@/lib/utils";
import StatsClient from "./StatsClient";

export const dynamic = "force-dynamic";

export default async function StatsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const ws = await loadWorkspace(supabase, user.id);

  // ---- Category breakdown ----
  const catTotals: Record<string, number> = {};
  let totalSpent = 0;

  for (const g of ws.groups) {
    for (const e of ws.expensesByGroup[g.id] ?? []) {
      const amt = Number(e.amount);
      catTotals[e.category] = (catTotals[e.category] ?? 0) + amt;
      totalSpent += amt;
    }
  }

  const categoryData = CATEGORIES
    .filter((c) => (catTotals[c.key] ?? 0) > 0)
    .map((c) => ({
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      amount: catTotals[c.key],
      percent: totalSpent > 0 ? Math.round((catTotals[c.key] / totalSpent) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ---- Owed vs Owe per group ----
  let totalOwed = 0;
  let totalOwe = 0;

  const groupBalances: { name: string; emoji: string; net: number }[] = [];

  for (const g of ws.groups) {
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
    if (Math.abs(myNet) > 0.005) {
      groupBalances.push({ name: g.name, emoji: g.emoji || "🧾", net: myNet });
    }
  }

  groupBalances.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  // ---- Per-person balances ----
  const personNet: Record<string, number> = {};
  for (const g of ws.groups) {
    const members = ws.memberIdsByGroup[g.id] ?? [];
    const net = computeGroupNet(
      members,
      ws.expensesByGroup[g.id] ?? [],
      splitsForGroup(ws, g.id),
      ws.settlementsByGroup[g.id] ?? []
    );
    for (const [uid, val] of Object.entries(net)) {
      if (uid === user.id) continue;
      // From my perspective: if uid has positive net, they are owed (I owe them)
      // We want the *relative* balance to me
      const myVal = net[user.id] ?? 0;
      // skip — we compute differently via splits
    }
  }

  // ---- My expenses (what I paid for) ----
  let myTotalPaid = 0;
  const myExpensesByCategory: Record<string, number> = {};
  for (const g of ws.groups) {
    for (const e of ws.expensesByGroup[g.id] ?? []) {
      if (e.paid_by === user.id) {
        myTotalPaid += Number(e.amount);
        myExpensesByCategory[e.category] = (myExpensesByCategory[e.category] ?? 0) + Number(e.amount);
      }
    }
  }

  const myExpenseData = CATEGORIES
    .filter((c) => (myExpensesByCategory[c.key] ?? 0) > 0)
    .map((c) => ({
      key: c.key,
      label: c.label,
      emoji: c.emoji,
      amount: myExpensesByCategory[c.key],
      percent: myTotalPaid > 0 ? Math.round((myExpensesByCategory[c.key] / myTotalPaid) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // ---- Top Spenders ----
  const userSpent: Record<string, number> = {};
  for (const g of ws.groups) {
    for (const e of ws.expensesByGroup[g.id] ?? []) {
      userSpent[e.paid_by] = (userSpent[e.paid_by] ?? 0) + Number(e.amount);
    }
  }

  const topSpenders = Object.entries(userSpent)
    .map(([uid, amount]) => ({
      id: uid,
      name: displayName(ws.profiles[uid]),
      amount,
      isMe: uid === user.id,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return (
    <StatsClient
      totalSpent={totalSpent}
      totalOwed={totalOwed}
      totalOwe={totalOwe}
      myTotalPaid={myTotalPaid}
      categoryData={categoryData}
      myExpenseData={myExpenseData}
      groupBalances={groupBalances}
      topSpenders={topSpenders}
      groupCount={ws.groups.length}
      expenseCount={Object.values(ws.expensesByGroup).flat().length}
    />
  );
}
