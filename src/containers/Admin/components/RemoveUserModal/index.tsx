import { useState } from "react";
import { Modal, Flex, Avatar, Typography, Alert, Input, Space } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import type { Profile } from "@/lib/types";
import { ROLE_META } from "../constants";
import { initials } from "../helpers";

interface RemoveUserModalProps {
  profile: Profile;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveUserModal({
  profile,
  open,
  submitting,
  onClose,
  onConfirm,
}: RemoveUserModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const nameMatches =
    confirmName.trim().toLowerCase() === profile.full_name.trim().toLowerCase();

  return (
    <Modal
      open={open}
      title={
        <Flex align="center" gap={8}>
          <ExclamationCircleOutlined style={{ color: "#cf1322" }} />
          <span>Remove User Permanently</span>
        </Flex>
      }
      okText="Yes, Remove Permanently"
      okButtonProps={{
        danger: true,
        loading: submitting,
        disabled: !nameMatches,
      }}
      cancelText="Cancel"
      onCancel={onClose}
      onOk={onConfirm}
      width="min(460px, 95vw)"
    >
      <Space
        direction="vertical"
        size={16}
        style={{ width: "100%", paddingTop: 8 }}
      >
        <Flex align="center" gap={12}>
          <Avatar
            size={44}
            style={{
              background: "#bfbfbf",
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
          type="error"
          showIcon
          message="This action cannot be undone"
          description={
            <Space direction="vertical" size={4}>
              <Typography.Text style={{ fontSize: 13 }}>
                Permanently removing this user will delete:
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                • Their profile and login credentials
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                • All expenses, rides, and settlements they created
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                • Their bed assignment, contributions, and activity logs
              </Typography.Text>
              <Typography.Text
                style={{ fontSize: 12, color: "var(--text-muted)" }}
              >
                • All other data associated with this account
              </Typography.Text>
            </Space>
          }
        />

        <div>
          <Typography.Text
            style={{ fontSize: 13, display: "block", marginBottom: 6 }}
          >
            Type{" "}
            <Typography.Text strong style={{ color: "#cf1322" }}>
              {profile.full_name}
            </Typography.Text>{" "}
            to confirm:
          </Typography.Text>
          <Input
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={profile.full_name}
            status={
              confirmName.length > 0 && !nameMatches ? "error" : undefined
            }
            autoComplete="off"
          />
        </div>
      </Space>
    </Modal>
  );
}
