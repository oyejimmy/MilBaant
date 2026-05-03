import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import { withOfflineSupport } from '@/lib/offline-mutation'
import type { ContributionPayment, CreateContributionPaymentInput } from '@/lib/types'

type RawProfile =
  | Array<{ id: string; full_name: string }>
  | { id: string; full_name: string }
  | null

function pickProfile(raw: RawProfile) {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

async function fetchContributionPayments(month: string): Promise<ContributionPayment[]> {
  const { data, error } = await supabase
    .from('contribution_payments')
    .select(`
      id, user_id, month, amount, paid_at, screenshot_url, note, created_by, created_at,
      member:profiles!contribution_payments_user_id_fkey(id, full_name)
    `)
    .eq('month', month)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    amount: Number(r.amount),
    member: pickProfile(r.member as RawProfile),
  })) as ContributionPayment[]
}

export function useContributionPayments(month: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.contributionPayments, month],
    queryFn: () => fetchContributionPayments(month),
  })
}

export function useCreateContributionPayment() {
  return useMutation({
    mutationFn: (input: CreateContributionPaymentInput) =>
      withOfflineSupport('create_contribution_payment', input, async () => {
        const { data, error } = await supabase.from('contribution_payments').insert({
          user_id: input.userId, month: input.month, amount: input.amount,
          paid_at: input.paidAt, screenshot_url: input.screenshotUrl ?? null,
          note: input.note?.trim() || null, created_by: input.createdBy,
        }).select('id').single()
        if (error) throw new Error(error.message)
        await logActivity({ userId: input.createdBy, action: 'create', entity: 'contribution_payment', entityId: data.id, description: `Submitted payment of PKR ${input.amount} for ${input.month}` })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionPayments }) },
  })
}

export function useDeleteContributionPayment() {
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      withOfflineSupport('delete_contribution_payment', { id, userId }, async () => {
        const { error } = await supabase.from('contribution_payments').delete().eq('id', id)
        if (error) throw new Error(error.message)
        await logActivity({ userId, action: 'delete', entity: 'contribution_payment', entityId: id, description: 'Deleted contribution payment record' })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionPayments }) },
  })
}
