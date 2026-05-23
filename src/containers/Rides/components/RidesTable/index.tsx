import { Table, Tag, Flex, Typography, Button, Space, Popconfirm } from "antd";
import {
  CarOutlined,
  EyeOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Ride } from "@/lib/types";

interface RidesTableProps {
  rides: Ride[];
  userId?: string;
  onView: (ride: Ride) => void;
  onDelete: (id: string) => void;
}

export function RidesTable({
  rides,
  userId,
  onView,
  onDelete,
}: RidesTableProps) {
  const columns: ColumnsType<Ride> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 190,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: "Service",
      dataIndex: "service",
      key: "service",
      width: 100,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: "Route",
      dataIndex: "route",
      key: "route",
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <Flex align="center" gap={4}>
            <CarOutlined style={{ color: "var(--text-muted)", fontSize: 12 }} />
            <Typography.Text style={{ fontSize: "0.85rem" }}>
              {v}
            </Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Paid By",
      key: "paidBy",
      width: 120,
      render: (_: unknown, r: Ride) => (
        <Tag color="purple">{r.payer?.full_name ?? "—"}</Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 110,
      render: (v: number) => (
        <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: "Share / Rider",
      key: "share",
      width: 120,
      render: (_: unknown, r: Ride) =>
        r.ride_riders.length > 0
          ? formatCurrency(r.amount / r.ride_riders.length)
          : "—",
    },
    {
      title: "Riders",
      key: "riders",
      responsive: ["md"] as "md"[],
      render: (_: unknown, r: Ride) => (
        <Flex wrap gap={4}>
          {r.ride_riders.map((rr) => (
            <Tag key={rr.user_id} style={{ margin: 0 }}>
              <UserOutlined style={{ fontSize: 10, marginRight: 4 }} />
              {rr.profile?.full_name ?? "?"}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 70,
      render: (_: unknown, r: Ride) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => onView(r)}
          />
          {userId && (
            <Popconfirm
              title="Delete this ride?"
              onConfirm={() => onDelete(r.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Table<Ride>
      rowKey="id"
      columns={columns}
      dataSource={rides}
      size="small"
      pagination={{ pageSize: 10, hideOnSinglePage: true }}
      scroll={{ x: 600 }}
      onRow={(record) => ({
        onClick: () => onView(record),
        style: { cursor: "pointer" },
      })}
      locale={{ emptyText: "No rides recorded for this month." }}
    />
  );
}
