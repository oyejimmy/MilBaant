import { useMutation, useQuery } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { CreateDailyMenuInput, DailyMenu, UpdateDailyMenuInput } from '@/lib/types'
import { logActivity } from './useActivityLog'

interface RawDailyMenu {
  id: string
  date: string
  breakfast: string | null
  lunch: string | null
  dinner: string | null
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

// Fetch menu for a specific date
async function fetchMenuByDate(date: string) {
  const { data, error } = await supabase
    .from('daily_menu')
    .select(
      `
      id,
      date,
      breakfast,
      lunch,
      dinner,
      notes,
      created_by,
      created_at,
      updated_at,
      creator:profiles!daily_menu_created_by_fkey(id, full_name)
    `,
    )
    .eq('date', date)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? normalizeDailyMenu(data as RawDailyMenu) : null
}

// Fetch menu for a month
async function fetchMenuByMonth(month: Dayjs) {
  const startDate = month.startOf('month').format('YYYY-MM-DD')
  const endDate = month.endOf('month').format('YYYY-MM-DD')

  const { data, error } = await supabase
    .from('daily_menu')
    .select(
      `
      id,
      date,
      breakfast,
      lunch,
      dinner,
      notes,
      created_by,
      created_at,
      updated_at,
      creator:profiles!daily_menu_created_by_fkey(id, full_name)
    `,
    )
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((item) => normalizeDailyMenu(item as RawDailyMenu))
}

export function useMenuByDate(date: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dailyMenu, date],
    queryFn: () => fetchMenuByDate(date),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useMenuByMonth(month: Dayjs) {
  return useQuery({
    queryKey: [...QUERY_KEYS.dailyMenu, month.format('YYYY-MM')],
    queryFn: () => fetchMenuByMonth(month),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export function useCreateMenu() {
  return useMutation({
    mutationFn: async (payload: CreateDailyMenuInput) => {
      const { data, error } = await supabase
        .from('daily_menu')
        .insert({
          date: payload.date,
          breakfast: payload.breakfast?.trim() || null,
          lunch: payload.lunch?.trim() || null,
          dinner: payload.dinner?.trim() || null,
          notes: payload.notes?.trim() || null,
          created_by: payload.createdBy,
        })
        .select('id')
        .single()

      if (error) throw new Error(error.message)

      await logActivity({
        userId: payload.createdBy,
        action: 'create',
        entity: 'daily_menu',
        entityId: data.id,
        description: `Added menu for ${payload.date}`,
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
      const { error } = await supabase
        .from('daily_menu')
        .update({
          breakfast: payload.breakfast?.trim() || null,
          lunch: payload.lunch?.trim() || null,
          dinner: payload.dinner?.trim() || null,
          notes: payload.notes?.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payload.id)

      if (error) throw new Error(error.message)

      await logActivity({
        userId,
        action: 'update',
        entity: 'daily_menu',
        entityId: payload.id,
        description: 'Updated daily menu',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}

export function useDeleteMenu() {
  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase.from('daily_menu').delete().eq('id', id)
      if (error) throw new Error(error.message)

      await logActivity({
        userId,
        action: 'delete',
        entity: 'daily_menu',
        entityId: id,
        description: 'Deleted daily menu',
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dailyMenu })
    },
  })
}
