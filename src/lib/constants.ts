import type { ExpenseCategory, NavItem, Role } from '@/lib/types'

export const APP_NAME = 'MilBaant'
export const DEFAULT_MEMBER_COUNT = 10
export const DATE_FORMAT = 'dddd DD MMMM, YYYY'

export const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
]

export const EXPENSE_CATEGORY_OPTIONS: Array<{
  label: string
  value: ExpenseCategory
}> = [
  { label: 'Gas Bill', value: 'gas_bill' },
  { label: 'Light Bill', value: 'light_bill' },
  { label: 'Cook Salary', value: 'cook_salary' },
  { label: 'Kitchen Daily', value: 'kitchen_daily' },
  { label: 'Water + Roti', value: 'water_roti' },
  { label: 'Meat', value: 'meat' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'PCC Grocery', value: 'pcc_grocery' },
  { label: 'Weekend Meal', value: 'weekend_meal' },
]

export const FIXED_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'gas_bill',
  'light_bill',
  'cook_salary',
  'kitchen_daily',
  'water_roti',
  'meat',
  'maintenance',
  'pcc_grocery',
]

export const CATEGORY_LABELS: Record<ExpenseCategory, string> =
  Object.fromEntries(
    EXPENSE_CATEGORY_OPTIONS.map((option) => [option.value, option.label]),
  ) as Record<ExpenseCategory, string>

export const NAV_ITEMS: NavItem[] = [
  { key: '/', label: 'Dashboard' },
  { key: '/expenses', label: 'Expenses' },
  { key: '/weekend-expenses', label: 'Weekend Expenses' },
  { key: '/rides', label: 'Rides' },
  { key: '/cook', label: 'Cook Ledger' },
  { key: '/flat-view', label: 'Flat View' },
  { key: '/announcements', label: 'Announcements' },
  { key: '/admin', label: 'Admin Panel', adminOnly: true },
  { key: '/logs', label: 'Activity Logs' },
]

export const QUERY_KEYS = {
  profile: ['profile'],
  profiles: ['profiles'],
  expenses: ['expenses'],
  announcements: ['announcements'],
  settings: ['settings'],
  rooms: ['rooms'],
  beds: ['beds'],
  bedAssignments: ['bed-assignments'],
  rides: ['rides'],
  cookAdvances: ['cook-advances'],
  cookPurchases: ['cook-purchases'],
  activityLogs: ['activity-logs'],
}

export const PURCHASE_CATEGORY_OPTIONS = [
  { label: 'Grocery', value: 'grocery' },
  { label: 'Meat', value: 'meat' },
  { label: 'Vegetables', value: 'vegetables' },
  { label: 'Spices', value: 'spices' },
  { label: 'Dairy', value: 'dairy' },
  { label: 'Other', value: 'other' },
] as const

export const PURCHASE_CATEGORY_COLORS: Record<string, string> = {
  grocery: 'blue',
  meat: 'red',
  vegetables: 'green',
  spices: 'orange',
  dairy: 'cyan',
  other: 'default',
}

export const RIDE_SERVICES = ['Yango', 'InDriver', 'Careem', 'Uber', 'Other'] as const
export type RideService = (typeof RIDE_SERVICES)[number]
