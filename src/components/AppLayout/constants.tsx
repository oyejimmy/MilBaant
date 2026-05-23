import {
  DashboardOutlined,
  WalletOutlined,
  FundOutlined,
  DollarCircleOutlined,
  CoffeeOutlined,
  ScheduleOutlined,
  InboxOutlined,
  CarOutlined,
  BellOutlined,
  AuditOutlined,
  SettingOutlined,
} from "@ant-design/icons";

export const SIDEBAR_WIDTH_EXPANDED = 220;
export const SIDEBAR_WIDTH_COLLAPSED = 60;

export interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  cookHidden?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ key: "/", label: "Dashboard", icon: <DashboardOutlined /> }],
  },
  {
    label: "Management",
    items: [
      { key: "/expenses", label: "Expenses", icon: <WalletOutlined /> },
      {
        key: "/flat-expenses",
        label: "Flat Fund",
        icon: <FundOutlined />,
        cookHidden: true,
      },
      {
        key: "/contributions",
        label: "Monthly Payments",
        icon: <DollarCircleOutlined />,
      },
      { key: "/cook", label: "Cook Accounts", icon: <CoffeeOutlined /> },
      { key: "/daily-menu", label: "Menu & Meals", icon: <ScheduleOutlined /> },
      {
        key: "/cook-requests",
        label: "Kitchen Requests",
        icon: <InboxOutlined />,
      },
    ],
  },
  {
    label: "",
    items: [
      {
        key: "/weekend-expenses",
        label: "Weekend Expenses",
        icon: <CarOutlined />,
      },
      { key: "/rides", label: "Rides", icon: <CarOutlined /> },
    ],
  },
  {
    label: "Community",
    items: [
      { key: "/announcements", label: "Announcements", icon: <BellOutlined /> },
      { key: "/logs", label: "Audit Log", icon: <AuditOutlined /> },
    ],
  },
  {
    label: "System",
    items: [
      {
        key: "/admin",
        label: "Admin",
        icon: <SettingOutlined />,
        adminOnly: true,
      },
    ],
  },
];

export const MOBILE_PRIORITY_KEYS = [
  "/",
  "/expenses",
  "/cook-requests",
  "/contributions",
  "/daily-menu",
];
