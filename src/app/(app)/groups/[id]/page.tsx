import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeGroupNet, simplifyDebts } from "@/lib/balances";
import {
  Expense,
  ExpenseSplit,
  Group,
  Profile,
  Settlement,
} from "@/lib/types";
import { GroupView } from "@/components/GroupView";

export const dynamic = "force-dynamic";

export default async function GroupPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!group) notFound();

  const [membersRes, expensesRes, settlementsRes] = await Promise.all([
    supabase.from("group_members").select("user_id").eq("group_id", params.id),
    supabase
      .from("expenses")
      .select("*")
      .eq("group_id", params.id)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("settlements")
      .select("*")
      .eq("group_id", params.id)
      .order("created_at", { ascending: false }),
  ]);

  const memberIds = (membersRes.data ?? []).map((m: any) => m.user_id);
  const expenses = (expensesRes.data ?? []) as Expense[];
  const settlements = (settlementsRes.data ?? []) as Settlement[];

  const expenseIds = expenses.map((e) => e.id);
  const [splitsRes, profilesRes] = await Promise.all([
    expenseIds.length
      ? supabase.from("expense_splits").select("*").in("expense_id", expenseIds)
      : Promise.resolve({ data: [] as ExpenseSplit[] } as any),
    supabase.from("profiles").select("*").in("id", memberIds),
  ]);

  const splits = (splitsRes.data ?? []) as ExpenseSplit[];
  const profiles = (profilesRes.data ?? []) as Profile[];

  const profileMap: Record<string, Profile> = {};
  for (const p of profiles) profileMap[p.id] = p;

  const splitsByExpense: Record<string, ExpenseSplit[]> = {};
  for (const s of splits) (splitsByExpense[s.expense_id] ||= []).push(s);

  const expensesWithSplits = expenses.map((e) => ({
    ...e,
    splits: splitsByExpense[e.id] ?? [],
  }));

  const net = computeGroupNet(memberIds, expenses, splits, settlements);
  const transfers = simplifyDebts(net);

  return (
    <GroupView
      group={group as Group}
      meId={user.id}
      memberIds={memberIds}
      profiles={profileMap}
      expenses={expensesWithSplits}
      settlements={settlements}
      net={net}
      transfers={transfers}
    />
  );
}
