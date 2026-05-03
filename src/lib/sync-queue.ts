/**
 * Offline Sync Queue — IndexedDB backed
 *
 * Stores pending mutations when the user is offline.
 * The sync engine processes them in order when connectivity is restored.
 */

export type SyncOperation =
  | 'create_expense'
  | 'delete_expense'
  | 'update_expense'
  | 'create_contribution_payment'
  | 'delete_contribution_payment'
  | 'create_flat_fund_allocation'
  | 'delete_flat_fund_allocation'
  | 'create_flat_fund_expense'
  | 'delete_flat_fund_expense'
  | 'create_ride'
  | 'delete_ride'
  | 'create_cook_advance'
  | 'delete_cook_advance'
  | 'create_cook_purchase'
  | 'delete_cook_purchase'
  | 'create_cook_request'
  | 'delete_cook_request'
  | 'cook_reply'

export interface SyncItem {
  id: string           // client-generated UUID
  operation: SyncOperation
  payload: unknown     // the full input that would have been sent to Supabase
  createdAt: number    // Date.now()
  retries: number
  lastError?: string
}

const DB_NAME = 'milbaant-sync'
const DB_VERSION = 1
const STORE = 'queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueue(item: Omit<SyncItem, 'retries' | 'createdAt'>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put({ ...item, retries: 0, createdAt: Date.now() })
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function dequeue(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function updateRetry(id: string, error: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result as SyncItem | undefined
      if (item) {
        store.put({ ...item, retries: item.retries + 1, lastError: error })
      }
      resolve()
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

export async function getAll(): Promise<SyncItem[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve((req.result as SyncItem[]).sort((a, b) => a.createdAt - b.createdAt))
    req.onerror = () => reject(req.error)
  })
}

export async function clearAll(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function count(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).count()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
