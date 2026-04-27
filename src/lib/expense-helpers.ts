import { DEFAULT_MEMBER_COUNT, FIXED_EXPENSE_CATEGORIES } from '@/lib/constants'
import type { DebtRow, Expense, Profile, UserMonthlySummary } from '@/lib/types'

export function isFixedExpense(expense: Expense) {
  return FIXED_EXPENSE_CATEGORIES.includes(expense.category)
}

export function splitExpensesByType(expenses: Expense[]) {
  const fixedExpenses = expenses.filter(isFixedExpense)
  const weekendExpenses = expenses.filter(
    (expense) => expense.category === 'weekend_meal',
  )

  return { fixedExpenses, weekendExpenses }
}

export function calculateFixedTotal(expenses: Expense[]) {
  return expenses.reduce((total, expense) => total + expense.amount, 0)
}

export function calculatePerMemberShare(total: number, memberCount?: number) {
  const normalizedCount =
    memberCount && memberCount > 0 ? memberCount : DEFAULT_MEMBER_COUNT

  return total / normalizedCount
}

export function calculateWeekendExpenseShare(expense: Expense) {
  const participantCount = expense.expense_participants.length

  if (participantCount === 0) {
    return 0
  }

  return expense.amount / participantCount
}

export function buildMonthlyUserSummary(
  profiles: Profile[],
  fixedShare: number,
  weekendExpenses: Expense[],
) {
  const weekendShareMap = new Map<string, number>()

  weekendExpenses.forEach((expense) => {
    const share = calculateWeekendExpenseShare(expense)

    expense.expense_participants.forEach((participant) => {
      const currentShare = weekendShareMap.get(participant.user_id) ?? 0
      weekendShareMap.set(participant.user_id, currentShare + share)
    })
  })

  return profiles.map<UserMonthlySummary>((profile) => {
    const weekendShare = weekendShareMap.get(profile.id) ?? 0

    return {
      userId: profile.id,
      fullName: profile.full_name,
      fixedShare,
      weekendShare,
      totalOwed: fixedShare + weekendShare,
    }
  })
}

/**
 * Build a simplified debt matrix from weekend expenses.
 * For each expense, the payer (creator) fronted the full amount.
 * Each participant owes the payer their share.
 * Returns net debts after cancellation (A owes B and B owes A → net one direction).
 */
export function buildDebtMatrix(
  weekendExpenses: Expense[],
  profiles: Profile[],
): DebtRow[] {
  const profileMap = new Map(profiles.map((p) => [p.id, p.full_name]))

  // net[A][B] = how much A owes B (can be negative meaning B owes A)
  const net = new Map<string, Map<string, number>>()

  function addDebt(fromId: string, toId: string, amount: number) {
    if (fromId === toId || amount === 0) return
    if (!net.has(fromId)) net.set(fromId, new Map())
    const row = net.get(fromId)!
    row.set(toId, (row.get(toId) ?? 0) + amount)
  }

  for (const expense of weekendExpenses) {
    const payerId = expense.created_by
    const share = calculateWeekendExpenseShare(expense)
    for (const p of expense.expense_participants) {
      if (p.user_id !== payerId) {
        // participant owes payer their share
        addDebt(p.user_id, payerId, share)
      }
    }
  }

  // Simplify: for each pair (A,B) keep only the net direction
  const rows: DebtRow[] = []
  const visited = new Set<string>()

  for (const [fromId, toMap] of net) {
    for (const [toId, amount] of toMap) {
      const pairKey = [fromId, toId].sort().join('|')
      if (visited.has(pairKey)) continue
      visited.add(pairKey)

      const reverse = net.get(toId)?.get(fromId) ?? 0
      const net_ = amount - reverse

      if (Math.abs(net_) < 0.01) continue // settled

      const [debtorId, creditorId, netAmt] =
        net_ > 0 ? [fromId, toId, net_] : [toId, fromId, -net_]

      rows.push({
        fromId: debtorId,
        fromName: profileMap.get(debtorId) ?? debtorId,
        toId: creditorId,
        toName: profileMap.get(creditorId) ?? creditorId,
        netAmount: netAmt,
      })
    }
  }

  return rows.sort((a, b) => b.netAmount - a.netAmount)
}
