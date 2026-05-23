import { Space, Tag, Typography, Flex, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { MobileCard, MobileRow, MobileLabel } from "@/components/Glass/index";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calculateWeekendExpenseShare } from "@/lib/expense-helpers";
import type { Expense } from "../../types";

interface MobileWeekendExpensesListProps {
  expenses: Expense[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function MobileWeekendExpensesList({
  expenses,
  isAdmin,
  onDelete,
}: MobileWeekendExpensesListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {expenses.length === 0 && (
        <Typography.Text type="secondary">
          No weekend expenses for this month.
        </Typography.Text>
      )}
      {expenses.map((exp) => (
        <MobileCard key={exp.id}>
          <MobileRow>
            <MobileLabel>{formatDate(exp.date)}</MobileLabel>
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              {formatCurrency(exp.amount)}
            </Typography.Text>
          </MobileRow>
          <Typography.Text style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {exp.description || "Weekend meal"}
          </Typography.Text>
          <Flex wrap gap={4}>
            {exp.expense_participants?.map((p) => (
              <Tag
                key={p.user_id}
                color="cyan"
                style={{ margin: 0, fontSize: 11 }}
              >
                {p.profile?.full_name ?? "?"}
              </Tag>
            ))}
          </Flex>
          <MobileRow>
            <Typography.Text
              style={{ fontSize: 11, color: "var(--text-muted)" }}
            >
              Share/person: {formatCurrency(calculateWeekendExpenseShare(exp))}
            </Typography.Text>
            {isAdmin && (
              <Popconfirm title="Delete?" onConfirm={() => onDelete(exp.id)}>
                <Button danger icon={<DeleteOutlined />} size="small" />
              </Popconfirm>
            )}
          </MobileRow>
        </MobileCard>
      ))}
    </Space>
  );
}
