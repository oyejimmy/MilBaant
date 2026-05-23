import { Card, Flex, Typography, Tag, Button, Popconfirm, Space } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calculateWeekendExpenseShare } from "@/lib/expense-helpers";
import type { Expense } from "@/lib/types";

interface MobileExpensesListProps {
  expenses: Expense[];
  userId?: string;
  onView: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function MobileExpensesList({
  expenses,
  userId,
  onView,
  onDelete,
}: MobileExpensesListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {expenses.length === 0 && (
        <Typography.Text type="secondary">
          No weekend expenses for this month.
        </Typography.Text>
      )}
      {expenses.map((exp) => (
        <Card
          key={exp.id}
          hoverable
          style={{ cursor: "pointer" }}
          onClick={() => onView(exp)}
        >
          <Flex vertical gap={8}>
            <Flex justify="space-between" align="center">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(exp.date)}
              </Typography.Text>
              <Typography.Text strong>
                {formatCurrency(exp.amount)}
              </Typography.Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Typography.Text
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                {exp.description || "Weekend meal"}
              </Typography.Text>
              <Tag color="purple" style={{ fontSize: 11, margin: 0 }}>
                {exp.creator?.full_name ?? "—"}
              </Tag>
            </Flex>
            <Flex justify="space-between" align="center">
              <Flex wrap gap={4}>
                {exp.expense_participants.slice(0, 3).map((p) => (
                  <Tag
                    key={p.user_id}
                    color="cyan"
                    style={{ margin: 0, fontSize: 10 }}
                  >
                    {p.profile?.full_name ?? "?"}
                  </Tag>
                ))}
                {exp.expense_participants.length > 3 && (
                  <Tag style={{ margin: 0, fontSize: 10 }}>
                    +{exp.expense_participants.length - 3}
                  </Tag>
                )}
              </Flex>
              <Typography.Text
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  whiteSpace: "nowrap",
                }}
              >
                {formatCurrency(calculateWeekendExpenseShare(exp))}/person
              </Typography.Text>
            </Flex>
            {exp.created_by === userId && (
              <Flex justify="flex-end">
                <Popconfirm title="Delete?" onConfirm={() => onDelete(exp.id)}>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Flex>
            )}
          </Flex>
        </Card>
      ))}
    </Space>
  );
}
