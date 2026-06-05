// Domain types mirroring the Supabase schema.

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  emoji: string | null;
  created_by: string;
  created_at: string;
}

export type SplitType = "equal" | "exact" | "percentage";

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  category: string;
  paid_by: string;
  split_type: SplitType;
  expense_date: string;
  created_by: string | null;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
}

export interface Settlement {
  id: string;
  group_id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  note: string | null;
  created_by: string | null;
  created_at: string;
}

// A net position per user inside a group (positive = is owed, negative = owes).
export interface MemberBalance {
  userId: string;
  net: number;
}

// A simplified "who pays whom" suggestion.
export interface DebtTransfer {
  from: string; // payer
  to: string; // payee
  amount: number;
}
