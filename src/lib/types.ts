import type { Dayjs } from 'dayjs'

export type Role = 'admin' | 'user' | 'cook'

export type ExpenseCategory =
  | 'gas_bill'
  | 'light_bill'
  | 'cook_salary'
  | 'kitchen_daily'
  | 'water_roti'
  | 'meat'
  | 'maintenance'
  | 'pcc_grocery'
  | 'weekend_meal'

export type SplitType = 'all_members' | 'custom_participants'

export interface Profile {
  id: string
  full_name: string
  role: Role
  can_add_expenses: boolean
  is_active?: boolean
  avatar_url?: string | null
  phone?: string | null
  bio?: string | null
}

export interface Room {
  id: number
  name: string
  type: 'bedroom' | 'washroom' | 'kitchen' | 'lounge' | 'dining'
}

export interface Bed {
  id: number
  room_id: number
  label: string
  room?: Room | null
}

export interface BedAssignment {
  id: number
  user_id: string
  bed_id: number
  profile?: Pick<Profile, 'id' | 'full_name' | 'role'> | null
  bed?: Bed | null
}

export interface ExpenseParticipant {
  user_id: string
  profile?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface Expense {
  id: string
  created_by: string
  category: ExpenseCategory
  description: string | null
  amount: number
  date: string
  last_date: string | null
  split_type: SplitType
  bill_image_url: string | null
  created_at: string
  creator?: Pick<Profile, 'id' | 'full_name'> | null
  expense_participants: ExpenseParticipant[]
}

export interface Announcement {
  id: string
  title: string
  content: string
  created_by: string
  created_at: string
  creator?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface Setting {
  key: string
  value: string
}

export interface NavItem {
  key: string
  label: string
  adminOnly?: boolean
}

export interface ExpenseFormValues {
  category: ExpenseCategory
  amount: number
  date: Dayjs
  lastDate?: Dayjs
  description?: string
  participantIds?: string[]
}

export interface CreateExpenseInput {
  createdBy: string
  category: ExpenseCategory
  amount: number
  date: string
  lastDate?: string
  description?: string
  participantIds: string[]
  billImageUrl?: string | null
}

export interface AuthContextValue {
  sessionLoading: boolean
  profileLoading: boolean
  userId: string | null
  email: string | null
  profile: Profile | null
  isAdmin: boolean
  isCook: boolean
  canManageExpenses: boolean
  signOut: () => Promise<void>
}

export interface SummaryStatItem {
  title: string
  value: number | string
  subtitle?: string
}

export interface UserMonthlySummary {
  userId: string
  fullName: string
  fixedShare: number
  weekendShare: number
  totalOwed: number
}

export interface DebtSettlement {
  id: string
  payer_id: string
  payee_id: string
  amount: number
  note: string | null
  settled_at: string
  created_at: string
  created_by: string
  payer?: Pick<Profile, 'id' | 'full_name'> | null
  payee?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CreateSettlementInput {
  payerId: string
  payeeId: string
  amount: number
  note?: string
  settledAt: string
}

/** Net amount A owes B (positive = A owes B, negative = B owes A) */
export interface DebtRow {
  fromId: string
  fromName: string
  toId: string
  toName: string
  /** positive: fromId owes toId this amount */
  netAmount: number
}

export interface RideRider {
  user_id: string
  profile?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface Ride {
  id: string
  date: string
  service: string
  route: string | null
  amount: number
  paid_by: string
  note: string | null
  created_by: string
  created_at: string
  payer?: Pick<Profile, 'id' | 'full_name'> | null
  creator?: Pick<Profile, 'id' | 'full_name'> | null
  ride_riders: RideRider[]
}

export interface CreateRideInput {
  date: string
  service: string
  route?: string
  amount: number
  paidBy: string
  note?: string
  riderIds: string[]
  createdBy: string
}

export type PurchaseCategory = 'grocery' | 'meat' | 'vegetables' | 'spices' | 'dairy' | 'other'

export interface CookAdvance {
  id: string
  amount: number
  date: string
  note: string | null
  given_by: string
  created_at: string
  giver?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CookPurchase {
  id: string
  date: string
  item: string
  amount: number
  category: PurchaseCategory
  note: string | null
  created_at: string
  created_by: string
  creator?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface ActivityLog {
  id: string
  user_id: string
  action: 'create' | 'update' | 'delete'
  entity: string
  entity_id: string | null
  description: string
  created_at: string
  actor?: Pick<Profile, 'id' | 'full_name'> | null
}

/* ─── Flat Fund ───────────────────────────────────────────────────────────── */

export type FlatFundExpenseCategory =
  | 'bulb'
  | 'bread'
  | 'water_bottle'
  | 'cleaning'
  | 'maintenance'
  | 'grocery'
  | 'other'

export interface FlatFundAllocation {
  id: string
  user_id: string
  amount: number
  note: string | null
  allocated_by: string
  date: string
  created_at: string
  member?: Pick<Profile, 'id' | 'full_name'> | null
  allocator?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface FlatFundExpense {
  id: string
  user_id: string
  amount: number
  description: string
  category: FlatFundExpenseCategory
  date: string
  created_by: string
  created_at: string
  member?: Pick<Profile, 'id' | 'full_name'> | null
  creator?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CreateFlatFundAllocationInput {
  userId: string
  amount: number
  note?: string
  allocatedBy: string
  date: string
}

export interface CreateFlatFundExpenseInput {
  userId: string
  amount: number
  description: string
  category: FlatFundExpenseCategory
  date: string
  createdBy: string
}

/** Per-member summary of flat fund balance */
export interface FlatFundMemberSummary {
  userId: string
  fullName: string
  totalAllocated: number
  totalSpent: number
  balance: number
}

/* ─── Contribution Payments ───────────────────────────────────────────────── */

export interface ContributionPayment {
  id: string
  user_id: string
  month: string          // 'YYYY-MM'
  amount: number
  paid_at: string        // date string
  screenshot_url: string | null
  note: string | null
  created_by: string
  created_at: string
  member?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CreateContributionPaymentInput {
  userId: string
  month: string
  amount: number
  paidAt: string
  screenshotUrl?: string | null
  note?: string
  createdBy: string
}

/* ─── Daily Menu ──────────────────────────────────────────────────────────── */

export interface DailyMenu {
  id: string
  date: string
  breakfast: string | null
  lunch: string | null
  dinner: string | null
  dinner_description: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  creator?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CreateDailyMenuInput {
  date: string
  breakfast?: string
  lunch?: string
  dinner?: string
  dinnerDescription?: string
  notes?: string
  createdBy: string
}

export interface UpdateDailyMenuInput {
  id: string
  date: string
  breakfast?: string
  lunch?: string
  dinner?: string
  dinnerDescription?: string
  notes?: string
}

/* ─── Cook Requests ───────────────────────────────────────────────────────── */

export type CookRequestStatus = 'pending' | 'acknowledged' | 'done' | 'rejected'

export interface CookRequest {
  id: string
  item: string
  quantity: string | null
  note: string | null
  cook_comment: string | null
  status: CookRequestStatus
  requested_by: string
  created_at: string
  updated_at: string
  requester?: Pick<Profile, 'id' | 'full_name'> | null
}

export interface CreateCookRequestInput {
  item: string
  quantity?: string
  note?: string
  requestedBy: string
}

/* ─── Advance Contributions ───────────────────────────────────────────────── */

export type AdvanceCategoryKey =
  | 'pcc_grocery'
  | 'maintenance'
  | 'meat'
  | 'water_roti'
  | 'kitchen_daily'
  | 'cook_salary'
  | 'light_bill'
  | 'gas_bill'
  | 'carryover'

export interface MonthlyBudget {
  id: string
  month: string
  category_key: AdvanceCategoryKey
  budget_amount: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface MonthlyContribution {
  id: string
  month: string
  total_budget: number
  flatmate_count: number
  per_person_default: number
  is_published: boolean
  published_at: string | null
  published_by: string | null
  created_by: string
  created_at: string
  updated_at: string
  carryover_from_previous?: number
}

export interface ContributionBreakdown {
  id: string
  monthly_contribution_id: string
  user_id: string
  override_amount: number | null
  note: string | null
  created_at: string
  updated_at: string
  member?: Pick<Profile, 'id' | 'full_name'> | null
}

/** Computed per-member summary used in the admin table */
export interface UserContributionSummary {
  userId: string
  fullName: string
  defaultAmount: number
  overrideAmount: number | null
  finalAmount: number
}

export interface SavePlanInput {
  month: string
  budgets: Partial<Record<AdvanceCategoryKey, number>>
  flatmateCount: number
  overrides: Array<{ userId: string; overrideAmount: number | null; note?: string }>
  createdBy: string
}
