export type { Expense } from "@/lib/types";

export interface UserMonthlySummary {
  userId: string;
  fullName: string;
  fixedShare: number;
  weekendShare: number;
  totalOwed: number;
}