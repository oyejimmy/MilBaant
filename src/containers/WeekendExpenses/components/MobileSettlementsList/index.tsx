import { Card, Flex, Typography, Tag, Button, Popconfirm, Space } from "antd";
import { DeleteOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { DebtSettlement } from "@/lib/types";

interface MobileSettlementsListProps {
  settlements: DebtSettlement[];
  userId?: string;
  onDelete: (id: string) => void;
}

export function MobileSettlementsList({
  settlements,
  userId,
  onDelete,
}: MobileSettlementsListProps) {
  return (
    <Space direction="vertical" size={8} style={{ width: "100%" }}>
      {settlements.map((s) => (
        <Card key={s.id}>
          <Flex vertical gap={8}>
            <Flex justify="space-between" align="center">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {formatDate(s.settled_at)}
              </Typography.Text>
              <Typography.Text strong>
                {formatCurrency(s.amount)}
              </Typography.Text>
            </Flex>
            <Flex justify="space-between" align="center">
              <Flex gap={4} align="center">
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                  {s.payer?.full_name ?? s.payer_id}
                </Tag>
                <ArrowRightOutlined
                  style={{ fontSize: 10, color: "var(--text-muted)" }}
                />
                <Tag color="green" style={{ margin: 0, fontSize: 11 }}>
                  {s.payee?.full_name ?? s.payee_id}
                </Tag>
              </Flex>
              {userId && (
                <Popconfirm title="Remove?" onConfirm={() => onDelete(s.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              )}
            </Flex>
            {s.note && (
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {s.note}
              </Typography.Text>
            )}
          </Flex>
        </Card>
      ))}
    </Space>
  );
}
