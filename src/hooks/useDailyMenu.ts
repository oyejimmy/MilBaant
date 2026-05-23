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

/* ── Upsert via RPC (avoids CORS preflight on PATCH/INSERT) ─────────────── */

export function useCreateMenu() {
  return useMutation({
    mutationFn: async (payload: CreateDailyMenuInput) => {
      const { data, error } = await supabase.rpc('upsert_daily_menu', {
        p_date:               payload.date,
        p_dinner:             payload.dinner?.trim()             || null,
        p_dinner_description: payload.dinnerDescription?.trim()  || null,
        p_notes:              payload.notes?.trim()              || null,
        p_breakfast:          payload.breakfast?.trim()          || null,
        p_lunch:              payload.lunch?.trim()              || null,
        p_created_by:         payload.createdBy,
      })

      if (error) throw new Error(error.message)

      await logActivity({
        userId:      payload.createdBy,
        action:      'create',
        entity:      'daily_menu',
        entityId:    data as string,
        description: `Added menu for ${payload.date}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}

export function useResetMenuDinner() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('daily_menu')
        .update({ dinner: null, dinner_description: null })
        .eq('id', id)

      if (error) throw new Error(error.message)

      await logActivity({
        userId,
        action:      'update',
        entity:      'daily_menu',
        entityId:    id,
        description: 'Reset dinner to weekly fixed menu',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}

export function useUpdateMenu() {
  return useMutation({
    mutationFn: async ({
      payload,
      userId,
    }: {
      payload: UpdateDailyMenuInput
      userId: string
    }) => {
      // Sparse args — pass only fields explicitly present in payload.
      // Fields absent from payload are passed as null, which the RPC
      // treats as "leave unchanged".
      const { error } = await supabase.rpc('upsert_daily_menu', {
        p_date:               payload.date,
        p_dinner:             'dinner'             in payload ? (payload.dinner?.trim()             || null) : null,
        p_dinner_description: 'dinnerDescription'  in payload ? (payload.dinnerDescription?.trim()  || null) : null,
        p_notes:              'notes'              in payload ? (payload.notes?.trim()              || null) : null,
        p_breakfast:          'breakfast'          in payload ? (payload.breakfast?.trim()          || null) : null,
        p_lunch:              'lunch'              in payload ? (payload.lunch?.trim()              || null) : null,
      })

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

