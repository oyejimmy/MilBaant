import type { DebtRow } from "@/lib/types";

export interface DebtRowExtended extends DebtRow {
  netAmount: number;
}
