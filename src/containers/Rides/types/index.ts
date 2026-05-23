import type { Dayjs } from "dayjs";

export interface DebtEntry {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}

export interface RideFormValues {
  date: Dayjs;
  service: string;
  route: string;
  amount: number;
  paidBy: string;
  note: string;
  riderIds: string[];
}

export interface RiderSummary {
  id: string;
  name: string;
  totalShare: number;
  rideCount: number;
}
