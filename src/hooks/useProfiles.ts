import { useMutation, useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { Profile, Role } from '@/lib/types'

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, can_add_expenses')
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

export function useUpdateProfilePermissions() {
  return useMutation({
    mutationFn: async (payload: {
      userId: string
      role?: Role
      canAddExpenses?: boolean
      fullName?: string
    }) => {
      const updates: Record<string, unknown> = {}
      if (payload.role) updates.role = payload.role
      if (typeof payload.canAddExpenses === 'boolean') updates.can_add_expenses = payload.canAddExpenses
      if (payload.fullName) updates.full_name = payload.fullName

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', payload.userId)

      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profiles })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile })
    },
  })
}

/**
 * Admin creates a new user by signing them up.
 * Supabase will create the auth user and trigger handle_new_user()
 * which inserts a profile. We then update the profile with the correct name.
 *
 * Note: This uses the anon key signUp — works when "Confirm email" is
 * disabled in Supabase Auth settings (recommended for private flat apps).
 * The admin should disable email confirmation in Supabase Dashboard →
 * Auth → Settings → "Enable email confirmations" OFF.
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
      // 1. Sign up the new user (creates auth.users row + triggers profile insert)
      const { data, error } = await supabase.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        options: {
          data: { full_name: payload.fullName.trim() },
        },
      })

      if (error) throw new Error(error.message)
      if (!data.user) throw new Error('User creation failed — no user returned.')

      const newUserId = data.user.id

      // 2. Update profile with correct name, role, and permissions
      // (handle_new_user trigger may have already inserted with email-derived name)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: payload.fullName.trim(),
          role: payload.role,
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
