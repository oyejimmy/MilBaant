import { Table, Avatar, Tag, Typography, Flex, Button, Popconfirm } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/formatters";
import type { UserMonthlySummary } from "../../types";
import type { ContributionPayment } from "@/lib/types";

interface UserSummaryTableProps {
  summaries: UserMonthlySummary[];
  paymentsByUser: Map<string, ContributionPayment[]>;
  selectedMonth: dayjs.Dayjs;
  userId?: string;
  isAdmin: boolean;
  onDeletePayment: (id: string) => void;
}

export function UserSummaryTable({
  summaries,
  paymentsByUser,
  selectedMonth,
  userId,
  isAdmin,
  onDeletePayment,
}: UserSummaryTableProps) {
  const columns: ColumnsType<UserMonthlySummary> = [
    {
      title: "Flatmate",
      dataIndex: "fullName",
      key: "fullName",
      render: (v: string, row: UserMonthlySummary) => (
        <Flex align="center" gap={8}>
          <Avatar
            size={24}
            style={{ background: "#909ffa", color: "#fff", fontSize: 11 }}
            icon={<UserOutlined />}
          />
          <Typography.Text
            style={{ color: "var(--text-strong)", fontSize: 13 }}
          >
            {v}
          </Typography.Text>
          {row.userId === userId && (
            <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
              You
            </Tag>
          )}
        </Flex>
      ),
    },
    {
      title: "Share",
      dataIndex: "fixedShare",
      key: "fixedShare",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Weekend",
      dataIndex: "weekendShare",
      key: "weekendShare",
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Total Owed",
      dataIndex: "totalOwed",
      key: "totalOwed",
      render: (value: number) => (
        <Typography.Text strong style={{ color: "var(--text-strong)" }}>
          {formatCurrency(value)}
        </Typography.Text>
      ),
    },
    {
      title: "Payment Status",
      key: "payment",
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? [];
        const totalPaid = userPayments.reduce((s, p) => s + p.amount, 0);
        const isPaid = totalPaid >= row.totalOwed - 0.01;
        const isOverdue =
          !isPaid && dayjs().isAfter(dayjs(selectedMonth).endOf("month"));
        if (userPayments.length === 0) {
          return isOverdue ? (
            <Tag color="red" icon={<ClockCircleOutlined />}>
              Overdue
            </Tag>
          ) : (
            <Tag color="default">Pending</Tag>
          );
        }
        return (
          <Flex gap={4} wrap>
            {isPaid ? (
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Paid {formatCurrency(totalPaid)}
              </Tag>
            ) : (
              <Tag color="orange" icon={<ClockCircleOutlined />}>
                Partial {formatCurrency(totalPaid)}
              </Tag>
            )}
          </Flex>
        );
      },
    },
    {
      title: "Screenshot",
      key: "screenshot",
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? [];
        const withScreenshot = userPayments.filter((p) => p.screenshot_url);
        if (withScreenshot.length === 0)
          return <Typography.Text type="secondary">—</Typography.Text>;
        return (
          <Typography.Text type="secondary">
            View in Contributions page
          </Typography.Text>
        );
      },
    },
    {
      title: "",
      key: "action",
      width: 44,
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? [];
        return (
          <Flex gap={4}>
            {userPayments.map((p) =>
              p.created_by === userId || isAdmin ? (
                <Popconfirm
                  key={p.id}
                  title="Remove this payment?"
                  onConfirm={() => onDeletePayment(p.id)}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : null,
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <Table
      rowKey="userId"
      columns={columns}
      dataSource={summaries}
      pagination={false}
      scroll={{ x: 700 }}
      size="small"
    />
  );
}
