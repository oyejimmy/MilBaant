import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import { QUERY_KEYS } from '@/lib/constants'
import { getMonthRange } from '@/lib/formatters'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { CreateExpenseInput, Expense } from '@/lib/types'

interface RawExpenseParticipant {
  user_id: string
  profile?:
    | Array<{ id: string; full_name: string }>
    | { id: string; full_name: string }
    | null
}

interface RawExpense {
  id: string
  created_by: string
  category: Expense['category']
  description: string | null
  amount: number | string
  date: string
  split_type: Expense['split_type']
  bill_image_url: string | null
  created_at: string
  creator?:
    | Array<{ id: string; full_name: string }>
    | { id: string; full_name: string }
    | null
  expense_participants?: RawExpenseParticipant[] | null
}

function normalizeExpense(expense: RawExpense): Expense {
  return {
    ...expense,
    amount: Number(expense.amount),
    creator: Array.isArray(expense.creator)
      ? expense.creator[0] ?? null
      : expense.creator ?? null,
    expense_participants: (expense.expense_participants ?? []).map((participant) => ({
      ...participant,
      profile: Array.isArray(participant.profile)
        ? participant.profile[0] ?? null
        : participant.profile ?? null,
    })),
  }
}

async function fetchExpensesByMonth(month: Dayjs) {
  const range = getMonthRange(month)
  const { data, error } = await supabase
    .from('expenses')
    .select(
      `
      id,
      created_by,
      category,
      description,
      amount,
      date,
      split_type,
      bill_image_url,
      created_at,
      creator:profiles!expenses_created_by_fkey(id, full_name),
      expense_participants(
        user_id,
        profile:profiles!expense_participants_user_id_fkey(id, full_name)
      )
    `,
    )
    .gte('date', range.start)
    .lte('date', range.end)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item) => normalizeExpense(item as RawExpense))
}

export function useExpenses(month: Dayjs) {
  return useQuery({
    queryKey: [...QUERY_KEYS.expenses, month.format('YYYY-MM')],
    queryFn: () => fetchExpensesByMonth(month),
    placeholderData: keepPreviousData,
  })
}

export function useCreateExpense() {
  return useMutation({
    mutationFn: async (payload: CreateExpenseInput) => {
      const splitType =
        payload.category === 'weekend_meal'
          ? 'custom_participants'
          : 'all_members'

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          created_by: payload.createdBy,
          category: payload.category,
          description: payload.description?.trim() || null,
          amount: payload.amount,
          date: payload.date,
          split_type: splitType,
          bill_image_url: payload.billImageUrl ?? null,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      if (splitType === 'custom_participants' && payload.participantIds.length > 0) {
        const { error: participantsError } = await supabase
          .from('expense_participants')
          .insert(
            payload.participantIds.map((participantId) => ({
              expense_id: data.id,
              user_id: participantId,
            })),
          )
        if (participantsError) throw new Error(participantsError.message)
      }

      await logActivity({
        userId: payload.createdBy,
        action: 'create',
        entity: 'expense',
        entityId: data.id,
        description: `Added expense: ${payload.category} — PKR ${payload.amount} on ${payload.date}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
    },
  })
}

export function useDeleteExpense() {
  return useMutation({
    mutationFn: async ({ expenseId, userId, label }: { expenseId: string; userId: string; label?: string }) => {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseId)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'expense',
        entityId: expenseId,
        description: `Deleted expense${label ? `: ${label}` : ''}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
    },
  })
}

export function useUpdateExpense() {
  return useMutation({
    mutationFn: async ({
      id,
      amount,
      description,
      userId,
    }: {
      id: string
      amount: number
      description: string | null
      userId: string
    }) => {
      const { error } = await supabase
        .from('expenses')
        .update({ amount, description: description?.trim() || null })
        .eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'update',
        entity: 'expense',
        entityId: id,
        description: `Updated expense — new amount: PKR ${amount}${description ? `, note: ${description}` : ''}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
    },
  })
}
