import type { Role } from "@/lib/types";

export interface AddUserFormValues {
  fullName: string;
  email: string;
  password: string;
  role: Role;
  canAddExpenses: boolean;
}

export interface EditUserFormValues {
  fullName: string;
  role: Role;
  canAddExpenses: boolean;
}
