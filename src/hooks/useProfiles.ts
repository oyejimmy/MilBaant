import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase, supabaseSignup } from '@/lib/supabase'
import type { Profile, Role } from '@/lib/types'

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, can_add_expenses, is_active, avatar_url')
    .order('full_name', { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Profile[]
}

export function useProfiles() {
  return useQuery({
    queryKey: QUERY_KEYS.profiles,
    queryFn: fetchProfiles,
  })
}

export function useFlatmates() {
  const query = useProfiles()
  return {
    ...query,
    data: (query.data ?? []).filter((p) => p.role !== 'cook'),
  }
}

export function useUpdateProfilePermissions() {
  return useMutation({
    mutationFn: async (payload: {
      userId: string
      role?: Role
      canAddExpenses?: boolean
      fullName?: string
      isActive?: boolean
    }) => {
      // Nothing to update
      const hasChanges =
        payload.role !== undefined ||
        typeof payload.canAddExpenses === 'boolean' ||
        payload.fullName !== undefined ||
        typeof payload.isActive === 'boolean'
      if (!hasChanges) return

      // Use the SECURITY DEFINER RPC so the update runs as the DB owner,
      // bypassing RLS entirely. This is the only reliable way to let an admin
      // update another user's row without hitting the policy conflict that
      // browsers surface as a CORS / network error.
      const { error } = await supabase.rpc('admin_update_profile', {
        target_user_id: payload.userId,
        p_role:         payload.role         ?? null,
        p_can_add_exp:  payload.canAddExpenses ?? null,
        p_full_name:    payload.fullName      ?? null,
        p_is_active:    payload.isActive      ?? null,
      })

      if (error) {
        if (
          error.message.includes('Permission denied') ||
          error.message.includes('admin role required')
        ) {
          throw new Error('Admin access required. Please refresh the page and try again.')
        }
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}

/**
 * Any authenticated user can update their own profile fields:
 * full_name, phone, bio, avatar_url.
 * Uses the profiles_self_update RLS policy.
 */
export function useUpdateOwnProfile() {
  return useMutation({
    mutationFn: async (payload: {
      userId: string
      fullName?: string
      phone?: string
      bio?: string
      avatarUrl?: string | null
    }) => {
      const updates: Record<string, unknown> = {}
      if (payload.fullName  !== undefined) updates.full_name  = payload.fullName
      if (payload.phone     !== undefined) updates.phone      = payload.phone
      if (payload.bio       !== undefined) updates.bio        = payload.bio
      if (payload.avatarUrl !== undefined) updates.avatar_url = payload.avatarUrl

      if (Object.keys(updates).length === 0) return

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', payload.userId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

/**
 * Permanently removes a user and all their data from Supabase.
 *
 * The target user MUST already be deactivated (is_active = false).
 * The server-side function handles all FK-RESTRICT tables before
 * deleting from auth.users, which cascades to profiles and all
 * ON DELETE CASCADE child rows.
 */
export function useAdminDeleteUser() {
  return useMutation({
    mutationFn: async (targetUserId: string) => {
      const { error } = await supabase.rpc('admin_hard_delete_user', {
        target_user_id: targetUserId,
      })

      if (error) {
        if (
          error.message.includes('Permission denied') ||
          error.message.includes('admin role required')
        ) {
          throw new Error('Admin access required. Please refresh and try again.')
        }
        if (error.message.includes('must be deactivated')) {
          throw new Error('User must be deactivated before permanent deletion.')
        }
        if (error.message.includes('own account')) {
          throw new Error('You cannot delete your own account.')
        }
        throw new Error(error.message)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}

/**
 * Admin creates a new user by signing them up.
 *
 * Uses a separate isolated Supabase client (supabaseSignup) with in-memory
 * storage so the signUp call never overwrites the admin's session in the
 * primary client. This is the only reliable way to create users without
 * losing the admin session and triggering RLS failures on subsequent requests.
 *
 * Requires "Enable email confirmations" to be OFF in Supabase Dashboard →
 * Auth → Settings (recommended for private flat apps).
 */
export function useAdminCreateUser() {
  return useMutation({
    mutationFn: async (payload: {
      fullName: string
      email: string
      password: string
      role: Role
      canAddExpenses: boolean
    }) => {
      // 1. Sign up via the isolated client — admin session is untouched
      const { data, error } = await supabaseSignup.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          data: { full_name: payload.fullName.trim() },
        },
      })

      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('User creation failed — no user returned.')

      const newUserId = data.user.id

      // 2. Update the new profile using the primary (admin) client
      //    Admin session is still intact, so the RLS policy allows this
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name:        payload.fullName.trim(),
          role:             payload.role,
          can_add_expenses: payload.canAddExpenses,
        })
        .eq('id', newUserId)

      if (profileError) throw new Error(profileError.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
    },
  })
}
