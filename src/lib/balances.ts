import { DebtTransfer, Expense, ExpenseSplit, Settlement } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Compute the net position of every member in a group.
 *   net > 0  => the member is OWED money (others owe them)
 *   net < 0  => the member OWES money
 *
 * Logic:
 *   - Paying for an expense increases your net by the full amount.
 *   - Your share of an expense decreases your net by that share.
 *   - A settlement: payer hands cash to payee, so the payer's net goes UP
 *     (debt cleared) and the payee's net goes DOWN (they're owed less).
 */
export function computeGroupNet(
  memberIds: string[],
  expenses: Expense[],
  splits: ExpenseSplit[],
  settlements: Settlement[]
): Record<string, number> {
  const net: Record<string, number> = {};
  for (const id of memberIds) net[id] = 0;

  const splitsByExpense: Record<string, ExpenseSplit[]> = {};
  for (const s of splits) {
    (splitsByExpense[s.expense_id] ||= []).push(s);
  }

  for (const e of expenses) {
    net[e.paid_by] = (net[e.paid_by] ?? 0) + Number(e.amount);
    for (const s of splitsByExpense[e.id] ?? []) {
      net[s.user_id] = (net[s.user_id] ?? 0) - Number(s.amount);
    }
  }

  for (const st of settlements) {
    net[st.payer_id] = (net[st.payer_id] ?? 0) + Number(st.amount);
    net[st.payee_id] = (net[st.payee_id] ?? 0) - Number(st.amount);
  }

  for (const id of Object.keys(net)) net[id] = round2(net[id]);
  return net;
}

/**
 * Greedy debt simplification — turns a set of net balances into the minimum
 * sensible list of "X pays Y" transfers. Works in integer cents to avoid
 * floating point drift.
 */
export function simplifyDebts(net: Record<string, number>): DebtTransfer[] {
  const creditors: { id: string; amt: number }[] = [];
  const debtors: { id: string; amt: number }[] = [];

  for (const [id, v] of Object.entries(net)) {
    const cents = Math.round(v * 100);
    if (cents > 0) creditors.push({ id, amt: cents });
    else if (cents < 0) debtors.push({ id, amt: -cents });
  }

  creditors.sort((a, b) => b.amt - a.amt);
  debtors.sort((a, b) => b.amt - a.amt);

  const transfers: DebtTransfer[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    if (pay > 0) {
      transfers.push({
        from: debtors[i].id,
        to: creditors[j].id,
        amount: pay / 100,
      });
    }
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt === 0) i++;
    if (creditors[j].amt === 0) j++;
  }
  return transfers;
}

/**
 * Aggregate simplified transfers from multiple groups into a per-counterpart
 * balance relative to `meId`.
 *   value > 0 => that person owes me
 *   value < 0 => I owe that person
 */
export function aggregateUserBalances(
  meId: string,
  perGroupTransfers: DebtTransfer[][]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const transfers of perGroupTransfers) {
    for (const t of transfers) {
      if (t.to === meId) {
        result[t.from] = round2((result[t.from] ?? 0) + t.amount);
      } else if (t.from === meId) {
        result[t.to] = round2((result[t.to] ?? 0) - t.amount);
      }
    }
  }
  // Drop settled-to-zero entries
  for (const k of Object.keys(result)) {
    if (Math.abs(result[k]) < 0.005) delete result[k];
  }
  return result;
}
