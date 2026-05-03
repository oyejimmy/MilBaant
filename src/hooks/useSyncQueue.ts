/**
 * useSyncQueue — React hook that:
 *  1. Listens for online/offline events
 *  2. Auto-flushes the queue when connectivity is restored
 *  3. Exposes queue count + status for UI indicators
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { count as queueCount } from '@/lib/sync-queue'
import { flushQueue } from '@/lib/sync-engine'

export type SyncStatus = 'idle' | 'syncing' | 'error'

export interface SyncQueueState {
  isOnline: boolean
  pendingCount: number
  status: SyncStatus
  lastSyncedAt: Date | null
  /** Manually trigger a sync attempt */
  sync: () => Promise<void>
}

export function useSyncQueue(): SyncQueueState {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [status, setStatus] = useState<SyncStatus>('idle')
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null)
  const syncingRef = useRef(false)

  // Refresh the pending count from IndexedDB
  const refreshCount = useCallback(async () => {
    try {
      const n = await queueCount()
      setPendingCount(n)
    } catch {
      // IndexedDB not available (e.g. private browsing in some browsers)
    }
  }, [])

  const sync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return
    syncingRef.current = true
    setStatus('syncing')
    try {
      const { synced, failed } = await flushQueue()
      await refreshCount()
      setLastSyncedAt(new Date())
      setStatus(failed > 0 ? 'error' : 'idle')
      if (synced > 0) {
        console.info(`[SyncQueue] Synced ${synced} item(s) successfully.`)
      }
    } catch {
      setStatus('error')
    } finally {
      syncingRef.current = false
    }
  }, [refreshCount])

  // Online/offline listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      void sync()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setStatus('idle')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [sync])

  // Poll the queue count every 5 seconds so the badge stays accurate
  useEffect(() => {
    void refreshCount()
    const interval = setInterval(() => void refreshCount(), 5000)
    return () => clearInterval(interval)
  }, [refreshCount])

  // Attempt a flush on mount in case there are items from a previous session
  useEffect(() => {
    if (navigator.onLine) void sync()
  }, [sync])

  return { isOnline, pendingCount, status, lastSyncedAt, sync }
}
