import { Modal, Flex, Avatar, Typography, Alert } from "antd";
import { WarningOutlined } from "@ant-design/icons";
import type { Profile } from "@/lib/types";
import { ROLE_META } from "../constants";
import { avatarColor, initials } from "../helpers";

interface DeleteUserModalProps {
  profile: Profile | null;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({
  profile,
  open,
  submitting,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  if (!profile) return null;

  return (
    <Modal
      centered
      open={open}
      title={
        <Flex align="center" gap={8}>
          <WarningOutlined style={{ color: "#cf1322" }} />
          <span>Deactivate User</span>
        </Flex>
      }
      okText="Yes, Deactivate"
      okButtonProps={{ danger: true, loading: submitting }}
      cancelText="Cancel"
      onCancel={onClose}
      onOk={onConfirm}
      width="min(420px, 95vw)"
    >
      <Flex vertical gap={16} style={{ padding: "8px 0 4px" }}>
        <Flex align="center" gap={12}>
          <Avatar
            size={44}
            style={{
              background: avatarColor(profile.full_name),
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            {initials(profile.full_name)}
          </Avatar>
          <div>
            <Typography.Text strong style={{ display: "block", fontSize: 15 }}>
              {profile.full_name}
            </Typography.Text>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                background: ROLE_META[profile.role]?.bg,
                color: ROLE_META[profile.role]?.color,
              }}
            >
              {ROLE_META[profile.role]?.icon} {ROLE_META[profile.role]?.label}
            </span>
          </div>
        </Flex>
        <Alert
          type="warning"
          showIcon
          title="Are you sure you want to deactivate this user?"
          description="This user will no longer be able to log in. They will see: 'Your account has been deactivated. Please contact Admin.' You can reactivate them at any time."
        />
      </Flex>
    </Modal>
  );
}
