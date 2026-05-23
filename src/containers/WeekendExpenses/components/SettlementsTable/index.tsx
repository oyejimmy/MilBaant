import { Table, Tag, Typography, Button, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { DebtSettlement } from "@/lib/types";

interface SettlementsTableProps {
  settlements: DebtSettlement[];
  userId?: string;
  onDelete: (id: string) => void;
}

export function SettlementsTable({
  settlements,
  userId,
  onDelete,
}: SettlementsTableProps) {
  const columns: ColumnsType<DebtSettlement> = [
    {
      title: "Date",
      dataIndex: "settled_at",
      key: "settled_at",
      width: 100,
      render: (v: string) => formatDate(v),
    },
    {
      title: "From",
      key: "payer",
      render: (_: unknown, r: DebtSettlement) => (
        <Tag color="blue" style={{ fontSize: 11 }}>
          {r.payer?.full_name ?? r.payer_id}
        </Tag>
      ),
    },
    {
      title: "To",
      key: "payee",
      render: (_: unknown, r: DebtSettlement) => (
        <Tag color="green" style={{ fontSize: 11 }}>
          {r.payee?.full_name ?? r.payee_id}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      render: (v: number) => (
        <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
      ),
    },
    {
      title: "",
      key: "del",
      width: 44,
      render: (_: unknown, r: DebtSettlement) =>
        userId ? (
          <Popconfirm title="Remove?" onConfirm={() => onDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Table<DebtSettlement>
      rowKey="id"
      size="small"
      pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
      scroll={{ x: 450 }}
      dataSource={settlements}
      columns={columns}
    />
  );
}
