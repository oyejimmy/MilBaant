import { Card, Flex, Tag, Typography, Button, Popconfirm } from "antd";
import { CarOutlined, DeleteOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { Ride } from "@/lib/types";

interface MobileRidesListProps {
  rides: Ride[];
  userId?: string;
  onView: (ride: Ride) => void;
  onDelete: (id: string) => void;
}

export function MobileRidesList({
  rides,
  userId,
  onView,
  onDelete,
}: MobileRidesListProps) {
  return (
    <Flex vertical gap={8}>
      {rides.length === 0 && (
        <Typography.Text type="secondary">
          No rides recorded for this month.
        </Typography.Text>
      )}
      {rides.map((r) => (
        <Card
          key={r.id}
          hoverable
          style={{ cursor: "pointer" }}
          onClick={() => onView(r)}
        >
          <Flex vertical gap={8}>
            <Flex justify="space-between" align="center">
              <Flex gap={6} align="center">
                <Tag color="geekblue" style={{ margin: 0 }}>
                  {r.service}
                </Tag>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDate(r.date)}
                </Typography.Text>
              </Flex>
              <Typography.Text strong>
                {formatCurrency(r.amount)}
              </Typography.Text>
            </Flex>

            {r.route && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                <CarOutlined style={{ marginRight: 4 }} />
                {r.route}
              </Typography.Text>
            )}

            <Flex justify="space-between" align="center">
              <Flex gap={4} wrap>
                <Tag color="purple" style={{ margin: 0 }}>
                  {r.payer?.full_name ?? "—"} paid
                </Tag>
                {r.ride_riders.slice(0, 2).map((rr) => (
                  <Tag key={rr.user_id} style={{ margin: 0 }}>
                    {rr.profile?.full_name ?? "?"}
                  </Tag>
                ))}
                {r.ride_riders.length > 2 && (
                  <Tag>+{r.ride_riders.length - 2}</Tag>
                )}
              </Flex>
              <Popconfirm
                title="Delete this ride?"
                onConfirm={() => onDelete(r.id)}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Flex>

            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Share/rider:{" "}
              {r.ride_riders.length > 0
                ? formatCurrency(r.amount / r.ride_riders.length)
                : "—"}
            </Typography.Text>
          </Flex>
        </Card>
      ))}
    </Flex>
  );
}
