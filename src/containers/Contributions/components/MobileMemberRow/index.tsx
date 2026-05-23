import { Card, Button, Tag, Flex, Typography } from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  DollarOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import dayjs from "dayjs";

interface MobileMemberRowProps {
  userId: string;
  fullName: string;
  initials: string;
  paid: boolean;
  payment: any;
  isAdmin: boolean;
  currentUserId?: string;
  isPending: boolean;
  onViewProof: (url: string) => void;
  onDelete: (id: string) => void;
  onPay: (userId: string, name: string) => void;
}

export function MobileMemberRow({
  userId,
  fullName,
  initials,
  paid,
  payment,
  isAdmin,
  currentUserId,
  isPending,
  onViewProof,
  onDelete,
  onPay,
}: MobileMemberRowProps) {
  const canDelete =
    payment && (isAdmin || payment.created_by === currentUserId);
  const canPay = !payment && (userId === currentUserId || isAdmin);

  return (
    <Card
      style={{
        border: `1.5px solid ${paid ? "rgba(82,196,26,0.3)" : "rgba(229,57,53,0.2)"}`,
      }}
    >
      <Flex align="center" gap={13}>
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            fontWeight: 700,
            color: "#fff",
            background: paid
              ? "linear-gradient(135deg, #52c41a, #389e0d)"
              : "linear-gradient(135deg, #ff7875, #e53935)",
          }}
        >
          {initials}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <Typography.Text strong style={{ fontSize: 14 }}>
            {fullName}
          </Typography.Text>
          <Flex align="center" gap={8} style={{ marginTop: 3 }}>
            <Typography.Text
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: paid ? "#52c41a" : "var(--text-muted)",
              }}
            >
              {payment ? formatCurrency(payment.amount) : "Not paid"}
            </Typography.Text>
            {payment && (
              <Typography.Text
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                · {dayjs(payment.paid_at).format("DD MMM")}
              </Typography.Text>
            )}
          </Flex>
        </div>

        <Flex vertical align="flex-end" gap={6} flexShrink={0}>
          {paid ? (
            <Tag color="success">Paid</Tag>
          ) : (
            <Tag color="error">Unpaid</Tag>
          )}

          {payment?.screenshot_url && (
            <Button
              size="small"
              icon={<PictureOutlined />}
              onClick={() => onViewProof(payment.screenshot_url)}
            />
          )}

          {canDelete && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isPending}
              onClick={() => onDelete(payment.id)}
            />
          )}

          {canPay && (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => onPay(userId, fullName)}
            >
              Pay
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
