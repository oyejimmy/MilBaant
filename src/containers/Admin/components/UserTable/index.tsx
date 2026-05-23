import {
  Table,
  Flex,
  Avatar,
  Typography,
  Select,
  Switch,
  Tooltip,
  Button,
  Tag,
  Space,
} from "antd";
import {
  EditOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { ROLE_OPTIONS } from "@/lib/constants";
import type { Profile, Role } from "@/lib/types";
import { ROLE_META } from "../../constants";
import { avatarColor, initials } from "../../helpers";

interface UserTableProps {
  profiles: Profile[];
  userId?: string;
  isMobile?: boolean;
  onEdit: (profile: Profile) => void;
  onRoleChange: (profile: Profile, role: Role) => void;
  onPermissionChange: (profile: Profile, canAddExpenses: boolean) => void;
  onDeactivate: (profile: Profile) => void;
  onRestore: (profile: Profile) => void;
  onPermanentDelete: (profile: Profile) => void;
}

export function UserTable({
  profiles,
  userId,
  isMobile,
  onEdit,
  onRoleChange,
  onPermissionChange,
  onDeactivate,
  onRestore,
  onPermanentDelete,
}: UserTableProps) {
  const columns: ColumnsType<Profile> = [
    {
      title: "Member",
      key: "member",
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false;
        return (
          <Flex align="center" gap={10}>
            <Avatar
              size={34}
              style={{
                background: isRemoved ? "#bfbfbf" : avatarColor(p.full_name),
                color: "#fff",
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {initials(p.full_name)}
            </Avatar>
            <div>
              <Typography.Text
                strong
                style={{
                  color: isRemoved ? "var(--text-muted)" : "var(--text-strong)",
                  display: "block",
                  fontSize: "0.88rem",
                  textDecoration: isRemoved ? "line-through" : "none",
                }}
              >
                {p.full_name}
              </Typography.Text>
              <Flex align="center" gap={4}>
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
          </Flex>
        );
      },
    },
    {
      title: "Role",
      key: "role",
      width: 160,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false;
        return (
          <Select
            size="small"
            style={{ width: 140 }}
            value={p.role}
            disabled={isRemoved}
            onChange={(val) => onRoleChange(p, val)}
            options={ROLE_OPTIONS}
          />
        );
      },
    },
    {
      title: "Expenses",
      key: "can_add_expenses",
      width: 110,
      align: "center" as const,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false;
        return (
          <Tooltip
            title={p.can_add_expenses ? "Can add expenses" : "View only"}
          >
            <Switch
              size="small"
              checked={p.can_add_expenses}
              disabled={isRemoved}
              onChange={(checked) => onPermissionChange(p, checked)}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 120,
      align: "right" as const,
      render: (_: unknown, p: Profile) => {
        const isRemoved = p.is_active === false;
        const isSelf = p.id === userId;
        return (
          <Flex gap={4} justify="flex-end">
            <Tooltip title="Edit user">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => onEdit(p)}
                disabled={isRemoved}
              />
            </Tooltip>
            {isRemoved ? (
              <>
                <Tooltip title="Reactivate user">
                  <Button
                    size="small"
                    icon={<CheckCircleOutlined />}
                    onClick={() => onRestore(p)}
                    style={{ color: "var(--success)" }}
                  />
                </Tooltip>
                <Tooltip title="Remove permanently">
                  <Button
                    size="small"
                    danger
                    icon={<ExclamationCircleOutlined />}
                    onClick={() => onPermanentDelete(p)}
                  />
                </Tooltip>
              </>
            ) : (
              <Tooltip
                title={isSelf ? "Can't deactivate yourself" : "Deactivate user"}
              >
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={isSelf}
                  onClick={() => onDeactivate(p)}
                />
              </Tooltip>
            )}
          </Flex>
        );
      },
    },
  ];

  return (
    <Table<Profile>
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={profiles}
      pagination={{
        pageSize: 10,
        hideOnSinglePage: true,
        size: "small",
        showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
      }}
      scroll={{ x: 500 }}
    />
  );
}
