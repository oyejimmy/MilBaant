import { CrownOutlined, UserOutlined, CoffeeOutlined } from "@ant-design/icons";
import type { Role } from "@/lib/types";
import type { RoleMeta } from "../types";

export const ROLE_META: Record<Role, RoleMeta> = {
  admin: {
    color: "#cf1322",
    bg: "#fff1f0",
    icon: <CrownOutlined />,
    label: "Administrator",
  },
  user: {
    color: "#595959",
    bg: "#f5f5f5",
    icon: <UserOutlined />,
    label: "Member",
  },
  cook: {
    color: "#d46b08",
    bg: "#fff7e6",
    icon: <CoffeeOutlined />,
    label: "Cook",
  },
};
