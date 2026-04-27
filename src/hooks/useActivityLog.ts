import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/lib/types'

type RawProfile = Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null

interface RawLog {
  id: string
  user_id: string
  action: string
  entity: string
  entity_id: string | null
  description: string
  created_at: string
  actor?: RawProfile
}

function normalizeLog(raw: RawLog): ActivityLog {
  return {
    ...raw,
    action: raw.action as ActivityLog['action'],
    actor: Array.isArray(raw.actor) ? (raw.actor[0] ?? null) : (raw.actor ?? null),
  }
}

async function fetchLogs(): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from('activity_logs')
    .select(`
      id, user_id, action, entity, entity_id, description, created_at,
      actor:profiles!activity_logs_user_id_fkey(id, full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(500)

  if (error) throw new Error(error.message)
  return (data ?? []).map((r) => normalizeLog(r as RawLog))
}

export function useActivityLogs() {
  return useQuery({
    queryKey: QUERY_KEYS.activityLogs,
    queryFn: fetchLogs,
  })
}

export interface LogActivityInput {
  userId: string
  action: 'create' | 'update' | 'delete'
  entity: string
  entityId?: string
  description: string
}

export async function logActivity(input: LogActivityInput) {
  await supabase.from('activity_logs').insert({
    user_id: input.userId,
    action: input.action,
    entity: input.entity,
    entity_id: input.entityId ?? null,
    description: input.description,
  })
}

export function useLogActivity() {
  return useMutation({
    mutationFn: logActivity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activityLogs })
    },
  })
}
