export interface FlatFundMemberSummary {
  userId: string;
  fullName: string;
  totalAllocated: number;
  totalSpent: number;
  balance: number;
}

export interface CreateFlatFundAllocationInput {
  userId: string;
  amount: number;
  note?: string;
  allocatedBy: string;
  date: string;
}

export interface CreateFlatFundExpenseInput {
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  createdBy: string;
}

export interface AllocateModalProps {
  profiles: Array<{ id: string; full_name: string }>;
  userId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateFlatFundAllocationInput) => Promise<void>;
}

export interface LogExpenseModalProps {
  profiles: Array<{ id: string; full_name: string }>;
  userId: string;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateFlatFundExpenseInput) => Promise<void>;
}
