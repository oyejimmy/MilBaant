import type {
  FlatFundAllocation,
  FlatFundExpense,
  FlatFundMemberSummary,
} from "@/lib/types";

export function buildMemberSummaries(
  allocations: FlatFundAllocation[],
  expenses: FlatFundExpense[],
  profiles: Array<{ id: string; full_name: string }>,
): FlatFundMemberSummary[] {
  const map = new Map<string, FlatFundMemberSummary>();

  for (const p of profiles) {
    map.set(p.id, {
      userId: p.id,
      fullName: p.full_name,
      totalAllocated: 0,
      totalSpent: 0,
      balance: 0,
    });
  }

  for (const a of allocations) {
    const existing = map.get(a.user_id);
    if (existing) {
      existing.totalAllocated += a.amount;
    } else {
      map.set(a.user_id, {
        userId: a.user_id,
        fullName: a.member?.full_name ?? a.user_id,
        totalAllocated: a.amount,
        totalSpent: 0,
        balance: 0,
      });
    }
  }

  for (const e of expenses) {
    const existing = map.get(e.user_id);
    if (existing) {
      existing.totalSpent += e.amount;
    }
  }

  for (const s of map.values()) {
    s.balance = s.totalAllocated - s.totalSpent;
  }

  return [...map.values()]
    .filter((s) => s.totalAllocated > 0 || s.totalSpent > 0)
    .sort((a, b) => b.totalAllocated - a.totalAllocated);
}
