import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { Announcement } from '@/lib/types'

interface RawAnnouncement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  creator?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
}

function normalizeAnnouncement(announcement: RawAnnouncement): Announcement {
  const creator = Array.isArray(announcement.creator)
    ? announcement.creator[0] ?? null
    : announcement.creator ?? null

  return {
    ...announcement,
    creator,
  }
}

async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select(
      `
      id,
      title,
      content,
      created_by,
      created_at,
      creator:profiles!announcements_created_by_fkey(id, full_name)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item) => normalizeAnnouncement(item as RawAnnouncement))
}

export function useAnnouncements() {
  return useQuery({
    queryKey: QUERY_KEYS.announcements,
    queryFn: fetchAnnouncements,
  })
}

export function useCreateAnnouncement() {
  return useMutation({
    mutationFn: async (payload: {
      title: string
      content: string
      createdBy: string
    }) => {
      const { error } = await supabase.from('announcements').insert({
        title: payload.title.trim(),
        content: payload.content.trim(),
        created_by: payload.createdBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({
        userId: payload.createdBy,
        action: 'create',
        entity: 'announcement',
        description: `Posted announcement: ${payload.title}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements })
    },
  })
}

export function useDeleteAnnouncement() {
  return useMutation({
    mutationFn: async ({ announcementId, userId, title }: { announcementId: string; userId: string; title?: string }) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId)
      if (error) throw new Error(error.message)
      await logActivity({
        userId,
        action: 'delete',
        entity: 'announcement',
        entityId: announcementId,
        description: `Deleted announcement${title ? `: ${title}` : ''}`,
      })
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.announcements })
    },
  })
}
