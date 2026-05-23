import { Card, Avatar, Flex, Tag, Typography } from "antd";
import { ArrowRightOutlined, UserOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { DebtEntry } from "../../types";

interface DebtsListProps {
  debts: DebtEntry[];
  userId?: string;
}

export function DebtsList({ debts, userId }: DebtsListProps) {
  return (
    <Flex vertical gap={8}>
      {debts.map((d) => {
        const isDebtor = d.fromId === userId;
        const isCreditor = d.toId === userId;
        const borderColor = isDebtor
          ? "#ff7875"
          : isCreditor
            ? "#52c41a"
            : "var(--card-border)";

        return (
          <Card
            key={`${d.fromId}-${d.toId}`}
            style={{ borderLeft: `3px solid ${borderColor}` }}
          >
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
              <Flex align="center" gap={8} wrap="wrap">
                <Avatar
                  size={22}
                  style={{ background: "#909ffa" }}
                  icon={<UserOutlined />}
                />
                <Typography.Text strong>{d.fromName}</Typography.Text>
                <ArrowRightOutlined
                  style={{ color: "var(--text-muted)", fontSize: 11 }}
                />
                <Avatar
                  size={22}
                  style={{ background: "#52c41a" }}
                  icon={<UserOutlined />}
                />
                <Typography.Text strong>{d.toName}</Typography.Text>
                {isDebtor && <Tag color="red">You owe</Tag>}
                {isCreditor && <Tag color="green">Owed to you</Tag>}
              </Flex>
              <Typography.Text strong>
                {formatCurrency(d.amount)}
              </Typography.Text>
            </Flex>
          </Card>
        );
      })}
    </Flex>
  );
}
