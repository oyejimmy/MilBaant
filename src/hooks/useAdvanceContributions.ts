import { useMemo } from 'react'
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
    total_budget: Number(data.total_budget),
    flatmate_count: Number(data.flatmate_count),
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

/* ── Main query hook ──────────────────────────────────────────────────────── */

export function useAdvanceContribution(month: string) {
  const planQuery = useQuery({
    queryKey: [...QUERY_KEYS.monthlyContributions, month],
    queryFn: () => fetchMonthlyContribution(month),
  })

  const budgetsQuery = useQuery({
    queryKey: [...QUERY_KEYS.advanceBudgets, month],
    queryFn: () => fetchMonthlyBudgets(month),
  })

  const planId = planQuery.data?.id
  const breakdownsQuery = useQuery({
    queryKey: [...QUERY_KEYS.contributionBreakdowns, planId],
    queryFn: () => fetchContributionBreakdowns(planId!),
    enabled: !!planId,
  })

  const categoryBudgets = useMemo<Partial<Record<AdvanceCategoryKey, number>>>(() => {
    const map: Partial<Record<AdvanceCategoryKey, number>> = {}
    for (const row of budgetsQuery.data ?? []) {
      map[row.category_key] = row.budget_amount
    }
    return map
  }, [budgetsQuery.data])

  const totalBudget = useMemo(
    () => ADVANCE_CATEGORY_KEYS.reduce((s, k) => s + (categoryBudgets[k] ?? 0), 0),
    [categoryBudgets],
  )

  return {
    plan: planQuery.data ?? null,
    categoryBudgets,
    totalBudget,
    breakdowns: breakdownsQuery.data ?? [],
    isLoading: planQuery.isLoading || budgetsQuery.isLoading,
    error: (planQuery.error ?? budgetsQuery.error ?? null) as Error | null,
  }
}

/* ── Mutations ────────────────────────────────────────────────────────────── */

/**
 * Atomically saves category budgets + plan header + per-user overrides.
 * Returns the updated MonthlyContribution row.
 */
export function useSavePlan() {
  return useMutation({
    mutationFn: async (input: SavePlanInput): Promise<MonthlyContribution> => {
      const now = new Date().toISOString()

      // 1. Upsert all 8 budget rows
      const budgetRows = (Object.entries(input.budgets) as [AdvanceCategoryKey, number | undefined][])
        .filter(([, v]) => v !== undefined)
        .map(([category_key, budget_amount]) => ({
          month:         input.month,
          category_key,
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

      // 2. Compute totals
      const total     = budgetRows.reduce((s, r) => s + Number(r.budget_amount), 0)
      const perPerson = input.flatmateCount > 0 ? total / input.flatmateCount : 0

      // 3. Upsert plan header (preserves is_published / published_at on conflict)
      const { data: planData, error: planError } = await supabase
        .from('monthly_contributions')
        .upsert(
          {
            month:              input.month,
            total_budget:       total,
            flatmate_count:     input.flatmateCount,
            per_person_default: perPerson,
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

      // 4. Replace overrides: delete all, then re-insert non-null ones
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
        description: `Saved advance contribution plan for ${input.month} (total PKR ${total.toFixed(0)})`,
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
