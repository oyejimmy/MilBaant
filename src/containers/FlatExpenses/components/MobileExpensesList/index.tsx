import { Space, Tag, Typography, Flex, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { MobileCard, MobileRow, MobileLabel } from "@/components/Glass/index";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  FLAT_FUND_CATEGORY_COLORS,
  FLAT_FUND_CATEGORY_LABELS,
} from "@/lib/constants";
import type { FlatFundExpense } from "@/lib/types";

interface MobileExpensesListProps {
  expenses: FlatFundExpense[];
  userId?: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function MobileExpensesList({
  expenses,
  userId,
  isAdmin,
  onDelete,
}: MobileExpensesListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {expenses.length === 0 && (
        <Typography.Text type="secondary">
          No expenses logged yet.
        </Typography.Text>
      )}
      {expenses.map((e) => (
        <MobileCard key={e.id}>
          <MobileRow>
            <Flex gap={6} align="center">
              <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                {e.member?.full_name ?? "—"}
              </Tag>
              <Tag
                color={FLAT_FUND_CATEGORY_COLORS[e.category] ?? "default"}
                style={{ margin: 0, fontSize: 10 }}
              >
                {FLAT_FUND_CATEGORY_LABELS[e.category] ?? e.category}
              </Tag>
            </Flex>
            <Typography.Text strong style={{ color: "#ff4d4f" }}>
              -{formatCurrency(e.amount)}
            </Typography.Text>
          </MobileRow>
          <MobileRow>
            <Typography.Text
              style={{ fontSize: 12, color: "var(--text-strong)" }}
            >
              {e.description}
            </Typography.Text>
            <MobileLabel>{formatDate(e.date)}</MobileLabel>
          </MobileRow>
          {(e.created_by === userId || isAdmin) && (
            <MobileRow>
              <div />
              <Popconfirm title="Remove?" onConfirm={() => onDelete(e.id)}>
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </MobileRow>
          )}
        </MobileCard>
      ))}
    </Space>
  );
}
