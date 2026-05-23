import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  App,
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Form,
  Grid,
  Input,
  Layout,
  Menu,
  Modal,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  AuditOutlined,
  BellOutlined,
  CarOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FundOutlined,
  HomeOutlined,
  InboxOutlined,
  KeyOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SunOutlined,
  SyncOutlined,
  UserOutlined,
  WalletOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { APP_NAME } from "@/lib/constants";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/useAuth";
import { useThemeMode } from "@/context/ThemeModeContext";
import { supabase } from "@/lib/supabase";
import { useCookRequests } from "@/hooks/useCookRequests";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useSyncQueue } from "@/hooks/useSyncQueue";

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

// ── Sidebar dimensions ─────────────────────────────────────────────────────
const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 60;

// ── Grouped menu definition ────────────────────────────────────────────────
interface NavGroup {
  label: string;
  items: Array<{
    key: string;
    label: string;
    icon: React.ReactNode;
    adminOnly?: boolean;
    cookHidden?: boolean;
  }>;
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Main",
    items: [{ key: "/", label: "Dashboard", icon: <DashboardOutlined /> }],
  },
  {
    label: "Management",
    items: [
      { key: "/expenses", label: "Expenses", icon: <WalletOutlined /> },
      { key: "/flat-expenses", label: "Flat Fund", icon: <FundOutlined />, cookHidden: true },
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

// ── Styled components ──────────────────────────────────────────────────────

const Shell = styled(Layout)`
  min-height: 100vh;
  background: var(--content-bg);
`;

const AppSider = styled(Sider)<{ $collapsed: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 200;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  overflow: hidden;
  transition: width 0.2s ease;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
`;

const SiderTop = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 56px;
  min-height: 56px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
`;

const LogoMark = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1465a3 0%, #1c8ee5 50%, #49a5ea 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(28, 142, 229, 0.35);
  flex-shrink: 0;
`;

// House SVG icon for the logo mark
function LogoHouseIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 12L12 3L21 12"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const BrandText = styled(Typography.Text)<{ $visible: boolean }>`
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? "160px" : "0")};
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
  overflow: hidden;
`;

const NavWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 3px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--sidebar-border);
    border-radius: 3px;
  }
`;

const StyledMenu = styled(Menu)`
  background: transparent;
  border-inline-end: none;
  padding: 0 6px;

  .ant-menu-item {
    border-radius: 7px;
    margin: 1px 0;
    height: 38px;
    line-height: 38px;
    width: 100%;
    font-size: 0.82rem;
  }

  .ant-menu-item-selected {
    background: var(--soft-accent);
    color: var(--primary);
    font-weight: 600;
    .anticon {
      color: var(--primary);
    }
  }

  .ant-menu-item:not(.ant-menu-item-selected):hover {
    background: var(--menu-hover-bg);
  }
`;

const SiderBottom = styled.div<{ $collapsed: boolean }>`
  border-top: 1px solid var(--sidebar-border);
  padding: ${({ $collapsed }) => ($collapsed ? "10px 6px" : "10px")};
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
`;

const ProfileRow = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ $collapsed }) => ($collapsed ? "6px 0" : "6px 8px")};
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s ease;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  &:hover {
    background: var(--menu-hover-bg);
  }
`;

const ProfileMeta = styled.div<{ $visible: boolean }>`
  overflow: hidden;
  white-space: nowrap;
  flex: 1;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? "160px" : "0")};
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
`;

const CollapseBtn = styled(Button)<{ $collapsed: boolean }>`
  width: 100%;
  border-radius: 7px;
  border-color: var(--sidebar-border);
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  gap: 6px;

  &:hover {
    background: var(--menu-hover-bg);
    color: var(--text-strong);
    border-color: var(--sidebar-border);
  }
`;

const MainLayout = styled(Layout)<{ $ml: number }>`
  background: transparent;
  margin-left: ${({ $ml }) => $ml}px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.2s ease;
`;

const TopHeader = styled(Header)<{ $scrolled: boolean }>`
  position: sticky;
  top: 0;
  z-index: 100;
  height: 52px;
  line-height: 52px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sidebar-border);
  transition:
    background 0.2s ease,
    backdrop-filter 0.2s ease,
    box-shadow 0.2s ease;

  background: ${({ $scrolled }) =>
    $scrolled ? "rgba(var(--navbar-bg-rgb), 0.80)" : "var(--navbar-bg)"};
  backdrop-filter: ${({ $scrolled }) =>
    $scrolled ? "blur(16px) saturate(160%)" : "blur(0px)"};
  -webkit-backdrop-filter: ${({ $scrolled }) =>
    $scrolled ? "blur(16px) saturate(160%)" : "blur(0px)"};
  box-shadow: ${({ $scrolled }) =>
    $scrolled
      ? "0 4px 20px rgba(0,0,0,0.10)"
      : "0 2px 8px rgba(0,0,0,0.05)"};

  @media (min-width: 768px) {
    height: 56px;
    line-height: 56px;
    padding: 0 24px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

const NavCenter = styled.div`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  white-space: nowrap;

  @media (max-width: 767px) {
    display: none;
  }
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    gap: 6px;
  }
`;

const NavBtn = styled(Button)`
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  width: 32px;
  height: 32px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  @media (min-width: 768px) {
    width: 34px;
    height: 34px;
  }

  &:hover {
    background: var(--menu-hover-bg);
    color: var(--text-strong);
    border: none;
  }
`;

const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 3px;
  border: none;
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease;
  flex-shrink: 0;

  @media (min-width: 768px) {
    gap: 6px;
    padding: 3px 8px 3px 3px;
  }

  &:hover {
    background: var(--menu-hover-bg);
  }
`;

const BreadcrumbWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

const MainContent = styled(Content)`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-bottom: 72px;
  background: transparent;

  @media (min-width: 768px) {
    padding: 24px;
    padding-bottom: 24px;
  }

  @media (min-width: 1024px) {
    padding: 28px 32px;
  }
`;

const ContentWrap = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

// ── Mobile drawer ──────────────────────────────────────────────────────────
const DrawerNav = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const DrawerBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 6px;
`;

// ── Mobile bottom nav ──────────────────────────────────────────────────────
const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 300;
  height: 56px;
  background: var(--navbar-bg);
  border-top: 1px solid var(--sidebar-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: stretch;
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
`;

const BottomNavItem = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 2px;
  border-radius: 6px;
  color: ${({ $active }) => ($active ? "var(--primary)" : "var(--text-muted)")};
  transition:
    color 0.15s ease,
    background 0.15s ease;
  min-width: 0;

  &:active {
    background: var(--menu-hover-bg);
  }
  .anticon {
    font-size: 17px;
  }
`;

const BottomNavLabel = styled.span`
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
`;

// ── Helpers ────────────────────────────────────────────────────────────────
function getActivePath(pathname: string) {
  return pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
}

function getBreadcrumbs(activePath: string, pathname: string) {
  const all = NAV_GROUPS.flatMap((g) => g.items);
  const item = all.find((i) => i.key === activePath);

  // Profile page — not in nav
  if (pathname.startsWith("/profile")) {
    return [
      { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
      { title: "My Profile", path: "/profile" },
    ];
  }

  if (!item || activePath === "/") {
    return [
      { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
      { title: "Dashboard", path: "/" },
    ];
  }

  // Find which group this item belongs to
  const group = NAV_GROUPS.find((g) =>
    g.items.some((i) => i.key === activePath),
  );
  const crumbs: { title: string; path?: string; icon?: React.ReactNode }[] = [
    { title: APP_NAME, path: "/", icon: <HomeOutlined /> },
  ];
  if (group?.label) crumbs.push({ title: group.label });
  crumbs.push({ title: item.label, path: activePath });
  return crumbs;
}

// ── Reset Password Modal ───────────────────────────────────────────────────
function ResetPasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { email } = useAuth();

  async function handleSubmit(values: { newPassword: string }) {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword,
      });
      if (error) throw new Error(error.message);
      message.success("Password updated successfully!");
      form.resetFields();
      onClose();
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Failed to update password.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <KeyOutlined style={{ color: "var(--primary)" }} />
          <span>Reset Password</span>
        </div>
      }
      onCancel={onClose}
      footer={null}
      width="min(420px, 95vw)"
      destroyOnClose
    >
      {email && (
        <Typography.Text
          type="secondary"
          style={{ display: "block", marginBottom: 16, fontSize: 13 }}
        >
          Updating password for: <strong>{email}</strong>
        </Typography.Text>
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={(v) => void handleSubmit(v)}
      >
        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: "Please enter a new password" },
            { min: 6, message: "Password must be at least 6 characters" },
          ]}
        >
          <Input.Password placeholder="Enter new password" size="large" />
        </Form.Item>
        <Form.Item
          label="Confirm Password"
          name="confirmPassword"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "Please confirm your password" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value)
                  return Promise.resolve();
                return Promise.reject(new Error("Passwords do not match"));
              },
            }),
          ]}
        >
          <Input.Password placeholder="Confirm new password" size="large" />
        </Form.Item>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 8,
          }}
        >
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<KeyOutlined />}
          >
            Update Password
          </Button>
        </div>
      </Form>
    </Modal>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export function AppLayout() {
  const screens = useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const { isAdmin, isCook, profile, signOut } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { message } = App.useApp();

  // Live badge counts
  const cookRequestsQuery = useCookRequests();
  const announcementsQuery = useAnnouncements();
  const pendingRequestCount = (cookRequestsQuery.data ?? []).filter(
    (r) => r.status === "pending",
  ).length;
  const announcementCount = (announcementsQuery.data ?? []).length;

  // Offline sync queue
  const { isOnline, pendingCount, status: syncStatus, sync } = useSyncQueue();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const siderWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;
  const activePath = getActivePath(location.pathname);
  const breadcrumbs = getBreadcrumbs(activePath, location.pathname);

  // Build Ant Design menu items with labels for desktop sidebar
  const menuItems = useMemo<MenuProps["items"]>(() => {
    const items: MenuProps["items"] = [];
    NAV_GROUPS.forEach((group) => {
      const visibleItems = group.items.filter(
        (i) => (!i.adminOnly || isAdmin) && (!i.cookHidden || !isCook),
      );
      if (visibleItems.length === 0) return;

      // Add nav items with labels (hidden when collapsed)
      visibleItems.forEach((item) => {
        const badge =
          item.key === "/cook-requests" && pendingRequestCount > 0
            ? pendingRequestCount
            : item.key === "/announcements" && announcementCount > 0
              ? announcementCount
              : 0;

        items.push({
          key: item.key,
          icon: item.icon,
          label: collapsed ? null : badge > 0 ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {item.label}
              <span
                style={{
                  background:
                    item.key === "/cook-requests"
                      ? "#ff4d4f"
                      : "var(--primary)",
                  color: "#fff",
                  borderRadius: 10,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  lineHeight: "16px",
                  minWidth: 18,
                  textAlign: "center",
                }}
              >
                {badge}
              </span>
            </span>
          ) : (
            item.label
          ),
          title: item.label,
        });
      });
    });
    return items;
  }, [isAdmin, collapsed, pendingRequestCount, announcementCount]);

  // Flat list for mobile bottom nav — most-used pages for a 6-person flat
  const mobileItems = useMemo(() => {
    const priority = [
      "/",
      "/expenses",
      "/cook-requests",
      "/contributions",
      "/daily-menu",
    ];
    return NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => (!i.adminOnly || isAdmin) && (!i.cookHidden || !isCook) && priority.includes(i.key))
      .sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key));
  }, [isAdmin]);

  const profileMenuItems: MenuProps["items"] = [
    {
      key: "name",
      label: (
        <div style={{ padding: "4px 0" }}>
          <div
            style={{
              fontWeight: 600,
              color: "var(--text-strong)",
              fontSize: 14,
            }}
          >
            {profile?.full_name ?? "Flatmate"}
          </div>
        </div>
      ),
      icon: <UserOutlined />,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
      onClick: () => navigate("/profile"),
    },
    {
      key: "reset-password",
      label: "Reset Password",
      icon: <KeyOutlined />,
      onClick: () => setResetPwOpen(true),
    },
    { type: "divider" },
    {
      key: "logout",
      label: "Sign Out",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () =>
        void (async () => {
          try {
            await signOut();
            void message.success("Signed out.");
            navigate("/login", { replace: true });
          } catch (e) {
            void message.error(
              e instanceof Error ? e.message : "Unable to sign out.",
            );
          }
        })(),
    },
  ];

  // Desktop menu with tooltips for icon-only items
  const desktopMenu = (
    <StyledMenu
      mode="inline"
      selectedKeys={[activePath]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
    />
  );

  // Mobile drawer menu with labels
  const mobileMenuItems = useMemo<MenuProps["items"]>(() => {
    const items: MenuProps["items"] = [];
    NAV_GROUPS.forEach((group, gi) => {
      const visibleItems = group.items.filter(
        (i) => (!i.adminOnly || isAdmin) && (!i.cookHidden || !isCook),
      );
      if (visibleItems.length === 0) return;

      if (gi > 0) {
        items.push({
          type: "divider",
          key: `div-${gi}`,
          style: { margin: "4px 10px", opacity: 0.5 },
        });
      }

      // Show labels in mobile drawer
      visibleItems.forEach((item) => {
        items.push({
          key: item.key,
          icon: item.icon,
          label: item.label,
        });
      });
    });
    return items;
  }, [isAdmin]);

  const mobileDrawerMenu = (
    <StyledMenu
      mode="inline"
      selectedKeys={[activePath]}
      items={mobileMenuItems}
      onClick={({ key }) => {
        navigate(key);
        setMobileOpen(false);
      }}
    />
  );

  return (
    <>
    <Shell>
      {/* ── Desktop sidebar ── */}
      {isDesktop && (
        <AppSider
          $collapsed={collapsed}
          width={SIDEBAR_WIDTH_EXPANDED}
          collapsedWidth={SIDEBAR_WIDTH_COLLAPSED}
          collapsed={collapsed}
          trigger={null}
        >
          <SiderTop $collapsed={collapsed}>
            <LogoMark>
              <LogoHouseIcon />
            </LogoMark>
            <BrandText $visible={!collapsed}>{APP_NAME}</BrandText>
          </SiderTop>

          <NavWrap>{desktopMenu}</NavWrap>

          <SiderBottom $collapsed={collapsed}>
            <Dropdown
              menu={{ items: profileMenuItems }}
              trigger={["click"]}
              placement="topRight"
            >
              <ProfileRow $collapsed={collapsed}>
                <Avatar
                  size={28}
                  src={profile?.avatar_url}
                  style={{
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                    flexShrink: 0,
                  }}
                  icon={<UserOutlined />}
                />
                <ProfileMeta $visible={!collapsed}>
                  <Typography.Text
                    strong
                    style={{
                      color: "var(--text-strong)",
                      fontSize: "0.8rem",
                      display: "block",
                    }}
                  >
                    {profile?.full_name ?? "Flatmate"}
                  </Typography.Text>
                </ProfileMeta>
              </ProfileRow>
            </Dropdown>

            <CollapseBtn
              $collapsed={collapsed}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            >
              {!collapsed && (
                <span style={{ fontSize: "0.78rem" }}>Collapse</span>
              )}
            </CollapseBtn>
          </SiderBottom>
        </AppSider>
      )}

      {/* ── Mobile drawer ── */}
      {!isDesktop && (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          placement="left"
          styles={{
            body: {
              padding: "16px",
              background: "var(--sidebar-bg)",
              display: "flex",
              flexDirection: "column",
              width: 240,
            },
            header: { display: "none" },
            wrapper: { width: 240 },
          }}
        >
          <DrawerNav>
            <DrawerBrand>
              <LogoMark>
                <LogoHouseIcon />
              </LogoMark>
              <Typography.Text
                strong
                style={{ color: "var(--text-strong)", fontSize: "0.95rem" }}
              >
                {APP_NAME}
              </Typography.Text>
            </DrawerBrand>

            <div style={{ flex: 1 }}>{mobileDrawerMenu}</div>

            <div
              style={{
                borderTop: "1px solid var(--sidebar-border)",
                paddingTop: 12,
                marginTop: 8,
              }}
            >
              <Dropdown
                menu={{ items: profileMenuItems }}
                trigger={["click"]}
                placement="topRight"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    borderRadius: "7px",
                    cursor: "pointer",
                  }}
                >
                  <Avatar
                    size={28}
                    src={profile?.avatar_url}
                    style={{
                      background: "var(--primary)",
                      color: "var(--text-inverse)",
                    }}
                    icon={<UserOutlined />}
                  />
                  <div>
                    <Typography.Text
                      strong
                      style={{
                        color: "var(--text-strong)",
                        fontSize: "0.8rem",
                        display: "block",
                      }}
                    >
                      {profile?.full_name ?? "Flatmate"}
                    </Typography.Text>
                  </div>
                </div>
              </Dropdown>
            </div>
          </DrawerNav>
        </Drawer>
      )}

      {/* ── Main area ── */}
      <MainLayout $ml={isDesktop ? siderWidth : 0}>
        <TopHeader $scrolled={scrolled}>
          <NavLeft>
            {!isDesktop && (
              <NavBtn
                icon={<MenuOutlined />}
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              />
            )}
            <BreadcrumbWrap>
              <Typography.Text
                strong
                style={{
                  color: "var(--text-strong)",
                  fontSize: isDesktop ? "1rem" : "0.95rem",
                }}
              >
                {breadcrumbs[breadcrumbs.length - 1]?.title}
              </Typography.Text>
            </BreadcrumbWrap>
          </NavLeft>

          {/* ── Centered welcome text (desktop only) ── */}
          <NavCenter>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.7px",
                lineHeight: 1,
                background: isCook
                  ? "linear-gradient(90deg, #f97316, #fb923c)"
                  : isAdmin
                    ? "linear-gradient(90deg, #7c3aed, #a855f7)"
                    : "linear-gradient(90deg, #1677ff, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {isCook ? "Cook Portal" : isAdmin ? "Admin" : "Resident"}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                lineHeight: 1.3,
                marginTop: 2,
                background:
                  "linear-gradient(90deg, #1677ff 0%, #7c3aed 50%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Welcome, {profile?.full_name?.split(" ")[0] ?? "Flatmate"} ·{" "}
              {dayjs().format("dddd, DD MMMM YYYY")}
            </span>
          </NavCenter>

          <NavRight>
            {/* ── Offline / sync indicator ── */}
            {(!isOnline || pendingCount > 0) && (
              <Tooltip
                title={
                  !isOnline
                    ? `Offline${pendingCount > 0 ? ` · ${pendingCount} change${pendingCount > 1 ? "s" : ""} queued` : ""}`
                    : syncStatus === "syncing"
                      ? "Syncing changes…"
                      : `${pendingCount} change${pendingCount > 1 ? "s" : ""} pending sync`
                }
              >
                <NavBtn
                  onClick={() => void sync()}
                  aria-label="Sync status"
                  style={{ position: "relative" }}
                >
                  {!isOnline ? (
                    <WifiOutlined style={{ color: "#ff4d4f" }} />
                  ) : (
                    <SyncOutlined
                      spin={syncStatus === "syncing"}
                      style={{ color: "#f59e0b" }}
                    />
                  )}
                  {pendingCount > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: !isOnline ? "#ff4d4f" : "#f59e0b",
                        border: "1.5px solid var(--navbar-bg)",
                      }}
                    />
                  )}
                </NavBtn>
              </Tooltip>
            )}

            <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
              <NavBtn
                icon={mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleMode}
                aria-label="Toggle theme"
              />
            </Tooltip>

            <Dropdown
              menu={{ items: profileMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <ProfileBtn type="button" aria-label="Profile menu">
                <Avatar
                  size={26}
                  src={profile?.avatar_url}
                  style={{
                    background: "var(--primary)",
                    color: "var(--text-inverse)",
                  }}
                  icon={<UserOutlined />}
                />
                {isDesktop && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      lineHeight: 1.2,
                    }}
                  >
                    <Typography.Text
                      strong
                      style={{
                        color: "var(--text-strong)",
                        fontSize: "0.78rem",
                      }}
                    >
                      {profile?.full_name ?? "Flatmate"}
                    </Typography.Text>
                  </div>
                )}
              </ProfileBtn>
            </Dropdown>
          </NavRight>
        </TopHeader>

        <MainContent>
          <ContentWrap>
            <Outlet />
          </ContentWrap>
        </MainContent>
        <AppFooter />
      </MainLayout>
    </Shell>

    {/* ── Mobile bottom nav — rendered outside Shell so position:fixed is viewport-relative ── */}
    {!isDesktop && (
      <BottomNav role="navigation" aria-label="Main navigation">
        {mobileItems.map((item) => (
          <BottomNavItem
            key={item.key}
            $active={activePath === item.key}
            onClick={() => navigate(item.key)}
            aria-label={item.label}
            aria-current={activePath === item.key ? "page" : undefined}
          >
            <span style={{ position: "relative", display: "inline-flex" }}>
              {item.icon}
              {item.key === "/cook-requests" && pendingRequestCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "#ff4d4f",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "0 4px",
                    lineHeight: "14px",
                    minWidth: 14,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  {pendingRequestCount}
                </span>
              )}
              {item.key === "/announcements" && announcementCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "var(--primary)",
                    color: "#fff",
                    borderRadius: 8,
                    fontSize: 9,
                    fontWeight: 700,
                    padding: "0 4px",
                    lineHeight: "14px",
                    minWidth: 14,
                    textAlign: "center",
                    pointerEvents: "none",
                  }}
                >
                  {announcementCount}
                </span>
              )}
            </span>
            <BottomNavLabel>{item.label}</BottomNavLabel>
          </BottomNavItem>
        ))}
        <BottomNavItem
          $active={false}
          onClick={() => setMobileOpen(true)}
          aria-label="More navigation"
        >
          <MenuOutlined />
          <BottomNavLabel>More</BottomNavLabel>
        </BottomNavItem>
      </BottomNav>
    )}

    {/* ── Reset Password Modal ── */}
    <ResetPasswordModal
      open={resetPwOpen}
      onClose={() => setResetPwOpen(false)}
    />
    </>
  );
}
