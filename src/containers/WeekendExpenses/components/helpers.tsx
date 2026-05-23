import type { DebtRow, DebtSettlement } from "@/lib/types";

export function applySettlements(
  debts: DebtRow[],
  settlements: DebtSettlement[],
): DebtRow[] {
  const settled = new Map<string, number>();
  for (const s of settlements) {
    const key = [s.payer_id, s.payee_id].sort().join("|");
    settled.set(key, (settled.get(key) ?? 0) + s.amount);
  }
  return debts
    .map((debt) => {
      const key = [debt.fromId, debt.toId].sort().join("|");
      return {
        ...debt,
        netAmount: Math.max(0, debt.netAmount - (settled.get(key) ?? 0)),
      };
    })
    .filter((d) => d.netAmount > 0.01);
}
