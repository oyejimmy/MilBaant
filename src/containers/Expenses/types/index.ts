export interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  paid_by_name?: string;
  split_type: "equal" | "percentage" | "exact";
  splits: Array<{
    user_id: string;
    amount?: number;
    percentage?: number;
  }>;
  date: string;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  category?: string;
  notes?: string;
  last_date?: string;
  bill_image_url?: string;
  expense_participants?: Array<{
    user_id: string;
    profile?: {
      full_name: string;
    };
  }>;
}

export interface UserMonthlySummary {
  userId: string;
  fullName: string;
  fixedShare: number;
  weekendShare: number;
  totalOwed: number;
}