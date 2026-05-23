export type FilterType = "all" | "paid" | "unpaid";

export interface PaymentSubmitFormValues {
  amount: number;
  paidAt: any;
  note?: string;
}
