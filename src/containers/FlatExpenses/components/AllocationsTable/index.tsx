import { Table, Tag, Typography, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { FlatFundAllocation } from "@/lib/types";

interface AllocationsTableProps {
  allocations: FlatFundAllocation[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

export function AllocationsTable({
  allocations,
  isAdmin,
  onDelete,
}: AllocationsTableProps) {
  const columns: ColumnsType<FlatFundAllocation> = [
    {
      title: "S.N",
      key: "sn",
      width: 52,
      render: (_: unknown, __: FlatFundAllocation, index: number) => (
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
      render: (_: unknown, r: FlatFundAllocation) => (
        <Tag color="blue">{r.member?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#52c41a" }}>
          +{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Allocated By",
      key: "allocator",
      render: (_: unknown, r: FlatFundAllocation) => (
        <Tag color="purple">{r.allocator?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Note",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "",
      key: "del",
      width: 44,
      render: (_: unknown, r: FlatFundAllocation) =>
        isAdmin ? (
          <Popconfirm
            title="Remove this allocation?"
            onConfirm={() => onDelete(r.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Table<FlatFundAllocation>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={allocations}
      pagination={{
        pageSize: 15,
        hideOnSinglePage: true,
        size: "small",
        showTotal: (total, range) =>
          `${range[0]}–${range[1]} of ${total} allocations`,
      }}
      scroll={{ x: 500 }}
      locale={{ emptyText: "No allocations recorded yet." }}
    />
  );
}
