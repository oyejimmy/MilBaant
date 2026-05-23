import { CrownOutlined, UserOutlined, CoffeeOutlined } from "@ant-design/icons";
import type { Role } from "@/lib/types";

export const ROLE_META: Record<
  Role,
  { color: string; bg: string; icon: React.ReactNode; label: string }
> = {
  admin: {
    color: "#cf1322",
    bg: "#fff1f0",
    icon: <CrownOutlined />,
    label: "Admin",
  },
  user: {
    color: "#595959",
    bg: "#f5f5f5",
    icon: <UserOutlined />,
    label: "User",
  },
  cook: {
    color: "#d46b08",
    bg: "#fff7e6",
    icon: <CoffeeOutlined />,
    label: "Cook",
  },
};

export const AVATAR_COLORS = [
  "#1c8ee5",
  "#6a6a6a",
  "#52c41a",
  "#fa8c16",
  "#13c2c2",
  "#eb2f96",
  "#722ed1",
  "#cf1322",
];
