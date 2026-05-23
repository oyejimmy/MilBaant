import { Table, Tag, Image, Flex, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { calculateWeekendExpenseShare } from "@/lib/expense-helpers";
import type { Expense } from "../../types";

interface WeekendExpensesTableProps {
  expenses: Expense[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function WeekendExpensesTable({
  expenses,
  isAdmin,
  onDelete,
}: WeekendExpensesTableProps) {
  const columns: ColumnsType<Expense> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 190,
      render: (value: string) => formatDate(value),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (value: string | null) => value || "Weekend meal",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Participants",
      key: "participants",
      render: (_: unknown, record: Expense) => (
        <Flex wrap gap={8}>
          {record.expense_participants?.map((participant) => (
            <Tag key={`${record.id}-${participant.user_id}`} color="cyan">
              {participant.profile?.full_name ?? "Unknown"}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: "Share per Person",
      key: "share",
      render: (_: unknown, record: Expense) =>
        formatCurrency(calculateWeekendExpenseShare(record)),
    },
    {
      title: "Bill Image",
      dataIndex: "bill_image_url",
      key: "bill_image_url",
      render: (value: string | null) =>
        value ? <Image width={64} src={value} alt="Bill" /> : "—",
    },
    ...(isAdmin
      ? [
          {
            title: "Action",
            key: "action",
            render: (_: unknown, record: Expense) => (
              <Popconfirm
                title="Delete this expense?"
                description="This action cannot be undone."
                onConfirm={() => onDelete(record.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={expenses}
      pagination={false}
      scroll={{ x: 800 }}
      size="small"
    />
  );
}
