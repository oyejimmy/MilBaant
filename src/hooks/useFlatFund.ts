import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type {
  CreateFlatFundAllocationInput,
  CreateFlatFundExpenseInput,
  FlatFundAllocation,
  FlatFundExpense,
} from '@/lib/types'

/* ─── Raw types ───────────────────────────────────────────────────────────── */

type RawProfile = Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null

function pickProfile(raw: RawProfile) {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

/* ─── Allocations ─────────────────────────────────────────────────────────── */

async function fetchAllocations(): Promise<FlatFundAllocation[]> {
  const { data, error } = await supabase
    .from('flat_fund_allocations')
    .select(`
      id, user_id, amount, note, allocated_by, date, created_at,
      member:profiles!flat_fund_allocations_user_id_fkey(id, full_name),
      allocator:profiles!flat_fund_allocations_allocated_by_fkey(id, full_name)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    member: pickProfile(r.member as RawProfile),
    allocator: pickProfile(r.allocator as RawProfile),
  })) as FlatFundAllocation[]
}

export function useFlatFundAllocations() {
  return useQuery({
    queryKey: QUERY_KEYS.flatFundAllocations,
    queryFn: fetchAllocations,
  })
}

export function useCreateFlatFundAllocation() {
  return useMutation({
    mutationFn: async (input: CreateFlatFundAllocationInput) => {
      const { data, error } = await supabase
        .from('flat_fund_allocations')
        .insert({
          user_id: input.userId,
          amount: input.amount,
          note: input.note?.trim() || null,
          allocated_by: input.allocatedBy,
          date: input.date,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      await logActivity({
        userId: input.allocatedBy,
        action: 'create',
        entity: 'flat_fund_allocation',
        entityId: data.id,
        description: `Allocated PKR ${input.amount} to member for flat fund`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundAllocations })
    },
  })
}

export function useDeleteFlatFundAllocation() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('flat_fund_allocations').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'flat_fund_allocation',
        entityId: id,
        description: 'Deleted flat fund allocation',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundAllocations })
    },
  })
}

/* ─── Expenses ────────────────────────────────────────────────────────────── */

async function fetchFlatFundExpenses(): Promise<FlatFundExpense[]> {
  const { data, error } = await supabase
    .from('flat_fund_expenses')
    .select(`
      id, user_id, amount, description, category, date, created_by, created_at,
      member:profiles!flat_fund_expenses_user_id_fkey(id, full_name),
      creator:profiles!flat_fund_expenses_created_by_fkey(id, full_name)
    `)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    member: pickProfile(r.member as RawProfile),
    creator: pickProfile(r.creator as RawProfile),
  })) as FlatFundExpense[]
}

export function useFlatFundExpenses() {
  return useQuery({
    queryKey: QUERY_KEYS.flatFundExpenses,
    queryFn: fetchFlatFundExpenses,
  })
}

export function useCreateFlatFundExpense() {
  return useMutation({
    mutationFn: async (input: CreateFlatFundExpenseInput) => {
      const { data, error } = await supabase
        .from('flat_fund_expenses')
        .insert({
          user_id: input.userId,
          amount: input.amount,
          description: input.description.trim(),
          category: input.category,
          date: input.date,
          created_by: input.createdBy,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      await logActivity({
        userId: input.createdBy,
        action: 'create',
        entity: 'flat_fund_expense',
        entityId: data.id,
        description: `Logged flat expense: ${input.description} — PKR ${input.amount}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundExpenses })
    },
  })
}

export function useDeleteFlatFundExpense() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('flat_fund_expenses').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'flat_fund_expense',
        entityId: id,
        description: 'Deleted flat fund expense',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundExpenses })
    },
  })
}
