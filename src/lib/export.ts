import { CATEGORY_LABELS } from '@/lib/constants'
import { calculateWeekendExpenseShare } from '@/lib/expense-helpers'
import { formatDate, formatDateTime } from '@/lib/formatters'
import type { Announcement, Expense, Profile } from '@/lib/types'

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

export async function exportAnnouncementsToExcel(announcements: Announcement[]) {
  const { utils, writeFileXLSX } = await loadWorkbookTools()
  const rows = announcements.map((announcement) => ({
    Title: announcement.title,
    Content: announcement.content,
    'Created By': announcement.creator?.full_name ?? 'Unknown',
    'Created At': formatDateTime(announcement.created_at),
  }))

  const workbook = utils.book_new()
  const worksheet = utils.json_to_sheet(rows)
  utils.book_append_sheet(workbook, worksheet, 'Announcements')
  writeFileXLSX(workbook, 'announcements.xlsx')
}
