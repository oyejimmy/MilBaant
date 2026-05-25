import { Space, Tag, Typography, Flex, Button, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { MobileCard, MobileRow, MobileLabel } from "@/components/Glass/index";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Expense } from "../../types";

interface MobileExpensesListProps {
  expenses: Expense[];
  isAdmin: boolean;
  fixedTotal: number;
  perMemberShare: number;
  activeMemberCount: number;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string, label?: string) => void;
}

export function MobileExpensesList({
  expenses,
  isAdmin,
  fixedTotal,
  perMemberShare,
  activeMemberCount,
  onEdit,
  onDelete,
}: MobileExpensesListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {expenses.length === 0 && (
        <Typography.Text type="secondary">
          No shared expenses for this month.
        </Typography.Text>
      )}
      {expenses.map((exp) => (
        <MobileCard key={exp.id}>
          <MobileRow>
            <Tag color="blue" style={{ margin: 0 }}>
              {CATEGORY_LABELS[exp.category]}
            </Tag>
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              {formatCurrency(exp.amount)}
            </Typography.Text>
          </MobileRow>
          <MobileRow>
            <MobileLabel>{formatDate(exp.date)}</MobileLabel>
            {(exp.description || exp.last_date) && (
              <Typography.Text
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textAlign: "right",
                  flex: 1,
                  marginLeft: 8,
                }}
                ellipsis
              >
                {[
                  exp.description,
                  exp.last_date
                    ? `Last Date: ${formatDate(exp.last_date)}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" | ")}
              </Typography.Text>
            )}
          </MobileRow>
          {isAdmin && (
            <MobileRow>
              <div />
              <Flex gap={6}>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(exp)}
                />
                <Popconfirm
                  title="Delete?"
                  onConfirm={() =>
                    onDelete(exp.id, CATEGORY_LABELS[exp.category])
                  }
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Flex>
            </MobileRow>
          )}
        </MobileCard>
      ))}
      {expenses.length > 0 && (
        <div
          style={{
            padding: "8px 12px",
            background: "var(--content-bg)",
            borderRadius: 7,
            border: "1px solid var(--card-border)",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Typography.Text strong>Total</Typography.Text>
          <Flex gap={8} align="center">
            <Typography.Text strong>
              {formatCurrency(fixedTotal)}
            </Typography.Text>
            <Tag color="blue">Per-person ({activeMemberCount} people): {formatCurrency(perMemberShare)}</Tag>
          </Flex>
        </div>
      )}
    </Space>
  );
}
