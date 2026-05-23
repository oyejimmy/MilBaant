import { Card, Button, Tag, Flex, Typography } from "antd";
import { EyeOutlined, DeleteOutlined, DollarOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import dayjs from "dayjs";

interface MemberCardProps {
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

export function MemberCard({
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
}: MemberCardProps) {
  const canDelete =
    payment && (isAdmin || payment.created_by === currentUserId);
  const canPay = !payment && (userId === currentUserId || isAdmin);
  const showUnpaidTag = !payment && userId !== currentUserId && !isAdmin;

  return (
    <Card
      style={{
        border: `1.5px solid ${paid ? "rgba(82,196,26,0.35)" : "rgba(229,57,53,0.25)"}`,
      }}
      hoverable
    >
      <Flex vertical gap={10}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
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

        <Typography.Text strong style={{ fontSize: 14 }}>
          {fullName}
        </Typography.Text>

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
            style={{ fontSize: 11.5, color: "var(--text-muted)" }}
          >
            {dayjs(payment.paid_at).format("DD MMM YYYY")}
          </Typography.Text>
        )}

        <Flex gap={6} wrap="wrap">
          {payment?.screenshot_url && (
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewProof(payment.screenshot_url)}
            >
              Proof
            </Button>
          )}

          {canDelete && (
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              loading={isPending}
              onClick={() => onDelete(payment.id)}
            >
              Delete
            </Button>
          )}

          {canPay && (
            <Button
              size="small"
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => onPay(userId, fullName)}
              style={{ width: "100%" }}
            >
              Submit Payment
            </Button>
          )}

          {showUnpaidTag && <Tag color="error">Unpaid</Tag>}
        </Flex>
      </Flex>
    </Card>
  );
}
