import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import { withOfflineSupport } from '@/lib/offline-mutation'
import type { CookRequest, CookRequestStatus, CreateCookRequestInput } from '@/lib/types'

/* ─── Raw normalizer ──────────────────────────────────────────────────────── */

type RawProfile =
  | Array<{ id: string; full_name: string }>
  | { id: string; full_name: string }
  | null

function pickProfile(raw: RawProfile) {
  return Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null)
}

/* ─── Fetch ───────────────────────────────────────────────────────────────── */

async function fetchCookRequests(): Promise<CookRequest[]> {
  const { data, error } = await supabase
    .from('cook_requests')
    .select(`
      id, item, quantity, note, cook_comment, status,
      requested_by, created_at, updated_at,
      requester:profiles!cook_requests_requested_by_fkey(id, full_name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    ...r,
    requester: pickProfile(r.requester as RawProfile),
  })) as CookRequest[]
}

export function useCookRequests() {
  return useQuery({
    queryKey: QUERY_KEYS.cookRequests,
    queryFn: fetchCookRequests,
  })
}

/* ─── Create (users only) ─────────────────────────────────────────────────── */

export function useCreateCookRequest() {
  return useMutation({
    mutationFn: (input: CreateCookRequestInput) =>
      withOfflineSupport('create_cook_request', input, async () => {
        const { data, error } = await supabase.from('cook_requests').insert({
          item: input.item.trim(), quantity: input.quantity?.trim() || null,
          note: input.note?.trim() || null, requested_by: input.requestedBy, status: 'pending',
        }).select('id').single()
        if (error) throw new Error(error.message)
        await logActivity({ userId: input.requestedBy, action: 'create', entity: 'cook_request', entityId: data.id, description: `Requested item from cook: ${input.item}${input.quantity ? ` (${input.quantity})` : ''}` })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests }) },
  })
}

export function useCookReply() {
  return useMutation({
    mutationFn: ({ id, status, cookComment, userId }: { id: string; status: CookRequestStatus; cookComment: string; userId: string }) =>
      withOfflineSupport('cook_reply', { id, status, cookComment, userId }, async () => {
        const { error } = await supabase.from('cook_requests').update({
          status, cook_comment: cookComment.trim() || null,
        }).eq('id', id)
        if (error) throw new Error(error.message)
        await logActivity({ userId, action: 'update', entity: 'cook_request', entityId: id, description: `Cook replied to request — status: ${status}${cookComment ? ` · "${cookComment.trim()}"` : ''}` })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests }) },
  })
}

export function useDeleteCookRequest() {
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      withOfflineSupport('delete_cook_request', { id, userId }, async () => {
        const { error } = await supabase.from('cook_requests').delete().eq('id', id)
        if (error) throw new Error(error.message)
        await logActivity({ userId, action: 'delete', entity: 'cook_request', entityId: id, description: 'Deleted cook request' })
      }),
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests }) },
  })
}
