import { SupabaseClient } from "@supabase/supabase-js";
import {
  Expense,
  ExpenseSplit,
  Group,
  Profile,
  Settlement,
} from "./types";

export interface Workspace {
  me: string;
  profiles: Record<string, Profile>;
  groups: Group[];
  memberIdsByGroup: Record<string, string[]>;
  expensesByGroup: Record<string, Expense[]>;
  splitsByExpense: Record<string, ExpenseSplit[]>;
  settlementsByGroup: Record<string, Settlement[]>;
}

const empty = (me: string): Workspace => ({
  me,
  profiles: {},
  groups: [],
  memberIdsByGroup: {},
  expensesByGroup: {},
  splitsByExpense: {},
  settlementsByGroup: {},
});

/** Loads everything the current user can see in one batch of queries. */
export async function loadWorkspace(
  supabase: SupabaseClient,
  userId: string
): Promise<Workspace> {
  const ws = empty(userId);

  // 1. My memberships -> group ids
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const groupIds = (myMemberships ?? []).map((m: any) => m.group_id);
  if (groupIds.length === 0) {
    // still load my own profile for the header
    const { data: meProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (meProfile) ws.profiles[userId] = meProfile as Profile;
    return ws;
  }

  // 2. Groups + all members + expenses + settlements in parallel
  const [groupsRes, membersRes, expensesRes, settlementsRes] = await Promise.all([
    supabase.from("groups").select("*").in("id", groupIds),
    supabase.from("group_members").select("*").in("group_id", groupIds),
    supabase
      .from("expenses")
      .select("*")
      .in("group_id", groupIds)
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("settlements")
      .select("*")
      .in("group_id", groupIds)
      .order("created_at", { ascending: false }),
  ]);

  ws.groups = (groupsRes.data ?? []) as Group[];

  const memberRows = (membersRes.data ?? []) as any[];
  const memberUserIds = new Set<string>([userId]);
  for (const m of memberRows) {
    (ws.memberIdsByGroup[m.group_id] ||= []).push(m.user_id);
    memberUserIds.add(m.user_id);
  }

  ws.expensesByGroup = {};
  const expenses = (expensesRes.data ?? []) as Expense[];
  const expenseIds: string[] = [];
  for (const e of expenses) {
    (ws.expensesByGroup[e.group_id] ||= []).push(e);
    expenseIds.push(e.id);
  }

  const settlements = (settlementsRes.data ?? []) as Settlement[];
  for (const s of settlements) {
    (ws.settlementsByGroup[s.group_id] ||= []).push(s);
  }

  // 3. Splits + profiles
  const [splitsRes, profilesRes] = await Promise.all([
    expenseIds.length
      ? supabase.from("expense_splits").select("*").in("expense_id", expenseIds)
      : Promise.resolve({ data: [] as ExpenseSplit[] } as any),
    supabase.from("profiles").select("*").in("id", Array.from(memberUserIds)),
  ]);

  for (const s of (splitsRes.data ?? []) as ExpenseSplit[]) {
    (ws.splitsByExpense[s.expense_id] ||= []).push(s);
  }
  for (const p of (profilesRes.data ?? []) as Profile[]) {
    ws.profiles[p.id] = p;
  }

  return ws;
}

/** Flatten all splits for a group's expenses (used by balance math). */
export function splitsForGroup(ws: Workspace, groupId: string): ExpenseSplit[] {
  const out: ExpenseSplit[] = [];
  for (const e of ws.expensesByGroup[groupId] ?? []) {
    out.push(...(ws.splitsByExpense[e.id] ?? []));
  }
  return out;
}
