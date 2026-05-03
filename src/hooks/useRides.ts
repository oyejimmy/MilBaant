import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import type { Dayjs } from 'dayjs'
import { QUERY_KEYS } from '@/lib/constants'
import { getMonthRange } from '@/lib/formatters'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import { withOfflineSupport } from '@/lib/offline-mutation'
import type { CreateRideInput, Ride, RideRider } from '@/lib/types'

/* ─── Raw types ───────────────────────────────────────────────────────────── */

interface RawRider {
  user_id: string
  profile?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
}

interface RawRide {
  id: string
  date: string
  service: string
  route: string | null
  amount: number | string
  paid_by: string
  note: string | null
  created_by: string
  created_at: string
  payer?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
  creator?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
  ride_riders?: RawRider[] | null
}

function normalizeRider(r: RawRider): RideRider {
  return {
    user_id: r.user_id,
    profile: Array.isArray(r.profile) ? (r.profile[0] ?? null) : (r.profile ?? null),
  }
}

function normalizeRide(raw: RawRide): Ride {
  return {
    ...raw,
    amount: Number(raw.amount),
    payer: Array.isArray(raw.payer) ? (raw.payer[0] ?? null) : (raw.payer ?? null),
    creator: Array.isArray(raw.creator) ? (raw.creator[0] ?? null) : (raw.creator ?? null),
    ride_riders: (raw.ride_riders ?? []).map(normalizeRider),
  }
}

/* ─── Fetch ───────────────────────────────────────────────────────────────── */

async function fetchRidesByMonth(month: Dayjs): Promise<Ride[]> {
  const { start, end } = getMonthRange(month)

  const { data, error } = await supabase
    .from('rides')
    .select(`
      id, date, service, route, amount, paid_by, note, created_by, created_at,
      payer:profiles!rides_paid_by_fkey(id, full_name),
      creator:profiles!rides_created_by_fkey(id, full_name),
      ride_riders(
        user_id,
        profile:profiles!ride_riders_user_id_fkey(id, full_name)
      )
    `)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => normalizeRide(r as RawRide))
}

/* ─── Hooks ───────────────────────────────────────────────────────────────── */

export function useRides(month: Dayjs) {
  return useQuery({
    queryKey: [...QUERY_KEYS.rides, month.format('YYYY-MM')],
    queryFn: () => fetchRidesByMonth(month),
    placeholderData: keepPreviousData,
  })
}

export function useCreateRide() {
  return useMutation({
    mutationFn: (input: CreateRideInput) =>
      withOfflineSupport('create_ride', input, async () => {
        const { data, error } = await supabase.from('rides').insert({
          date: input.date, service: input.service, route: input.route?.trim() || null,
          amount: input.amount, paid_by: input.paidBy, note: input.note?.trim() || null, created_by: input.createdBy,
        }).select('id').single()
        if (error) throw new Error(error.message)
        if (input.riderIds.length > 0) {
          const { error: re } = await supabase.from('ride_riders').insert(input.riderIds.map(uid => ({ ride_id: data.id, user_id: uid })))
          if (re) throw new Error(re.message)
        }
        await logActivity({ userId: input.createdBy, action: 'create', entity: 'ride', entityId: data.id, description: `Added ride: ${input.service}${input.route ? ` — ${input.route}` : ''} — PKR ${input.amount} on ${input.date}` })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rides }) },
  })
}

export function useDeleteRide() {
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      withOfflineSupport('delete_ride', { id, userId }, async () => {
        const { error } = await supabase.from('rides').delete().eq('id', id)
        if (error) throw new Error(error.message)
        await logActivity({ userId, action: 'delete', entity: 'ride', entityId: id, description: 'Deleted ride' })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rides }) },
  })
}
