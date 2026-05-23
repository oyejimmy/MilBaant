import { Table, Tag, Typography, Button, Space, Popconfirm } from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calculateWeekendExpenseShare } from "@/lib/expense-helpers";
import type { Expense } from "@/lib/types";

interface ExpensesTableProps {
  expenses: Expense[];
  userId?: string;
  onView: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpensesTable({
  expenses,
  userId,
  onView,
  onDelete,
}: ExpensesTableProps) {
  const columns: ColumnsType<Expense> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 100,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (v: string | null, record: Expense) => {
        const parts: string[] = [];
        if (v) parts.push(v);
        if (record.last_date)
          parts.push(`Last Date: ${formatDate(record.last_date)}`);
        return parts.length > 0 ? (
          parts.join(" | ")
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "Paid By",
      key: "paidBy",
      width: 100,
      render: (_: unknown, record: Expense) => (
        <Tag color="purple" style={{ fontSize: 11 }}>
          {record.creator?.full_name ?? "—"}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 90,
      render: (v: number) => (
        <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
      ),
    },
    {
      title: "Share",
      key: "share",
      width: 90,
      render: (_: unknown, record: Expense) =>
        formatCurrency(calculateWeekendExpenseShare(record)),
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_: unknown, record: Expense) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          />
          {record.created_by === userId && (
            <Popconfirm title="Delete?" onConfirm={() => onDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<Expense>
      rowKey="id"
      columns={columns}
      dataSource={expenses}
      pagination={{ pageSize: 10, hideOnSinglePage: true, size: "small" }}
      scroll={{ x: 550 }}
      size="small"
      onRow={(record) => ({
        onClick: () => onView(record),
        style: { cursor: "pointer" },
      })}
      locale={{ emptyText: "No weekend expenses for this month." }}
    />
  );
}
