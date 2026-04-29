import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/constants'
import { queryClient } from '@/lib/query-client'
import { supabase } from '@/lib/supabase'
import type { AuthContextValue, Profile } from '@/lib/types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function fetchCurrentProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, can_add_expenses, avatar_url, phone, bio')
    .eq('id', userId)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Profile
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data, error }) => {
      // Silently handle error — no message needed on mount
      if (error) {
        console.error('Auth session error:', error.message)
      }

      if (mounted) {
        setSession(data.session)
        setSessionLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)

      if (!nextSession?.user.id) {
        queryClient.removeQueries({ queryKey: QUERY_KEYS.profile })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const profileQuery = useQuery({
    queryKey: [...QUERY_KEYS.profile, session?.user.id],
    queryFn: () => fetchCurrentProfile(session!.user.id),
    enabled: Boolean(session?.user.id),
  })

  const value = useMemo<AuthContextValue>(
    () => ({
      sessionLoading,
      profileLoading: profileQuery.isLoading,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      profile: profileQuery.data ?? null,
      isAdmin: profileQuery.data?.role === 'admin',
      isCook: profileQuery.data?.role === 'cook',
      canManageExpenses:
        profileQuery.data?.role === 'admin' ||
        profileQuery.data?.can_add_expenses === true,
      signOut: async () => {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw new Error(error.message)
        }
      },
    }),
    [profileQuery.data, profileQuery.isLoading, session, sessionLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuthContext() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used inside AuthProvider')
  }

  return context
}
