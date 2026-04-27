import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { Bed, BedAssignment, Room } from '@/lib/types'

interface RawRoomRelation {
  id: number
  name: string
  type: Room['type']
}

interface RawBed {
  id: number
  room_id: number
  label: string
  room?: RawRoomRelation[] | RawRoomRelation | null
}

interface RawAssignment {
  id: number
  user_id: string
  bed_id: number
  profile?: Array<{ id: string; full_name: string }> | { id: string; full_name: string } | null
  bed?:
    | Array<{
        id: number
        label: string
        room_id: number
        room?: RawRoomRelation[] | RawRoomRelation | null
      }>
    | {
        id: number
        label: string
        room_id: number
        room?: RawRoomRelation[] | RawRoomRelation | null
      }
    | null
}

function pickSingle<T>(value: T[] | T | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

async function fetchRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('id, name, type')
    .order('id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Room[]
}

async function fetchBeds() {
  const { data, error } = await supabase
    .from('beds')
    .select(
      `
      id,
      room_id,
      label,
      room:rooms!beds_room_id_fkey(id, name, type)
    `,
    )
    .order('room_id', { ascending: true })
    .order('label', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item) => {
    const row = item as RawBed

    return {
      id: row.id,
      room_id: row.room_id,
      label: row.label,
      room: pickSingle(row.room),
    }
  }) as Bed[]
}

async function fetchBedAssignments() {
  const { data, error } = await supabase
    .from('bed_assignments')
    .select(
      `
      id,
      user_id,
      bed_id,
      profile:profiles!bed_assignments_user_id_fkey(id, full_name),
      bed:beds!bed_assignments_bed_id_fkey(
        id,
        label,
        room_id,
        room:rooms!beds_room_id_fkey(id, name, type)
      )
    `,
    )
    .order('bed_id', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []).map((item) => {
    const row = item as RawAssignment
    const bed = pickSingle(row.bed)

    return {
      id: row.id,
      user_id: row.user_id,
      bed_id: row.bed_id,
      profile: pickSingle(row.profile),
      bed: bed
        ? {
            ...bed,
            room: pickSingle(bed.room),
          }
        : null,
    }
  }) as BedAssignment[]
}

export function useRooms() {
  return useQuery({
    queryKey: QUERY_KEYS.rooms,
    queryFn: fetchRooms,
  })
}

export function useBeds() {
  return useQuery({
    queryKey: QUERY_KEYS.beds,
    queryFn: fetchBeds,
  })
}

export function useBedAssignments() {
  return useQuery({
    queryKey: QUERY_KEYS.bedAssignments,
    queryFn: fetchBedAssignments,
  })
}

export function useAssignBed() {
  return useMutation({
    mutationFn: async (payload: { bedId: number; userId: string | null }) => {
      const { error: clearExistingError } = await supabase
        .from('bed_assignments')
        .delete()
        .eq('bed_id', payload.bedId)

      if (clearExistingError) {
        throw new Error(clearExistingError.message)
      }

      if (!payload.userId) {
        return
      }

      const { error: clearUserError } = await supabase
        .from('bed_assignments')
        .delete()
        .eq('user_id', payload.userId)

      if (clearUserError) {
        throw new Error(clearUserError.message)
      }

      const { error: insertError } = await supabase.from('bed_assignments').insert({
        bed_id: payload.bedId,
        user_id: payload.userId,
      })

      if (insertError) {
        throw new Error(insertError.message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.bedAssignments })
    },
  })
}
