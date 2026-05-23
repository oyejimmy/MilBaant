import {
  Modal,
  Descriptions,
  Typography,
  Divider,
  Flex,
  InputNumber,
  Button,
  Space,
  message,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { useState } from "react";
import { formatCurrency } from "@/lib/formatters";

interface DistributeModalProps {
  open: boolean;
  fixedTotal: number;
  perMemberShare: number;
  memberCount: number;
  isAdmin: boolean;
  onClose: () => void;
  onSaveMemberCount: (count: number) => Promise<void>;
}

export function DistributeModal({
  open,
  fixedTotal,
  perMemberShare,
  memberCount,
  isAdmin,
  onClose,
  onSaveMemberCount,
}: DistributeModalProps) {
  const [draftCount, setDraftCount] = useState<number | null>(null);

  const handleSave = async () => {
    if (!draftCount || draftCount < 1) {
      message.error("Please enter a valid member count");
      return;
    }
    await onSaveMemberCount(draftCount);
    setDraftCount(null);
    onClose();
  };

  return (
    <Modal
      centered
      open={open}
      title="Distribute Expenses"
      onCancel={onClose}
      footer={null}
      width="min(480px, 95vw)"
    >
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Total Expenses">
            <Typography.Text strong>
              {formatCurrency(fixedTotal)}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Per-person Share">
            <Typography.Text strong style={{ color: "var(--text-strong)" }}>
              {formatCurrency(perMemberShare)}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Member Count">
            <Typography.Text strong>{memberCount}</Typography.Text>
          </Descriptions.Item>
        </Descriptions>

        {isAdmin && (
          <>
            <Divider style={{ margin: "4px 0" }} />
            <Typography.Text style={{ color: "var(--text-muted)" }}>
              Update member count to recalculate the per-person share.
            </Typography.Text>
            <Flex align="center" gap={12}>
              <InputNumber
                min={1}
                value={draftCount ?? memberCount}
                onChange={(value) => setDraftCount(value)}
                style={{ width: 120 }}
              />
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
              >
                Save
              </Button>
            </Flex>
          </>
        )}
      </Space>
    </Modal>
  );
}
