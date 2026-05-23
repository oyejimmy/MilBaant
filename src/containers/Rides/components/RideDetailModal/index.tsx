import { Modal, Flex, Tag, Typography, Avatar, Button, Popconfirm } from "antd";
import { CarOutlined, DeleteOutlined, UserOutlined } from "@ant-design/icons";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import type { Ride } from "@/lib/types";

interface RideDetailModalProps {
  ride: Ride | null;
  open: boolean;
  userId?: string;
  deleting: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function RideDetailModal({
  ride,
  open,
  userId,
  deleting,
  onClose,
  onDelete,
}: RideDetailModalProps) {
  if (!ride) return null;

  const sharePerRider = ride.ride_riders.length > 0 ? ride.amount / ride.ride_riders.length : 0;

  return (
    <Modal
      centered
      open={open}
      onCancel={onClose}
      title={
        <Flex align="center" gap={8}>
          <CarOutlined style={{ color: "#909ffa" }} />
          <Typography.Text strong>Ride Details</Typography.Text>
          <Tag color="geekblue" style={{ margin: 0 }}>{ride.service}</Tag>
          {ride.payer && (
            <Tag color="purple" style={{ margin: 0 }}>{ride.payer.full_name} paid</Tag>
          )}
        </Flex>
      }
      footer={
        <Flex justify="space-between" align="center">
          {onDelete && (
            <Popconfirm title="Delete this ride?" onConfirm={() => onDelete(ride.id)}>
              <Button danger icon={<DeleteOutlined />} loading={deleting}>
                Delete
              </Button>
            </Popconfirm>
          )}
          <Button onClick={onClose}>Close</Button>
        </Flex>
      }
      width="min(460px, 95vw)"
    >
      <Flex gap={16} vertical={false} wrap="wrap">
        <Flex vertical gap={12} style={{ flex: 1 }}>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Date
            </Typography.Text>
            <Typography.Text strong style={{ display: "block" }}>{formatDate(ride.date)}</Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Total Fare
            </Typography.Text>
            <Typography.Text strong style={{ display: "block", color: "#909ffa", fontSize: 16 }}>
              {formatCurrency(ride.amount)}
            </Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Share / Rider
            </Typography.Text>
            <Typography.Text strong style={{ display: "block" }}>{formatCurrency(sharePerRider)}</Typography.Text>
          </div>
          {ride.route && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
                Route
              </Typography.Text>
              <Typography.Text style={{ display: "block" }}>{ride.route}</Typography.Text>
            </div>
          )}
          {ride.note && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
                Note
              </Typography.Text>
              <Typography.Text style={{ display: "block" }}>{ride.note}</Typography.Text>
            </div>
          )}
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
              Recorded
            </Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {formatDateTime(ride.created_at)}
            </Typography.Text>
          </div>
        </Flex>

        <Flex vertical gap={8} style={{ flex: 1 }}>
          <Typography.Text type="secondary" style={{ fontSize: 11, textTransform: "uppercase" }}>
            Riders ({ride.ride_riders.length})
          </Typography.Text>
          <Flex vertical gap={6} style={{ maxHeight: 200, overflowY: "auto" }}>
            {ride.ride_riders.map((rr) => (
              <Flex
                key={rr.user_id}
                justify="space-between"
                align="center"
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  background: "var(--content-bg)",
                  border: "1px solid var(--card-border)",
                }}
              >
                <Flex align="center" gap={6}>
                  <Avatar size={20} style={{ background: "#909ffa" }} icon={<UserOutlined />} />
                  <Typography.Text style={{ fontSize: 13 }}>
                    {rr.profile?.full_name ?? "?"}
                    {rr.user_id === ride.paid_by && (
                      <Tag color="purple" style={{ marginLeft: 6, fontSize: 10 }}>paid</Tag>
                    )}
                  </Typography.Text>
                </Flex>
                <Typography.Text style={{ color: "#909ffa", fontSize: 13 }}>
                  {formatCurrency(sharePerRider)}
                </Typography.Text>
              </Flex>
            ))}
          </Flex>
        </Flex>
      </Flex>
    </Modal>
  );
}