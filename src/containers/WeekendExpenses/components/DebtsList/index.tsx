import { Card, Avatar, Flex, Tag, Typography, Button } from "antd";
import {
  ArrowRightOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { DebtRow } from "@/lib/types";

interface DebtsListProps {
  debts: DebtRow[];
  userId?: string;
  onSettle: (debt: DebtRow) => void;
}

export function DebtsList({ debts, userId, onSettle }: DebtsListProps) {
  if (debts.length === 0) return null;

  return (
    <Flex vertical gap={8}>
      {debts.map((debt) => {
        const isCurrentUserDebtor = debt.fromId === userId;
        const isCurrentUserCreditor = debt.toId === userId;
        const borderColor = isCurrentUserDebtor
          ? "#ff7875"
          : isCurrentUserCreditor
            ? "#52c41a"
            : "var(--card-border)";

        return (
          <Card
            key={`${debt.fromId}-${debt.toId}`}
            style={{ borderLeft: `3px solid ${borderColor}` }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Flex align="center" gap={6} wrap style={{ flex: 1 }}>
                <Avatar
                  size={22}
                  style={{ background: "#909ffa" }}
                  icon={<UserOutlined />}
                />
                <Typography.Text strong style={{ fontSize: "0.82rem" }}>
                  {debt.fromName}
                </Typography.Text>
                <ArrowRightOutlined
                  style={{ color: "var(--text-muted)", fontSize: 10 }}
                />
                <Avatar
                  size={22}
                  style={{ background: "#52c41a" }}
                  icon={<UserOutlined />}
                />
                <Typography.Text strong style={{ fontSize: "0.82rem" }}>
                  {debt.toName}
                </Typography.Text>
                {isCurrentUserDebtor && <Tag color="red">You owe</Tag>}
                {isCurrentUserCreditor && <Tag color="green">Owed to you</Tag>}
              </Flex>
              <Flex align="center" gap={8}>
                <Typography.Text strong style={{ fontSize: "0.9rem" }}>
                  {formatCurrency(debt.netAmount)}
                </Typography.Text>
                {userId && (
                  <Button
                    size="small"
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onSettle(debt)}
                  >
                    Settle
                  </Button>
                )}
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}
