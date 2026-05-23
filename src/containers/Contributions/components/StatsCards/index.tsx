import { Card, Flex, Typography } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";

interface StatsCardsProps {
  paidCount: number;
  totalMembers: number;
  unpaidCount: number;
  totalCollected: number;
}

export function StatsCards({
  paidCount,
  totalMembers,
  unpaidCount,
  totalCollected,
}: StatsCardsProps) {
  const stats = [
    {
      title: "Paid",
      value: `${paidCount} / ${totalMembers}`,
      subtitle: "members",
      icon: <CheckCircleOutlined />,
      color: "var(--success)",
    },
    {
      title: "Unpaid",
      value: unpaidCount,
      subtitle: "still pending",
      icon: <CloseCircleOutlined />,
      color: "var(--error)",
    },
    {
      title: "Collected",
      value: formatCurrency(totalCollected),
      subtitle: "this month",
      icon: <WalletOutlined />,
      color: "var(--primary)",
    },
  ];

  return (
    <Flex gap={12} wrap="wrap">
      {stats.map((stat, index) => (
        <Card
          key={index}
          style={{
            flex: 1,
            minWidth: 120,
            borderLeft: `3px solid ${stat.color}`,
          }}
          styles={{ body: { padding: "14px 16px" } }}
        >
          <Flex align="center" gap={12}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                color: stat.color,
                background: `${stat.color}18`,
              }}
            >
              {stat.icon}
            </div>
            <div>
              <Typography.Text
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "var(--text-muted)",
                  display: "block",
                }}
              >
                {stat.title}
              </Typography.Text>
              <Typography.Text
                strong
                style={{
                  fontSize: "clamp(14px, 3vw, 18px)",
                  color: "var(--text-strong)",
                  display: "block",
                }}
              >
                {stat.value}
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 11, color: "var(--text-muted)" }}
              >
                {stat.subtitle}
              </Typography.Text>
            </div>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
