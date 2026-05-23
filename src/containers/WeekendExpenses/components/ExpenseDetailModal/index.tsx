import {
  Modal,
  Flex,
  Typography,
  Tag,
  Button,
  Popconfirm,
  Image,
  Avatar,
  Card,
} from "antd";
import { DeleteOutlined, WalletOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { calculateWeekendExpenseShare } from "@/lib/expense-helpers";
import type { Expense } from "@/lib/types";

interface ExpenseDetailModalProps {
  expense: Expense | null;
  open: boolean;
  userId?: string;
  deleting: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function ExpenseDetailModal({
  expense,
  open,
  userId,
  deleting,
  onClose,
  onDelete,
}: ExpenseDetailModalProps) {
  if (!expense) return null;

  const sharePerPerson = calculateWeekendExpenseShare(expense);

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      title={null}
      footer={
        <Flex justify={onDelete ? "space-between" : "flex-end"} align="center">
          {onDelete && expense.created_by === userId && (
            <Popconfirm
              title="Delete this expense?"
              onConfirm={() => onDelete(expense.id)}
            >
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          )}
          <Button onClick={onClose}>Close</Button>
        </Flex>
      }
      width="min(500px, 96vw)"
    >
      <Flex vertical gap={16}>
        <Flex align="center" gap={14}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              background: "linear-gradient(135deg, #909ffa 0%, #4096ff 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <WalletOutlined style={{ color: "white", fontSize: 19 }} />
          </div>
          <div>
            <Typography.Title level={5} style={{ margin: 0 }}>
              Weekend Expense
            </Typography.Title>
            <Flex gap={6} wrap>
              <Tag color="blue">Read Only</Tag>
              {expense.creator && (
                <Tag color="purple">{expense.creator.full_name}</Tag>
              )}
            </Flex>
          </div>
        </Flex>

        <Flex gap={16} wrap="wrap">
          <Flex vertical gap={10} style={{ flex: 1 }}>
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, textTransform: "uppercase" }}
              >
                Date
              </Typography.Text>
              <div style={{ fontSize: "0.88rem" }}>
                {formatDate(expense.date)}
              </div>
            </div>
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, textTransform: "uppercase" }}
              >
                Amount
              </Typography.Text>
              <div
                style={{
                  color: "#909ffa",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                }}
              >
                {formatCurrency(expense.amount)}
              </div>
            </div>
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, textTransform: "uppercase" }}
              >
                Share / Person
              </Typography.Text>
              <div style={{ fontSize: "0.88rem" }}>
                {formatCurrency(sharePerPerson)}
              </div>
            </div>
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, textTransform: "uppercase" }}
              >
                Description
              </Typography.Text>
              <div style={{ fontSize: "0.88rem" }}>
                {expense.description || "No description"}
              </div>
            </div>
            <div>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, textTransform: "uppercase" }}
              >
                Recorded
              </Typography.Text>
              <div style={{ fontSize: "0.78rem" }}>
                {formatDateTime(expense.created_at)}
              </div>
            </div>
            {expense.bill_image_url && (
              <div>
                <Typography.Text
                  type="secondary"
                  style={{ fontSize: 11, textTransform: "uppercase" }}
                >
                  Bill
                </Typography.Text>
                <Image
                  src={expense.bill_image_url}
                  alt="Bill"
                  width={80}
                  height={60}
                  style={{ borderRadius: 7 }}
                />
              </div>
            )}
          </Flex>

          <Flex vertical gap={10} style={{ flex: 1 }}>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, textTransform: "uppercase" }}
            >
              Participants ({expense.expense_participants.length})
            </Typography.Text>
            <Flex
              vertical
              gap={5}
              style={{ maxHeight: 200, overflowY: "auto" }}
            >
              {expense.expense_participants.map((p) => (
                <Card key={p.user_id} size="small">
                  <Flex justify="space-between" align="center">
                    <Flex align="center" gap={8}>
                      <Avatar size={20} style={{ background: "#909ffa" }}>
                        {(p.profile?.full_name ?? "?").charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography.Text style={{ fontSize: "0.8rem" }}>
                        {p.profile?.full_name ?? "?"}
                      </Typography.Text>
                    </Flex>
                    <Typography.Text
                      style={{
                        fontSize: "0.8rem",
                        color: "#909ffa",
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(sharePerPerson)}
                    </Typography.Text>
                  </Flex>
                </Card>
              ))}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
}
