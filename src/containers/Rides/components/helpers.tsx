import type { Ride } from "@/lib/types";
import type { DebtEntry } from "../types";

export function buildRideDebts(rides: Ride[]): DebtEntry[] {
  const net = new Map<string, Map<string, number>>();

  for (const ride of rides) {
    const riderCount = ride.ride_riders.length;
    if (riderCount === 0) continue;
    const share = ride.amount / riderCount;

    for (const rider of ride.ride_riders) {
      if (rider.user_id === ride.paid_by) continue;
      const debtor = rider.user_id;
      const creditor = ride.paid_by;
      if (!net.has(debtor)) net.set(debtor, new Map());
      const row = net.get(debtor)!;
      row.set(creditor, (row.get(creditor) ?? 0) + share);
    }
  }

  const result: DebtEntry[] = [];
  const visited = new Set<string>();

  const profileMap = new Map<string, string>();
  for (const ride of rides) {
    if (ride.payer) profileMap.set(ride.payer.id, ride.payer.full_name);
    for (const r of ride.ride_riders) {
      if (r.profile) profileMap.set(r.profile.id, r.profile.full_name);
    }
  }

  for (const [fromId, toMap] of net) {
    for (const [toId, amount] of toMap) {
      const key = [fromId, toId].sort().join("|");
      if (visited.has(key)) continue;
      visited.add(key);

      const reverse = net.get(toId)?.get(fromId) ?? 0;
      const net_ = amount - reverse;
      if (Math.abs(net_) < 0.01) continue;

      const [debtorId, creditorId, netAmt] =
        net_ > 0 ? [fromId, toId, net_] : [toId, fromId, -net_];

      result.push({
        fromId: debtorId,
        fromName: profileMap.get(debtorId) ?? debtorId,
        toId: creditorId,
        toName: profileMap.get(creditorId) ?? creditorId,
        amount: netAmt,
      });
    }
  }

  return result.sort((a, b) => b.amount - a.amount);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
