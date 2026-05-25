import type { AdvanceCategoryKey, ExpenseCategory, FlatFundExpenseCategory, NavItem, Role } from '@/lib/types'

export const APP_NAME = 'MilBaant'
export const DEFAULT_MEMBER_COUNT = 10
export const DATE_FORMAT = 'dddd DD MMMM, YYYY'

export const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Admin', value: 'admin' },
  { label: 'User', value: 'user' },
  { label: 'Cook', value: 'cook' },
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
  { key: '/cook', label: 'Cook Accounts' },
  { key: '/daily-menu', label: 'Menu & Meals' },
  { key: '/contributions', label: 'Monthly Payments' },
  { key: '/flat-view', label: 'Room Layout' },
  { key: '/admin', label: 'Admin', adminOnly: true },
  { key: '/logs', label: 'Audit Log' },
]

export const QUERY_KEYS = {
  profile: ['profile'],
  profiles: ['profiles'],
  expenses: ['expenses'],
  settings: ['settings'],
  rooms: ['rooms'],
  beds: ['beds'],
  bedAssignments: ['bed-assignments'],
  rides: ['rides'],
  cookAdvances: ['cook-advances'],
  cookPurchases: ['cook-purchases'],
  cookRequests: ['cook-requests'],
  activityLogs: ['activity-logs'],
  flatFundAllocations: ['flat-fund-allocations'],
  flatFundExpenses: ['flat-fund-expenses'],
  contributionPayments: ['contribution-payments'],
  dailyMenu: ['daily-menu'],
  announcements: ['announcements'],
  advanceBudgets: ['advance-budgets'],
  monthlyContributions: ['monthly-contributions'],
  contributionBreakdowns: ['contribution-breakdowns'],
}

export const ADVANCE_CATEGORY_KEYS: AdvanceCategoryKey[] = [
  'pcc_grocery',
  'maintenance',
  'meat',
  'water_roti',
  'kitchen_daily',
  'cook_salary',
  'light_bill',
  'gas_bill',
  'carryover',
]

export const ADVANCE_CATEGORY_LABELS: Record<AdvanceCategoryKey, string> = {
  pcc_grocery:   'Grocery',
  maintenance:   'Maintenance',
  meat:          'Meat',
  water_roti:    'Water + Roti',
  kitchen_daily: 'Kitchen Daily',
  cook_salary:   'Cook Salary',
  light_bill:    'Light Bill',
  gas_bill:      'Gas Bill',
  carryover:     'Carryover',
}

export const ADVANCE_CATEGORY_COLORS: Record<AdvanceCategoryKey, string> = {
  pcc_grocery:   'blue',
  maintenance:   'orange',
  meat:          'red',
  water_roti:    'cyan',
  kitchen_daily: 'green',
  cook_salary:   'purple',
  light_bill:    'gold',
  gas_bill:      'volcano',
  carryover:     'geekblue',
}

export const ADVANCE_CATEGORY_DESCRIPTIONS: Record<AdvanceCategoryKey, string> = {
  pcc_grocery: 'Monthly grocery budget including dry goods, vegetables, and other essential grocery items',
  maintenance: 'Monthly maintenance costs for flat repairs, cleaning supplies, and upkeep',
  meat: 'Monthly budget for meat, poultry, and seafood purchases',
  water_roti: 'Budget for drinking water, roti, and bread expenses',
  kitchen_daily: 'Daily kitchen expenses like tea, sugar, spices, and small supplies',
  cook_salary: 'Monthly cook salary payment',
  light_bill: 'Monthly electricity bill estimate',
  gas_bill: 'Monthly gas bill estimate',
  carryover: 'Remaining balance from previous month that reduces this month\'s contribution',
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

export const FLAT_FUND_CATEGORY_OPTIONS: Array<{ label: string; value: FlatFundExpenseCategory }> = [
  { label: 'Bulb / Electricity', value: 'bulb' },
  { label: 'Bread', value: 'bread' },
  { label: 'Water Bottle', value: 'water_bottle' },
  { label: 'Cleaning', value: 'cleaning' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Grocery', value: 'grocery' },
  { label: 'Other', value: 'other' },
]

export const FLAT_FUND_CATEGORY_COLORS: Record<string, string> = {
  bulb: 'gold',
  bread: 'orange',
  water_bottle: 'cyan',
  cleaning: 'green',
  maintenance: 'blue',
  grocery: 'purple',
  other: 'default',
}

export const FLAT_FUND_CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  FLAT_FUND_CATEGORY_OPTIONS.map((o) => [o.value, o.label]),
)
