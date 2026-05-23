import { Space, Tag, Typography, Flex, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { MobileCard, MobileRow, MobileLabel } from "@/components/Glass/index";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FlatFundAllocation } from "@/lib/types";

interface MobileAllocationsListProps {
  allocations: FlatFundAllocation[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function MobileAllocationsList({
  allocations,
  isAdmin,
  onDelete,
}: MobileAllocationsListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {allocations.length === 0 && (
        <Typography.Text type="secondary">
          No allocations recorded yet.
        </Typography.Text>
      )}
      {allocations.map((a) => (
        <MobileCard key={a.id}>
          <MobileRow>
            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
              {a.member?.full_name ?? "—"}
            </Tag>
            <Typography.Text strong style={{ color: "#52c41a" }}>
              +{formatCurrency(a.amount)}
            </Typography.Text>
          </MobileRow>
          <MobileRow>
            <Flex gap={6} align="center">
              <MobileLabel>{formatDate(a.date)}</MobileLabel>
              <Typography.Text
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                by {a.allocator?.full_name ?? "—"}
              </Typography.Text>
            </Flex>
            {isAdmin && (
              <Popconfirm title="Remove?" onConfirm={() => onDelete(a.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            )}
          </MobileRow>
          {a.note && (
            <Typography.Text
              style={{ fontSize: 11, color: "var(--text-muted)" }}
            >
              {a.note}
            </Typography.Text>
          )}
        </MobileCard>
      ))}
    </Space>
  );
}
