/**
 * Sync Engine — processes the offline queue when connectivity is restored.
 *
 * Each operation maps to the exact Supabase call that would have been made
 * if the user was online. After a successful sync the item is removed from
 * the queue and the relevant TanStack Query cache is invalidated.
 */

import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/query-client'
import { QUERY_KEYS } from '@/lib/constants'
import { logActivity } from '@/hooks/useActivityLog'
import { dequeue, getAll, updateRetry, type SyncItem } from '@/lib/sync-queue'

const MAX_RETRIES = 5

/* ── Payload types (mirror the mutation inputs) ─────────────────────────── */

interface CreateExpensePayload {
  createdBy: string; category: string; description?: string
  amount: number; date: string; lastDate?: string
  billImageUrl?: string; participantIds: string[]
}
interface DeleteExpensePayload { expenseId: string; userId: string; label?: string }
interface UpdateExpensePayload { id: string; amount: number; description: string | null; userId: string }

interface CreateContributionPayload {
  userId: string; month: string; amount: number; paidAt: string
  screenshotUrl?: string; note?: string; createdBy: string
}
interface DeleteContributionPayload { id: string; userId: string }

interface CreateFlatFundAllocationPayload {
  userId: string; amount: number; note?: string; allocatedBy: string; date: string
}
interface DeleteFlatFundAllocationPayload { id: string; userId: string }

interface CreateFlatFundExpensePayload {
  userId: string; amount: number; description: string; category: string; date: string; createdBy: string
}
interface DeleteFlatFundExpensePayload { id: string; userId: string }

interface CreateRidePayload {
  date: string; service: string; route?: string; amount: number
  paidBy: string; note?: string; createdBy: string; riderIds: string[]
}
interface DeleteRidePayload { id: string; userId: string }

interface CreateCookAdvancePayload { amount: number; date: string; note?: string; givenBy: string }
interface DeleteCookAdvancePayload { id: string; userId: string }

interface CreateCookPurchasePayload {
  date: string; item: string; amount: number; category: string; note?: string; createdBy: string
}
interface DeleteCookPurchasePayload { id: string; userId: string; item?: string }

interface CreateCookRequestPayload {
  item: string; quantity?: string; note?: string; requestedBy: string
}
interface DeleteCookRequestPayload { id: string; userId: string }
interface CookReplyPayload { id: string; status: string; cookComment: string; userId: string }

/* ── Process a single queued item ───────────────────────────────────────── */

async function processItem(item: SyncItem): Promise<void> {
  const p = item.payload

  switch (item.operation) {

    /* ── Expenses ── */
    case 'create_expense': {
      const input = p as CreateExpensePayload
      const splitType = input.category === 'weekend_meal' ? 'custom_participants' : 'all_members'
      const { data, error } = await supabase.from('expenses').insert({
        created_by: input.createdBy, category: input.category,
        description: input.description?.trim() || null, amount: input.amount,
        date: input.date, last_date: input.lastDate || null,
        split_type: splitType, bill_image_url: input.billImageUrl ?? null,
        monthly_period_id: input.date.substring(0, 7),
      }).select('id').single()
      if (error) throw new Error(error.message)
      if (splitType === 'custom_participants' && input.participantIds.length > 0) {
        const { error: pe } = await supabase.from('expense_participants').insert(
          input.participantIds.map(uid => ({ expense_id: data.id, user_id: uid }))
        )
        if (pe) throw new Error(pe.message)
      }
      await logActivity({ userId: input.createdBy, action: 'create', entity: 'expense', entityId: data.id, description: `[offline] Added expense: ${input.category} — PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      break
    }
    case 'delete_expense': {
      const input = p as DeleteExpensePayload
      const { error } = await supabase.from('expenses').delete().eq('id', input.expenseId)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'expense', entityId: input.expenseId, description: `[offline] Deleted expense${input.label ? `: ${input.label}` : ''}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      break
    }
    case 'update_expense': {
      const input = p as UpdateExpensePayload
      const { error } = await supabase.from('expenses').update({ amount: input.amount, description: input.description?.trim() || null }).eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'update', entity: 'expense', entityId: input.id, description: `[offline] Updated expense — PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.expenses })
      break
    }

    /* ── Contributions ── */
    case 'create_contribution_payment': {
      const input = p as CreateContributionPayload
      const { data, error } = await supabase.from('contribution_payments').insert({
        user_id: input.userId, month: input.month, amount: input.amount,
        paid_at: input.paidAt, screenshot_url: input.screenshotUrl ?? null,
        note: input.note?.trim() || null, created_by: input.createdBy,
      }).select('id').single()
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.createdBy, action: 'create', entity: 'contribution_payment', entityId: data.id, description: `[offline] Payment PKR ${input.amount} for ${input.month}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionPayments })
      break
    }
    case 'delete_contribution_payment': {
      const input = p as DeleteContributionPayload
      const { error } = await supabase.from('contribution_payments').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'contribution_payment', entityId: input.id, description: '[offline] Deleted contribution payment' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.contributionPayments })
      break
    }

    /* ── Flat Fund Allocations ── */
    case 'create_flat_fund_allocation': {
      const input = p as CreateFlatFundAllocationPayload
      const { data, error } = await supabase.from('flat_fund_allocations').insert({
        user_id: input.userId, amount: input.amount,
        note: input.note?.trim() || null, allocated_by: input.allocatedBy, date: input.date,
      }).select('id').single()
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.allocatedBy, action: 'create', entity: 'flat_fund_allocation', entityId: data.id, description: `[offline] Allocated PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundAllocations })
      break
    }
    case 'delete_flat_fund_allocation': {
      const input = p as DeleteFlatFundAllocationPayload
      const { error } = await supabase.from('flat_fund_allocations').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'flat_fund_allocation', entityId: input.id, description: '[offline] Deleted flat fund allocation' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundAllocations })
      break
    }

    /* ── Flat Fund Expenses ── */
    case 'create_flat_fund_expense': {
      const input = p as CreateFlatFundExpensePayload
      const { data, error } = await supabase.from('flat_fund_expenses').insert({
        user_id: input.userId, amount: input.amount,
        description: input.description.trim(), category: input.category,
        date: input.date, created_by: input.createdBy,
      }).select('id').single()
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.createdBy, action: 'create', entity: 'flat_fund_expense', entityId: data.id, description: `[offline] Flat fund expense PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundExpenses })
      break
    }
    case 'delete_flat_fund_expense': {
      const input = p as DeleteFlatFundExpensePayload
      const { error } = await supabase.from('flat_fund_expenses').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'flat_fund_expense', entityId: input.id, description: '[offline] Deleted flat fund expense' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.flatFundExpenses })
      break
    }

    /* ── Rides ── */
    case 'create_ride': {
      const input = p as CreateRidePayload
      const { data, error } = await supabase.from('rides').insert({
        date: input.date, service: input.service, route: input.route?.trim() || null,
        amount: input.amount, paid_by: input.paidBy,
        note: input.note?.trim() || null, created_by: input.createdBy,
      }).select('id').single()
      if (error) throw new Error(error.message)
      if (input.riderIds.length > 0) {
        const { error: re } = await supabase.from('ride_riders').insert(input.riderIds.map(uid => ({ ride_id: data.id, user_id: uid })))
        if (re) throw new Error(re.message)
      }
      await logActivity({ userId: input.createdBy, action: 'create', entity: 'ride', entityId: data.id, description: `[offline] Ride: ${input.service} PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rides })
      break
    }
    case 'delete_ride': {
      const input = p as DeleteRidePayload
      const { error } = await supabase.from('rides').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'ride', entityId: input.id, description: '[offline] Deleted ride' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rides })
      break
    }

    /* ── Cook Advances ── */
    case 'create_cook_advance': {
      const input = p as CreateCookAdvancePayload
      const { error } = await supabase.from('cook_advances').insert({
        amount: input.amount, date: input.date,
        note: input.note?.trim() || null, given_by: input.givenBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.givenBy, action: 'create', entity: 'cook_advance', description: `[offline] Cook advance PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookAdvances })
      break
    }
    case 'delete_cook_advance': {
      const input = p as DeleteCookAdvancePayload
      const { error } = await supabase.from('cook_advances').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'cook_advance', entityId: input.id, description: '[offline] Deleted cook advance' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookAdvances })
      break
    }

    /* ── Cook Purchases ── */
    case 'create_cook_purchase': {
      const input = p as CreateCookPurchasePayload
      const { error } = await supabase.from('cook_purchases').insert({
        date: input.date, item: input.item.trim(), amount: input.amount,
        category: input.category, note: input.note?.trim() || null, created_by: input.createdBy,
      })
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.createdBy, action: 'create', entity: 'cook_purchase', description: `[offline] Purchase: ${input.item} PKR ${input.amount}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookPurchases })
      break
    }
    case 'delete_cook_purchase': {
      const input = p as DeleteCookPurchasePayload
      const { error } = await supabase.from('cook_purchases').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'cook_purchase', entityId: input.id, description: `[offline] Deleted purchase${input.item ? `: ${input.item}` : ''}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookPurchases })
      break
    }

    /* ── Cook Requests ── */
    case 'create_cook_request': {
      const input = p as CreateCookRequestPayload
      const { data, error } = await supabase.from('cook_requests').insert({
        item: input.item.trim(), quantity: input.quantity?.trim() || null,
        note: input.note?.trim() || null, requested_by: input.requestedBy, status: 'pending',
      }).select('id').single()
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.requestedBy, action: 'create', entity: 'cook_request', entityId: data.id, description: `[offline] Requested: ${input.item}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests })
      break
    }
    case 'delete_cook_request': {
      const input = p as DeleteCookRequestPayload
      const { error } = await supabase.from('cook_requests').delete().eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'delete', entity: 'cook_request', entityId: input.id, description: '[offline] Deleted cook request' })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests })
      break
    }
    case 'cook_reply': {
      const input = p as CookReplyPayload
      const { error } = await supabase.from('cook_requests').update({
        status: input.status, cook_comment: input.cookComment.trim() || null,
      }).eq('id', input.id)
      if (error) throw new Error(error.message)
      await logActivity({ userId: input.userId, action: 'update', entity: 'cook_request', entityId: input.id, description: `[offline] Cook replied — status: ${input.status}` })
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.cookRequests })
      break
    }

    default:
      // Unknown operation — remove it so it doesn't block the queue
      break
  }
}

/* ── Public: flush the entire queue ─────────────────────────────────────── */

let isFlushing = false

export async function flushQueue(): Promise<{ synced: number; failed: number }> {
  if (isFlushing) return { synced: 0, failed: 0 }
  isFlushing = true

  let synced = 0
  let failed = 0

  try {
    const items = await getAll()
    for (const item of items) {
      if (item.retries >= MAX_RETRIES) {
        // Give up on items that have failed too many times
        await dequeue(item.id)
        failed++
        continue
      }
      try {
        await processItem(item)
        await dequeue(item.id)
        synced++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await updateRetry(item.id, msg)
        failed++
      }
    }
  } finally {
    isFlushing = false
  }

  return { synced, failed }
}
