import { Card, Avatar, Flex, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { RiderSummary } from "../../types";

interface MobileRiderSummaryListProps {
  summaries: RiderSummary[];
}

export function MobileRiderSummaryList({
  summaries,
}: MobileRiderSummaryListProps) {
  return (
    <Flex vertical gap={8}>
      {summaries.length === 0 && (
        <Typography.Text type="secondary">No data yet.</Typography.Text>
      )}
      {summaries.map((row) => (
        <Card key={row.id}>
          <Flex justify="space-between" align="center">
            <Flex align="center" gap={8}>
              <Avatar
                size={22}
                style={{ background: "#909ffa" }}
                icon={<UserOutlined />}
              />
              <Typography.Text strong>{row.name}</Typography.Text>
            </Flex>
            <Typography.Text strong style={{ color: "#909ffa" }}>
              {formatCurrency(row.totalShare)}
            </Typography.Text>
          </Flex>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {row.rideCount} ride{row.rideCount !== 1 ? "s" : ""}
          </Typography.Text>
        </Card>
      ))}
    </Flex>
  );
}
