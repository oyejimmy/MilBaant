import { useMemo } from 'react'
import dayjs from 'dayjs'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ADVANCE_CATEGORY_KEYS, QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type {
  AdvanceCategoryKey,
  ContributionBreakdown,
  MonthlyBudget,
  MonthlyContribution,
  SavePlanInput,
} from '@/lib/types'

/* ── Normalise polymorphic Supabase profile joins ──────────────────────────── */

type RawProfile =
  | Array<{ id: string; full_name: string }>
  | { id: string; full_name: string }
  | null

function pickProfile(raw: RawProfile) {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

/* ── Fetch helpers ────────────────────────────────────────────────────────── */

async function fetchMonthlyContribution(month: string): Promise<MonthlyContribution | null> {
  const { data, error } = await supabase
    .from('monthly_contributions')
    .select(
      'id, month, total_budget, flatmate_count, per_person_default, is_published, published_at, published_by, created_by, created_at, updated_at',
    )
    .eq('month', month)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return {
    ...data,
    total_budget:       Number(data.total_budget),
    flatmate_count:     Number(data.flatmate_count),
    per_person_default: Number(data.per_person_default),
  } as MonthlyContribution
}

async function fetchMonthlyBudgets(month: string): Promise<MonthlyBudget[]> {
  const { data, error } = await supabase
    .from('monthly_budget')
    .select('id, month, category_key, budget_amount, created_by, created_at, updated_at')
    .eq('month', month)

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    budget_amount: Number(r.budget_amount),
  })) as MonthlyBudget[]
}

async function fetchContributionBreakdowns(planId: string): Promise<ContributionBreakdown[]> {
  const { data, error } = await supabase
    .from('contribution_breakdown')
    .select(
      'id, monthly_contribution_id, user_id, override_amount, note, created_at, updated_at, member:profiles!contribution_breakdown_user_id_fkey(id, full_name)',
    )
    .eq('monthly_contribution_id', planId)

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    override_amount: r.override_amount !== null ? Number(r.override_amount) : null,
    member: pickProfile(r.member as RawProfile),
  })) as ContributionBreakdown[]
}

/**
 * Computes the real carryover for a given month by reading actual transaction
 * data from the previous month:
 *
 *   carryover = sum(contribution_payments for prevMonth)
 *             − sum(fixed expenses for prevMonth)
 *
 * A positive value means there was money left over (savings).
 * A negative value means expenses exceeded collections (deficit — treated as 0
 * carryover; the deficit is a separate concern).
 */
async function fetchComputedCarryover(month: string): Promise<number> {
  const prevMonth     = dayjs(month).subtract(1, 'month').format('YYYY-MM')
  const prevMonthStart = dayjs(prevMonth).startOf('month').format('YYYY-MM-DD')
  const prevMonthEnd   = dayjs(prevMonth).endOf('month').format('YYYY-MM-DD')

  // Fetch previous month's contribution payments
  const { data: payments, error: paymentsError } = await supabase
    .from('contribution_payments')
    .select('amount')
    .eq('month', prevMonth)

  if (paymentsError) throw new Error(paymentsError.message)

  // Fetch previous month's fixed expenses (all non-weekend categories)
  const { data: expenses, error: expensesError } = await supabase
    .from('expenses')
    .select('amount, category')
    .gte('date', prevMonthStart)
    .lte('date', prevMonthEnd)
    .neq('category', 'weekend_meal')

  if (expensesError) throw new Error(expensesError.message)

  const totalCollected = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0)
  const totalExpenses  = (expenses  ?? []).reduce((s, e) => s + Number(e.amount), 0)

  // Carryover is the surplus; deficit is not carried forward as negative
  return Math.max(0, totalCollected - totalExpenses)
}

/* ── Main query hook ──────────────────────────────────────────────────────── */

export function useAdvanceContribution(month: string) {
  const planQuery = useQuery({
    queryKey: [...QUERY_KEYS.monthlyContributions, month],
    queryFn:  () => fetchMonthlyContribution(month),
  })

  const budgetsQuery = useQuery({
    queryKey: [...QUERY_KEYS.advanceBudgets, month],
    queryFn:  () => fetchMonthlyBudgets(month),
  })

  // Real carryover computed from previous month's actual transactions
  const carryoverQuery = useQuery({
    queryKey: [...QUERY_KEYS.advanceBudgets, 'carryover', month],
    queryFn:  () => fetchComputedCarryover(month),
  })

  const planId = planQuery.data?.id
  const breakdownsQuery = useQuery({
    queryKey: [...QUERY_KEYS.contributionBreakdowns, planId],
    queryFn:  () => fetchContributionBreakdowns(planId!),
    enabled:  !!planId,
  })

  // Map of category → budget amount (expense categories only, no carryover)
  const categoryBudgets = useMemo<Partial<Record<AdvanceCategoryKey, number>>>(() => {
    const map: Partial<Record<AdvanceCategoryKey, number>> = {}
    for (const row of budgetsQuery.data ?? []) {
      // Skip any legacy 'carryover' rows that may exist in the DB
      const key = row.category_key as string
      if (key === 'carryover') continue
      // Only include valid AdvanceCategoryKey
      if (ADVANCE_CATEGORY_KEYS.includes(key as AdvanceCategoryKey)) {
        map[key as AdvanceCategoryKey] = row.budget_amount
      }
    }
    return map
  }, [budgetsQuery.data])

  // Total estimated budget = sum of all expense categories
  const totalBudget = useMemo(
    () => ADVANCE_CATEGORY_KEYS.reduce((s, k) => s + (categoryBudgets[k] ?? 0), 0),
    [categoryBudgets],
  )

  // Carryover = previous month's (collected − actual expenses), computed from real data
  const carryoverFromPrevious = carryoverQuery.data ?? 0

  // Required collection = budget − carryover (never negative)
  const requiredCollection = useMemo(
    () => Math.max(0, totalBudget - carryoverFromPrevious),
    [totalBudget, carryoverFromPrevious],
  )

  // Per-person = required collection ÷ active members
  const activeMemberCount    = planQuery.data?.flatmate_count ?? 1
  const estimatedPerPerson   = activeMemberCount > 0 ? requiredCollection / activeMemberCount : 0

  return {
    plan: planQuery.data ? { ...planQuery.data, carryover_from_previous: carryoverFromPrevious } : null,
    categoryBudgets,
    totalBudget,
    /** @deprecated use requiredCollection — kept for backward compat with existing UI */
    adjustedTotalBudget: requiredCollection,
    requiredCollection,
    carryoverFromPrevious,
    estimatedPerPerson,
    breakdowns:  breakdownsQuery.data ?? [],
    isLoading:   planQuery.isLoading || budgetsQuery.isLoading || carryoverQuery.isLoading,
    error:       (planQuery.error ?? budgetsQuery.error ?? carryoverQuery.error ?? null) as Error | null,
  }
}

/* ── Mutations ────────────────────────────────────────────────────────────── */

/**
 * Saves category budgets + plan header + per-user overrides.
 *
 * per_person_default stored in DB = requiredCollection / flatmateCount
 * where requiredCollection = totalBudget − carryoverFromPrevious (real data).
 *
 * The carryover is NOT stored as a budget row — it is always computed live
 * from actual contribution_payments and expenses of the previous month.
 */
export function useSavePlan() {
  return useMutation({
    mutationFn: async (input: SavePlanInput): Promise<MonthlyContribution> => {
      const now = new Date().toISOString()

      // 1. Upsert expense-category budget rows (skip any 'carryover' key)
      const budgetRows = (Object.entries(input.budgets) as [string, number | undefined][])
        .filter(([key, v]) => key !== 'carryover' && v !== undefined)
        .map(([category_key, budget_amount]) => ({
          month:         input.month,
          category_key: category_key as AdvanceCategoryKey,
          budget_amount: budget_amount ?? 0,
          created_by:    input.createdBy,
          updated_at:    now,
        }))

      if (budgetRows.length > 0) {
        const { error } = await supabase
          .from('monthly_budget')
          .upsert(budgetRows, { onConflict: 'month,category_key' })
        if (error) throw new Error(error.message)
      }

      // 2. Compute totals using real carryover from previous month's transactions
      const totalBudget        = budgetRows.reduce((s, r) => s + Number(r.budget_amount), 0)
      const carryover          = await fetchComputedCarryover(input.month)
      const requiredCollection = Math.max(0, totalBudget - carryover)
      const perPerson          = input.flatmateCount > 0 ? requiredCollection / input.flatmateCount : 0

      // 3. Upsert plan header
      const { data: planData, error: planError } = await supabase
        .from('monthly_contributions')
        .upsert(
          {
            month:              input.month,
            total_budget:       totalBudget,       // raw category sum
            flatmate_count:     input.flatmateCount,
            per_person_default: perPerson,         // (totalBudget − carryover) / members
            created_by:         input.createdBy,
            updated_at:         now,
          },
          { onConflict: 'month' },
        )
        .select(
          'id, month, total_budget, flatmate_count, per_person_default, is_published, published_at, published_by, created_by, created_at, updated_at',
        )
        .single()

      if (planError) throw new Error(planError.message)

      const planId = planData.id

      // 4. Replace overrides
      const { error: delError } = await supabase
        .from('contribution_breakdown')
        .delete()
        .eq('monthly_contribution_id', planId)
      if (delError) throw new Error(delError.message)

      const overrideRows = input.overrides
        .filter((o) => o.overrideAmount !== null)
        .map((o) => ({
          monthly_contribution_id: planId,
          user_id:                 o.userId,
          override_amount:         o.overrideAmount!,
          note:                    o.note ?? null,
        }))

      if (overrideRows.length > 0) {
        const { error: insError } = await supabase
          .from('contribution_breakdown')
          .insert(overrideRows)
        if (insError) throw new Error(insError.message)
      }

      await logActivity({
        userId:      input.createdBy,
        action:      'create',
        entity:      'monthly_contributions',
        entityId:    planId,
        description: `Saved contribution plan for ${input.month} — budget PKR ${totalBudget.toFixed(0)}, carryover PKR ${carryover.toFixed(0)}, required PKR ${requiredCollection.toFixed(0)}, per person PKR ${perPerson.toFixed(0)}`,
      })

      return {
        ...planData,
        total_budget:       Number(planData.total_budget),
        flatmate_count:     Number(planData.flatmate_count),
        per_person_default: Number(planData.per_person_default),
      } as MonthlyContribution
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.advanceBudgets })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyContributions })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionBreakdowns })
    },
  })
}

export function usePublishPlan() {
  return useMutation({
    mutationFn: async ({ planId, publishedBy }: { planId: string; publishedBy: string }) => {
      const { error } = await supabase
        .from('monthly_contributions')
        .update({
          is_published: true,
          published_at: new Date().toISOString(),
          published_by: publishedBy,
          updated_at:   new Date().toISOString(),
        })
        .eq('id', planId)

      if (error) throw new Error(error.message)

      await logActivity({
        userId:      publishedBy,
        action:      'update',
        entity:      'monthly_contributions',
        entityId:    planId,
        description: 'Published advance contribution plan',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyContributions })
    },
  })
}

export function useUnpublishPlan() {
  return useMutation({
    mutationFn: async ({ planId, userId }: { planId: string; userId: string }) => {
      const { error } = await supabase
        .from('monthly_contributions')
        .update({
          is_published: false,
          published_at: null,
          published_by: null,
          updated_at:   new Date().toISOString(),
        })
        .eq('id', planId)

      if (error) throw new Error(error.message)

      await logActivity({
        userId,
        action:      'update',
        entity:      'monthly_contributions',
        entityId:    planId,
        description: 'Unpublished advance contribution plan',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.monthlyContributions })
    },
  })
}
