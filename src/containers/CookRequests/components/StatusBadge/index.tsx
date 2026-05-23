import { Tag } from "antd";
import type { CookRequestStatus } from "@/lib/types";
import { STATUS_META } from "../../types";

interface StatusBadgeProps {
  status: CookRequestStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];
  return (
    <Tag color={meta.color} icon={meta.icon} style={{ margin: 0 }}>
      {meta.label}
    </Tag>
  );
}
