import { useMutation, useQuery } from '@tanstack/react-query'
import { DEFAULT_MEMBER_COUNT, QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'

async function fetchMemberCount() {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', 'member_count')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Number(data?.value ?? DEFAULT_MEMBER_COUNT)
}

export function useMemberCountSetting() {
  return useQuery({
    queryKey: [...QUERY_KEYS.settings, 'member_count'],
    queryFn: fetchMemberCount,
  })
}

export function useUpsertMemberCount() {
  return useMutation({
    mutationFn: async (memberCount: number) => {
      const { error } = await supabase.from('settings').upsert({
        key: 'member_count',
        value: String(memberCount),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
  })
}

/* ─── Contribute info ─────────────────────────────────────────────────────── */

export interface ContributeInfo {
  accountNumber: string
  paymentMethod: string
  accountName: string
}

const CONTRIBUTE_KEY = 'contribute_info'
const CONTRIBUTE_DEFAULT: ContributeInfo = {
  accountNumber: '03065962673',
  paymentMethod: 'Easypaisa',
  accountName: 'Yasir Ajmal Mehmand',
}

async function fetchContributeInfo(): Promise<ContributeInfo> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', CONTRIBUTE_KEY)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return CONTRIBUTE_DEFAULT
  try {
    return JSON.parse(data.value) as ContributeInfo
  } catch {
    return CONTRIBUTE_DEFAULT
  }
}

export function useContributeInfo() {
  return useQuery({
    queryKey: [...QUERY_KEYS.settings, CONTRIBUTE_KEY],
    queryFn: fetchContributeInfo,
  })
}

export function useUpsertContributeInfo() {
  return useMutation({
    mutationFn: async (info: ContributeInfo) => {
      const { error } = await supabase.from('settings').upsert({
        key: CONTRIBUTE_KEY,
        value: JSON.stringify(info),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
  })
}

/* ─── Previous month remainder ────────────────────────────────────────────── */

async function fetchPrevRemainder(): Promise<number> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .eq('key', 'prev_month_remainder')
    .maybeSingle()

  if (error) throw new Error(error.message)
  return Number(data?.value ?? 0)
}

export function usePrevMonthRemainder() {
  return useQuery({
    queryKey: [...QUERY_KEYS.settings, 'prev_month_remainder'],
    queryFn: fetchPrevRemainder,
  })
}

export function useUpsertPrevMonthRemainder() {
  return useMutation({
    mutationFn: async (amount: number) => {
      const { error } = await supabase.from('settings').upsert({
        key: 'prev_month_remainder',
        value: String(amount),
      })
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settings })
    },
  })
}
