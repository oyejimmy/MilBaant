import { Card, Flex, Typography } from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { StatusIcon } from "../styles";
import type { RoleMeta } from "../../types";

interface AccountStatusProps {
  isActive: boolean;
  roleMeta: RoleMeta;
  canAddExpenses: boolean;
  roleIcon: React.ReactNode;
}

export function AccountStatus({
  isActive,
  roleMeta,
  canAddExpenses,
  roleIcon,
}: AccountStatusProps) {
  const statusItems: Array<{
    variant: "success" | "info" | "warning";
    icon: React.ReactNode;
    label: string;
    value: string;
  }> = [
    {
      variant: isActive ? "success" : "warning",
      icon: <CheckCircleOutlined />,
      label: "Account",
      value: isActive ? "Active" : "Deactivated",
    },
    {
      variant: "info",
      icon: roleIcon,
      label: "Role",
      value: roleMeta.label,
    },
    {
      variant: canAddExpenses ? "success" : "warning",
      icon: <UserOutlined />,
      label: "Expense Access",
      value: canAddExpenses ? "Can add expenses" : "View only",
    },
  ];

  return (
    <Card
      title={
        <Flex align="center" gap={8}>
          <SafetyOutlined />
          <span>Account Status</span>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        {statusItems.map((item, index) => (
          <Flex key={index} align="center" gap={12}>
            <StatusIcon $variant={item.variant}>{item.icon}</StatusIcon>
            <Flex vertical gap={2} flex={1}>
              <Typography.Text
                type="secondary"
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </Typography.Text>
              <Typography.Text strong style={{ fontSize: 14 }}>
                {item.value}
              </Typography.Text>
            </Flex>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
