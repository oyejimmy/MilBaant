import { useMutation, useQuery } from '@tanstack/react-query'
import { queryClient } from '@/lib/query-client'
import { logActivity } from '@/hooks/useActivityLog'
import { supabase } from '@/lib/supabase'
import type { CreateSettlementInput, DebtSettlement } from '@/lib/types'

const QUERY_KEY = ['settlements']

interface RawSettlement {
  id: string
  payer_id: string
  payee_id: string
  amount: number | string
  note: string | null
  settled_at: string
  created_at: string
  created_by: string
  payer?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
  payee?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
}

function normalize(raw: RawSettlement): DebtSettlement {
  return {
    ...raw,
    amount: Number(raw.amount),
    payer: Array.isArray(raw.payer) ? (raw.payer[0] ?? null) : (raw.payer ?? null),
    payee: Array.isArray(raw.payee) ? (raw.payee[0] ?? null) : (raw.payee ?? null),
  }
}

async function fetchSettlements(): Promise<DebtSettlement[]> {
  const { data, error } = await supabase
    .from('debt_settlements')
    .select(`
      id, payer_id, payee_id, amount, note, settled_at, created_at, created_by,
      payer:profiles!debt_settlements_payer_id_fkey(id, full_name),
      payee:profiles!debt_settlements_payee_id_fkey(id, full_name)
    `)
    .order('settled_at', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => normalize(r as RawSettlement))
}

export function useSettlements() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchSettlements })
}

export function useCreateSettlement() {
  return useMutation({
    mutationFn: async (input: CreateSettlementInput & { createdBy: string }) => {
      const { error } = await supabase.from('debt_settlements').insert({
        payer_id: input.payerId,
        payee_id: input.payeeId,
        amount: input.amount,
        note: input.note?.trim() || null,
        settled_at: input.settledAt,
        created_by: input.createdBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({
        userId: input.createdBy,
        action: 'create',
        entity: 'settlement',
        description: `Recorded settlement: PKR ${input.amount} on ${input.settledAt}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}

export function useDeleteSettlement() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('debt_settlements').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'settlement',
        entityId: id,
        description: `Deleted settlement`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEY })
    },
  })
}
