import { CATEGORY_LABELS, FLAT_FUND_CATEGORY_LABELS } from '@/lib/constants'
import { calculateWeekendExpenseShare } from '@/lib/expense-helpers'
import { formatDate } from '@/lib/formatters'
import type { CookPurchase, Expense, FlatFundAllocation, FlatFundExpense, Profile } from '@/lib/types'

async function loadWorkbookTools() {
  const { utils, writeFileXLSX } = await import('xlsx')
  return { utils, writeFileXLSX }
}

export async function exportExpensesToExcel(
  expenses: Expense[],
  monthLabel: string,
) {
  const { utils, writeFileXLSX } = await loadWorkbookTools()
  const rows = expenses.map((expense) => ({
    Date: formatDate(expense.date),
    Category: CATEGORY_LABELS[expense.category],
    Description: expense.description ?? '',
    Amount: expense.amount,
    'Split Type': expense.split_type,
    Participants:
      expense.expense_participants
        .map((participant) => participant.profile?.full_name ?? 'Unknown')
        .join(', ') ?? '',
    'Share Per Person':
      expense.category === 'weekend_meal'
        ? calculateWeekendExpenseShare(expense)
        : '',
    'Bill URL': expense.bill_image_url ?? '',
  }))

  const workbook = utils.book_new()
  const worksheet = utils.json_to_sheet(rows)
  utils.book_append_sheet(workbook, worksheet, 'Expenses')
  writeFileXLSX(workbook, `flat-expenses-${monthLabel}.xlsx`)
}

export async function exportUsersToExcel(profiles: Profile[]) {
  const { utils, writeFileXLSX } = await loadWorkbookTools()
  const rows = profiles.map((profile) => ({
    'Full Name': profile.full_name,
    Role: profile.role,
    'Can Add Expenses': profile.can_add_expenses ? 'Yes' : 'No',
    'User ID': profile.id,
  }))

  const workbook = utils.book_new()
  const worksheet = utils.json_to_sheet(rows)
  utils.book_append_sheet(workbook, worksheet, 'Users')
  writeFileXLSX(workbook, 'flat-users.xlsx')
}

/* ─── Flat Fund exports ───────────────────────────────────────────────────── */

export async function exportFlatExpensesToExcel(
  expenses: FlatFundExpense[],
  allocations: FlatFundAllocation[],
) {
  const { utils, writeFileXLSX } = await loadWorkbookTools()

  const expenseRows = expenses.map((e, i) => ({
    'S.N': i + 1,
    Date: formatDate(e.date),
    Member: e.member?.full_name ?? '—',
    Description: e.description ?? '',
    Category: FLAT_FUND_CATEGORY_LABELS[e.category] ?? e.category,
    'Amount (PKR)': e.amount,
  }))

  const allocationRows = allocations.map((a, i) => ({
    'S.N': i + 1,
    Date: formatDate(a.date),
    Member: a.member?.full_name ?? '—',
    'Allocated By': a.allocator?.full_name ?? '—',
    'Amount (PKR)': a.amount,
    Note: a.note ?? '',
  }))

  const workbook = utils.book_new()
  utils.book_append_sheet(workbook, utils.json_to_sheet(expenseRows), 'Flat Expenses')
  utils.book_append_sheet(workbook, utils.json_to_sheet(allocationRows), 'Fund Allocations')
  writeFileXLSX(workbook, `flat-fund-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

/* ─── Cook exports ────────────────────────────────────────────────────────── */

export async function exportCookPurchasesToExcel(
  purchases: CookPurchase[],
  monthLabel?: string,
) {
  const { utils, writeFileXLSX } = await loadWorkbookTools()
  const rows = purchases.map((p, i) => ({
    'S.N': i + 1,
    Date: formatDate(p.date),
    Item: p.item,
    Category: p.category.charAt(0).toUpperCase() + p.category.slice(1),
    'Amount (PKR)': p.amount,
    'Logged By': p.creator?.full_name ?? '—',
    Note: p.note ?? '',
  }))

  const workbook = utils.book_new()
  const worksheet = utils.json_to_sheet(rows)
  utils.book_append_sheet(workbook, worksheet, 'Cook Purchases')
  const suffix = monthLabel ?? new Date().toISOString().slice(0, 10)
  writeFileXLSX(workbook, `cook-purchases-${suffix}.xlsx`)
}
