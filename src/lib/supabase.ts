import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://example.supabase.co'
const supabasePublishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'public-anon-key'

export const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
      import.meta.env.VITE_SUPABASE_ANON_KEY,
  )

/**
 * Primary Supabase client — used for all authenticated requests.
 * Persists the session in localStorage under the default key.
 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

/**
 * Isolated Supabase client for admin user-creation only.
 *
 * Uses a fully custom in-memory storage object so signUp() on this client:
 *  1. Never writes to localStorage (no risk of overwriting the admin session)
 *  2. Never triggers a storage event that the primary client's onAuthStateChange
 *     would pick up and replace the admin's JWT with the new user's JWT.
 *
 * In supabase-js v2, even with persistSession:false the client can still
 * broadcast SIGNED_IN via BroadcastChannel/localStorage events if it shares
 * the same storageKey namespace. A custom storage object with a unique key
 * and no-op setItem prevents that entirely.
 */
const _inMemoryStore: Record<string, string> = {}
const inMemoryStorage = {
  getItem:    (key: string) => _inMemoryStore[key] ?? null,
  setItem:    (key: string, value: string) => { _inMemoryStore[key] = value },
  removeItem: (key: string) => { delete _inMemoryStore[key] },
}

export const supabaseSignup = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession:    false,
    autoRefreshToken:  false,
    detectSessionInUrl: false,
    storageKey:        'supabase-signup-isolated',
    storage:           inMemoryStorage,
  },
})
