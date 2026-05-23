import { Avatar, Tag, Typography, Flex, Button, Popconfirm, Space } from "antd";
import {
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { MobileCard, MobileRow } from "@/components/Glass/index";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { UserMonthlySummary } from "../../types";
import type { ContributionPayment } from "@/lib/types";
import { PaymentHistoryText } from "../styles";

interface MobileUserSummaryListProps {
  summaries: UserMonthlySummary[];
  paymentsByUser: Map<string, ContributionPayment[]>;
  selectedMonth: dayjs.Dayjs;
  userId?: string;
  isAdmin: boolean;
  onDeletePayment: (id: string) => void;
}

export function MobileUserSummaryList({
  summaries,
  paymentsByUser,
  selectedMonth,
  userId,
  isAdmin,
  onDeletePayment,
}: MobileUserSummaryListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {summaries.map((row) => {
        const userPayments = paymentsByUser.get(row.userId) ?? [];
        const totalPaid = userPayments.reduce((s, p) => s + p.amount, 0);
        const isPaid = totalPaid >= row.totalOwed - 0.01;
        const isOverdue =
          !isPaid && dayjs().isAfter(dayjs(selectedMonth).endOf("month"));
        return (
          <MobileCard key={row.userId}>
            <MobileRow>
              <Flex align="center" gap={6}>
                <Avatar
                  size={22}
                  style={{
                    background: "#909ffa",
                    color: "#fff",
                    fontSize: 10,
                  }}
                  icon={<UserOutlined />}
                />
                <Typography.Text
                  strong
                  style={{
                    color: "var(--text-strong)",
                    fontSize: 13,
                  }}
                >
                  {row.fullName}
                </Typography.Text>
                {row.userId === userId && (
                  <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>
                    You
                  </Tag>
                )}
              </Flex>
              <Typography.Text
                strong
                style={{ color: "#909ffa", fontSize: 14 }}
              >
                {formatCurrency(row.totalOwed)}
              </Typography.Text>
            </MobileRow>
            <MobileRow>
              <Typography.Text
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                Share: {formatCurrency(row.fixedShare)}
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                Weekend: {formatCurrency(row.weekendShare)}
              </Typography.Text>
            </MobileRow>
            <MobileRow>
              {userPayments.length === 0 ? (
                isOverdue ? (
                  <Tag
                    color="red"
                    icon={<ClockCircleOutlined />}
                    style={{ margin: 0 }}
                  >
                    Overdue
                  </Tag>
                ) : (
                  <Tag color="default" style={{ margin: 0 }}>
                    Pending
                  </Tag>
                )
              ) : isPaid ? (
                <Tag
                  color="green"
                  icon={<CheckCircleOutlined />}
                  style={{ margin: 0 }}
                >
                  Paid {formatCurrency(totalPaid)}
                </Tag>
              ) : (
                <Tag
                  color="orange"
                  icon={<ClockCircleOutlined />}
                  style={{ margin: 0 }}
                >
                  Partial {formatCurrency(totalPaid)}
                </Tag>
              )}
              <Flex gap={4}>
                {userPayments.map((p) =>
                  p.created_by === userId || isAdmin ? (
                    <Popconfirm
                      key={p.id}
                      title="Remove?"
                      onConfirm={() => onDeletePayment(p.id)}
                    >
                      <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                  ) : null,
                )}
              </Flex>
            </MobileRow>
            {userPayments.length > 0 && (
              <PaymentHistoryText>
                {userPayments
                  .map(
                    (p) =>
                      `${formatDate(p.paid_at)} — ${formatCurrency(p.amount)}`,
                  )
                  .join(" · ")}
              </PaymentHistoryText>
            )}
          </MobileCard>
        );
      })}
    </Space>
  );
}
