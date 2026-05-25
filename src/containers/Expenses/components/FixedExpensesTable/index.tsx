import { Table, Tag, Typography, Button, Space, Popconfirm } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { CATEGORY_LABELS } from "@/lib/constants";
import type { Expense } from "../../types";

interface FixedExpensesTableProps {
  expenses: Expense[];
  isAdmin: boolean;
  expandedDescriptions: Set<string>;
  fixedTotal: number;
  perMemberShare: number;
  activeMemberCount: number;
  onToggleDescription: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string, label?: string) => void;
}

export function FixedExpensesTable({
  expenses,
  isAdmin,
  expandedDescriptions,
  fixedTotal,
  perMemberShare,
  activeMemberCount,
  onToggleDescription,
  onEdit,
  onDelete,
}: FixedExpensesTableProps) {
  const DESCRIPTION_LIMIT = 60;

  const columns: ColumnsType<Expense> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 130,
      sorter: (a: Expense, b: Expense) => a.date.localeCompare(b.date),
      render: (value: string) => formatDate(value),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: (a: Expense, b: Expense) =>
        CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category]),
      render: (value: Expense["category"]) => (
        <Tag color="blue">{CATEGORY_LABELS[value]}</Tag>
      ),
    },
    {
      title: "Paid Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: (a: Expense, b: Expense) => a.amount - b.amount,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      sorter: (a: Expense, b: Expense) =>
        (a.description ?? "").localeCompare(b.description ?? ""),
      render: (value: string | null, record: Expense) => {
        const parts: string[] = [];

        if (value) {
          parts.push(value);
        }

        if (record.last_date) {
          parts.push(`Last Date: ${formatDate(record.last_date)}`);
        }

        if (parts.length === 0) return "—";

        const fullText = parts.join(" | ");
        const isLong = fullText.length > DESCRIPTION_LIMIT;
        const expanded = expandedDescriptions.has(record.id);

        return (
          <span>
            {isLong && !expanded
              ? `${fullText.slice(0, DESCRIPTION_LIMIT)}…`
              : fullText}
            {isLong && (
              <Typography.Link
                style={{ marginLeft: 6, fontSize: 12 }}
                onClick={() => onToggleDescription(record.id)}
              >
                {expanded ? "See less" : "See more"}
              </Typography.Link>
            )}
          </span>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            title: "Actions",
            key: "action",
            render: (_: unknown, record: Expense) => (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => onEdit(record)}
                />
                <Popconfirm
                  title="Delete this expense?"
                  description="This action cannot be undone."
                  onConfirm={() =>
                    onDelete(record.id, CATEGORY_LABELS[record.category])
                  }
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Space>
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
      scroll={{ x: 700 }}
      size="small"
      summary={() => (
        <Table.Summary.Row>
          <Table.Summary.Cell index={0} colSpan={2}>
            <Typography.Text strong>Total</Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={1}>
            <Typography.Text strong>
              {formatCurrency(fixedTotal)}
            </Typography.Text>
          </Table.Summary.Cell>
          <Table.Summary.Cell index={2}>
            <Tag
              color="blue"
              style={{
                fontWeight: 600,
                fontSize: 13,
                padding: "2px 10px",
              }}
            >
              Per-person ({activeMemberCount} people): {formatCurrency(perMemberShare)}
            </Tag>
          </Table.Summary.Cell>
          {isAdmin && <Table.Summary.Cell index={3} />}
        </Table.Summary.Row>
      )}
    />
  );
}
