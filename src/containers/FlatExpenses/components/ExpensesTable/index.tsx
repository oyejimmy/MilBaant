import { Table, Tag, Typography, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import {
  FLAT_FUND_CATEGORY_COLORS,
  FLAT_FUND_CATEGORY_LABELS,
} from "@/lib/constants";
import type { FlatFundExpense } from "@/lib/types";

interface ExpensesTableProps {
  expenses: FlatFundExpense[];
  userId?: string;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function ExpensesTable({
  expenses,
  userId,
  isAdmin,
  onDelete,
}: ExpensesTableProps) {
  const columns: ColumnsType<FlatFundExpense> = [
    {
      title: "S.N",
      key: "sn",
      width: 52,
      render: (_: unknown, __: FlatFundExpense, index: number) => (
        <Typography.Text style={{ color: "var(--text-muted)", fontSize: 12 }}>
          {index + 1}
        </Typography.Text>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 110,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Member",
      key: "member",
      render: (_: unknown, r: FlatFundExpense) => (
        <Tag color="blue">{r.member?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (v: string) => (
        <Tag
          color={FLAT_FUND_CATEGORY_COLORS[v] ?? "default"}
          style={{ textTransform: "capitalize" }}
        >
          {FLAT_FUND_CATEGORY_LABELS[v] ?? v}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#ff4d4f" }}>
          -{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "",
      key: "del",
      width: 44,
      render: (_: unknown, r: FlatFundExpense) =>
        r.created_by === userId || isAdmin ? (
          <Popconfirm
            title="Remove this expense?"
            onConfirm={() => onDelete(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Table<FlatFundExpense>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={expenses}
      pagination={{
        pageSize: 15,
        hideOnSinglePage: true,
        size: "small",
        showTotal: (total, range) =>
          `${range[0]}–${range[1]} of ${total} expenses`,
      }}
      scroll={{ x: 550 }}
      locale={{ emptyText: "No expenses logged yet." }}
    />
  );
}
