/**
 * withOfflineSupport — wraps a mutation function so that when the user is
 * offline (or the network call fails with a network error), the operation is
 * queued in IndexedDB and will be replayed when connectivity is restored.
 *
 * Usage in a hook:
 *
 *   mutationFn: (input) =>
 *     withOfflineSupport('create_expense', input, () => actualSupabaseCall(input))
 */

import { enqueue, type SyncOperation } from '@/lib/sync-queue'
import { v4 as uuid } from 'uuid'

function isNetworkError(err: unknown): boolean {
  if (!navigator.onLine) return true
  if (err instanceof TypeError && err.message.toLowerCase().includes('fetch')) return true
  if (err instanceof Error) {
    const msg = err.message.toLowerCase()
    // Supabase returns these messages on network failure
    if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('offline')) return true
  }
  return false
}

export async function withOfflineSupport<T>(
  operation: SyncOperation,
  payload: unknown,
  fn: () => Promise<T>,
): Promise<T> {
  // If already offline, skip the network call entirely
  if (!navigator.onLine) {
    await enqueue({ id: uuid(), operation, payload })
    // Return a sentinel so callers don't crash — mutations that return void are fine;
    // mutations that return data (e.g. the created id) will get undefined offline.
    return undefined as unknown as T
  }

  try {
    return await fn()
  } catch (err) {
    if (isNetworkError(err)) {
      await enqueue({ id: uuid(), operation, payload })
      return undefined as unknown as T
    }
    // Non-network error (e.g. RLS violation, validation) — re-throw normally
    throw err
  }
}
