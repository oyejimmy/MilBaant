import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { CreateDailyMenuInput, DailyMenu, UpdateDailyMenuInput } from '@/lib/types'
import { logActivity } from './useActivityLog'

/* ── Raw shape returned by Supabase ─────────────────────────────────────── */

interface RawDailyMenu {
  id: string
  date: string
  breakfast: string | null
  lunch: string | null
  dinner: string | null
  dinner_description: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?:
    | Array<{ id: string; full_name: string }>
    | { id: string; full_name: string }
    | null
}

function normalizeDailyMenu(menu: RawDailyMenu): DailyMenu {
  return {
    ...menu,
    creator: Array.isArray(menu.creator)
      ? menu.creator[0] ?? null
      : menu.creator ?? null,
  }
}

const SELECT_FIELDS = `
  id,
  date,
  breakfast,
  lunch,
  dinner,
  dinner_description,
  notes,
  created_by,
  created_at,
  updated_at,
  creator:profiles!daily_menu_created_by_fkey(id, full_name)
`

/* ── Queries ─────────────────────────────────────────────────────────────── */

async function fetchMenuByDate(date: string): Promise<DailyMenu | null> {
  const { data, error } = await supabase
    .from('daily_menu')
    .select(SELECT_FIELDS)
    .eq('date', date)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? normalizeDailyMenu(data as RawDailyMenu) : null
}

export function useMenuByDate(date: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dailyMenu, date],
    queryFn:  () => fetchMenuByDate(date),
    staleTime: 1000 * 60 * 2,
  })
}

/* ── Create ──────────────────────────────────────────────────────────────── */

export function useCreateMenu() {
  return useMutation({
    mutationFn: async (payload: CreateDailyMenuInput) => {
      const { data, error } = await supabase
        .from('daily_menu')
        .insert({
          date:               payload.date,
          breakfast:          payload.breakfast?.trim()         || null,
          lunch:              payload.lunch?.trim()             || null,
          dinner:             payload.dinner?.trim()            || null,
          dinner_description: payload.dinnerDescription?.trim() || null,
          notes:              payload.notes?.trim()             || null,
          created_by:         payload.createdBy,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      await logActivity({
        userId:      payload.createdBy,
        action:      'create',
        entity:      'daily_menu',
        entityId:    data.id,
        description: `Added menu for ${payload.date}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}

/* ── Update ──────────────────────────────────────────────────────────────── */

export function useUpdateMenu() {
  return useMutation({
    mutationFn: async ({
      payload,
      userId,
    }: {
      payload: UpdateDailyMenuInput
      userId: string
    }) => {
      // Build a sparse update — only include fields explicitly passed.
      // Using Record<string, string | null> so null values are sent to DB
      // (clearing a field) rather than being omitted.
      const update: Record<string, string | null> = {}

      if ('breakfast'         in payload) update.breakfast          = payload.breakfast?.trim()         || null
      if ('lunch'             in payload) update.lunch              = payload.lunch?.trim()             || null
      if ('dinner'            in payload) update.dinner             = payload.dinner?.trim()            || null
      if ('dinnerDescription' in payload) update.dinner_description = payload.dinnerDescription?.trim() || null
      if ('notes'             in payload) update.notes              = payload.notes?.trim()             || null

      if (Object.keys(update).length === 0) return

      // Use .select() so Supabase sends `Prefer: return=representation`
      // instead of `return=minimal`. The minimal header triggers a CORS
      // preflight that some Supabase project configs reject.
      const { error } = await supabase
        .from('daily_menu')
        .update(update)
        .eq('id', payload.id)
        .select('id')

      if (error) throw new Error(error.message)

      await logActivity({
        userId,
        action:      'update',
        entity:      'daily_menu',
        entityId:    payload.id,
        description: 'Updated daily menu',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}

