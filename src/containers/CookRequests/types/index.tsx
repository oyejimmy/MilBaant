import type { CookRequestStatus } from "@/lib/types";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";

export interface AddRequestFormValues {
  item: string;
  quantity?: string;
  note?: string;
}

export interface ReplyFormValues {
  status: CookRequestStatus;
  cook_comment: string;
}

export const STATUS_META: Record<
  CookRequestStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "#f9a825",
    icon: <ClockCircleOutlined />,
  },
  acknowledged: {
    label: "Acknowledged",
    color: "#1890ff",
    icon: <SyncOutlined spin />,
  },
  done: { label: "Done", color: "#52c41a", icon: <CheckCircleOutlined /> },
  rejected: {
    label: "Rejected",
    color: "#ff4d4f",
    icon: <CloseCircleOutlined />,
  },
};

export const STATUS_OPTIONS: Array<{
  label: string;
  value: CookRequestStatus;
}> = [
  { label: "Pending", value: "pending" },
  { label: "Acknowledged", value: "acknowledged" },
  { label: "Done", value: "done" },
  { label: "Rejected", value: "rejected" },
];
