import {
  Card,
  Flex,
  Avatar,
  Typography,
  Select,
  Switch,
  Button,
  Space,
} from "antd";
import {
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";
import { ROLE_META } from "../../constants";
import { avatarColor, initials } from "../../helpers";

interface MobileUserCardProps {
  profile: Profile;
  userId?: string;
  onEdit: (profile: Profile) => void;
  onRoleChange: (profile: Profile, role: Role) => void;
  onPermissionChange: (profile: Profile, canAddExpenses: boolean) => void;
  onDeactivate: (profile: Profile) => void;
  onRestore: (profile: Profile) => void;
  onPermanentDelete: (profile: Profile) => void;
}

export function MobileUserCard({
  profile,
  userId,
  onEdit,
  onRoleChange,
  onPermissionChange,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}: MobileUserCardProps) {
  const isRemoved = profile.is_active === false;
  const isSelf = profile.id === userId;

  return (
    <Card style={{ opacity: isRemoved ? 0.55 : 1 }}>
      <Flex vertical gap={12}>
        <Flex align="center" gap={10}>
          <Avatar
            size={40}
            style={{
              background: isRemoved
                ? "#bfbfbf"
                : avatarColor(profile.full_name),
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            {initials(profile.full_name)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Typography.Text
              strong
              style={{
                color: isRemoved ? "var(--text-muted)" : "var(--text-strong)",
                display: "block",
                fontSize: 14,
                textDecoration: isRemoved ? "line-through" : "none",
              }}
            >
              {profile.full_name}
            </Typography.Text>
            <Flex gap={6} align="center" style={{ marginTop: 3 }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: ROLE_META[profile.role]?.bg ?? "#f5f5f5",
                  color: ROLE_META[profile.role]?.color ?? "#595959",
                }}
              >
                {ROLE_META[profile.role]?.icon} {ROLE_META[profile.role]?.label}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 600,
                  color: !isRemoved ? "#389e0d" : "#8c8c8c",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: !isRemoved ? "#52c41a" : "#bfbfbf",
                  }}
                />
                {isRemoved ? "Deactivated" : "Active"}
              </span>
            </Flex>
          </div>
          <Button
            size="small"
            icon={<EditOutlined />}
            disabled={isRemoved}
            onClick={() => onEdit(profile)}
          />
        </Flex>

        <Flex vertical gap={8}>
          <Flex align="center" gap={8}>
            <Typography.Text
              style={{ fontSize: 12, color: "var(--text-muted)", width: 100 }}
            >
              Role
            </Typography.Text>
            <Select
              size="small"
              style={{ flex: 1 }}
              value={profile.role}
              disabled={isRemoved}
              onChange={(val) => onRoleChange(profile, val)}
              options={ROLE_OPTIONS}
            />
          </Flex>
          <Flex align="center" gap={8}>
            <Typography.Text
              style={{ fontSize: 12, color: "var(--text-muted)", flex: 1 }}
            >
              Can Add Expenses
            </Typography.Text>
            <Switch
              size="small"
              checked={profile.can_add_expenses}
              disabled={isRemoved}
              onChange={(checked) => onPermissionChange(profile, checked)}
            />
          </Flex>
          {isRemoved ? (
            <Flex gap={8}>
              <Button
                style={{ flex: 1 }}
                icon={<CheckCircleOutlined />}
                onClick={() => onRestore(profile)}
              >
                Reactivate
              </Button>
              <Button
                danger
                style={{ flex: 1 }}
                icon={<ExclamationCircleOutlined />}
                onClick={() => onPermanentDelete(profile)}
              >
                Remove
              </Button>
            </Flex>
          ) : (
            <Button
              danger
              block
              icon={<DeleteOutlined />}
              disabled={isSelf}
              onClick={() => onDeactivate(profile)}
            >
              {isSelf ? "Can't deactivate yourself" : "Deactivate User"}
            </Button>
          )}
        </Flex>
      </Flex>
    </Card>
  );
}
