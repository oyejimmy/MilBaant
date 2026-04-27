import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { CookAdvance, CookPurchase, PurchaseCategory } from '@/lib/types'

/* ─── Raw normalizers ─────────────────────────────────────────────────────── */

type RawProfile = Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null

function pickProfile(raw: RawProfile) {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

/* ─── Advances ────────────────────────────────────────────────────────────── */

async function fetchAdvances(): Promise<CookAdvance[]> {
  const { data, error } = await supabase
    .from('cook_advances')
    .select(`id, amount, date, note, given_by, created_at,
      giver:profiles!cook_advances_given_by_fkey(id, full_name)`)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    giver: pickProfile(r.giver as RawProfile),
  })) as CookAdvance[]
}

export function useCookAdvances() {
  return useQuery({ queryKey: QUERY_KEYS.cookAdvances, queryFn: fetchAdvances })
}

export function useCreateAdvance() {
  return useMutation({
    mutationFn: async (input: { amount: number; date: string; note?: string; givenBy: string }) => {
      const { error } = await supabase.from('cook_advances').insert({
        amount: input.amount,
        date: input.date,
        note: input.note?.trim() || null,
        given_by: input.givenBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({
        userId: input.givenBy,
        action: 'create',
        entity: 'cook_advance',
        description: `Gave cook advance: PKR ${input.amount} on ${input.date}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookAdvances })
    },
  })
}

export function useDeleteAdvance() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('cook_advances').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'cook_advance',
        entityId: id,
        description: `Deleted cook advance`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookAdvances })
    },
  })
}

/* ─── Purchases ───────────────────────────────────────────────────────────── */

async function fetchPurchases(): Promise<CookPurchase[]> {
  const { data, error } = await supabase
    .from('cook_purchases')
    .select(`id, date, item, amount, category, note, created_at, created_by,
      creator:profiles!cook_purchases_created_by_fkey(id, full_name)`)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    creator: pickProfile(r.creator as RawProfile),
  })) as CookPurchase[]
}

export function useCookPurchases() {
  return useQuery({ queryKey: QUERY_KEYS.cookPurchases, queryFn: fetchPurchases })
}

export function useCreatePurchase() {
  return useMutation({
    mutationFn: async (input: {
      date: string
      item: string
      amount: number
      category: PurchaseCategory
      note?: string
      createdBy: string
    }) => {
      const { error } = await supabase.from('cook_purchases').insert({
        date: input.date,
        item: input.item.trim(),
        amount: input.amount,
        category: input.category,
        note: input.note?.trim() || null,
        created_by: input.createdBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({
        userId: input.createdBy,
        action: 'create',
        entity: 'cook_purchase',
        description: `Added cook purchase: ${input.item} (${input.category}) — PKR ${input.amount} on ${input.date}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookPurchases })
    },
  })
}

export function useDeletePurchase() {
  return useMutation({
    mutationFn: async ({ id, userId, item }: { id: string; userId: string; item?: string }) => {
      const { error } = await supabase.from('cook_purchases').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'cook_purchase',
        entityId: id,
        description: `Deleted cook purchase${item ? `: ${item}` : ''}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookPurchases })
    },
  })
}
