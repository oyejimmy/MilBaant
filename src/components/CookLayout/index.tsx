import { useEffect, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Badge,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Skeleton,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { MenuProps } from "antd";
import {
  AuditOutlined,
  BellOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  InboxOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  ScheduleOutlined,
  ShoppingCartOutlined,
  SunOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { APP_NAME } from "@/lib/constants";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/useAuth";
import { useThemeMode } from "@/context/ThemeModeContext";

const { Header, Content, Sider } = Layout;
const { useBreakpoint } = Grid;

// ── Sidebar dimensions ─────────────────────────────────────────────────────
const SIDEBAR_WIDTH_EXPANDED = 220;
const SIDEBAR_WIDTH_COLLAPSED = 64;

// ── Cook-specific nav items ────────────────────────────────────────────────
interface CookNavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const COOK_NAV_ITEMS: CookNavItem[] = [
  {
    key: "/cook-portal/dashboard",
    label: "Dashboard",
    icon: <DashboardOutlined />,
  },
  {
    key: "/cook-portal/cook",
    label: "Flat Ka Khata",
    icon: <CoffeeOutlined />,
  },
  {
    key: "/cook-portal/cook-requests",
    label: "Requests",
    icon: <InboxOutlined />,
  },
  {
    key: "/cook-portal/daily-menu",
    label: "Daily Menu",
    icon: <ScheduleOutlined />,
  },
  {
    key: "/cook-portal/weekend-expenses",
    label: "Weekend Meals",
    icon: <ShoppingCartOutlined />,
  },
  { key: "/cook-portal/logs", label: "Activity Logs", icon: <AuditOutlined /> },
];

// ── Page title map ─────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/cook-portal/dashboard": "Dashboard",
  "/cook-portal/cook": "Flat Ka Khata",
  "/cook-portal/cook-requests": "Item Requests",
  "/cook-portal/daily-menu": "Daily Menu",
  "/cook-portal/weekend-expenses": "Weekend Meals",
  "/cook-portal/logs": "Activity Logs",
  "/cook-portal/profile": "My Profile",
};

// ── Animations ─────────────────────────────────────────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const slideIn = keyframes`
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
`;

// ── Styled components ──────────────────────────────────────────────────────

const Shell = styled(Layout)`
  min-height: 100vh;
  background: var(--content-bg);
`;

const CookSider = styled(Sider)<{ $collapsed: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 200;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  overflow: hidden;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

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
  padding: 0 ${({ $collapsed }) => ($collapsed ? "14px" : "16px")};
  height: 56px;
  min-height: 56px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  justify-content: ${({ $collapsed }) =>
    $collapsed ? "center" : "flex-start"};
  transition: padding 0.25s ease;
`;

const LogoMark = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 16px;
  color: #fff;
  box-shadow: 0 2px 10px rgba(249, 115, 22, 0.35);
  flex-shrink: 0;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const BrandWrap = styled.div<{ $visible: boolean }>`
  overflow: hidden;
  white-space: nowrap;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? "160px" : "0")};
  transition:
    opacity 0.2s ease,
    max-width 0.25s ease;
`;

const BrandName = styled(Typography.Text)`
  font-family: "Plus Jakarta Sans", sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-strong);
  display: block;
  line-height: 1.2;
`;

const BrandRole = styled(Typography.Text)`
  font-size: 0.65rem;
  font-weight: 600;
  color: #f97316;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  display: block;
`;

const NavWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 0;

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
  padding: 0 8px;

  .ant-menu-item {
    border-radius: 8px;
    margin: 2px 0;
    height: 40px;
    line-height: 40px;
    width: 100%;
    font-size: 0.83rem;
    transition: all 0.15s ease;
  }

  .ant-menu-item-selected {
    background: rgba(249, 115, 22, 0.1);
    color: #f97316;
    font-weight: 600;
    .anticon {
      color: #f97316;
    }
  }

  .ant-menu-item:not(.ant-menu-item-selected):hover {
    background: var(--menu-hover-bg);
    transform: translateX(2px);
  }
`;

const SiderBottom = styled.div<{ $collapsed: boolean }>`
  border-top: 1px solid var(--sidebar-border);
  padding: ${({ $collapsed }) => ($collapsed ? "10px 8px" : "10px 12px")};
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
  border-radius: 8px;
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
    max-width 0.25s ease;
`;

const CollapseBtn = styled(Button)<{ $collapsed: boolean }>`
  width: 100%;
  border-radius: 8px;
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
  transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
`;

const TopHeader = styled(Header)<{ $scrolled: boolean }>`
  position: sticky;
  top: 0;
  z-index: 100;
  height: 52px;
  line-height: 52px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--sidebar-border);
  transition:
    background 0.3s ease,
    backdrop-filter 0.3s ease,
    box-shadow 0.3s ease;

  background: ${({ $scrolled }) =>
    $scrolled ? "rgba(var(--navbar-bg-rgb), 0.72)" : "var(--navbar-bg)"};
  backdrop-filter: ${({ $scrolled }) =>
    $scrolled ? "blur(20px) saturate(180%)" : "blur(0px)"};
  -webkit-backdrop-filter: ${({ $scrolled }) =>
    $scrolled ? "blur(20px) saturate(180%)" : "blur(0px)"};
  box-shadow: ${({ $scrolled }) =>
    $scrolled
      ? "0 4px 24px rgba(0,0,0,0.10), 0 1px 0 var(--sidebar-border)"
      : "0 2px 8px rgba(0,0,0,0.05)"};

  @media (min-width: 768px) {
    height: 56px;
    line-height: 56px;
    padding: 0 20px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
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
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  width: 34px;
  height: 34px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &:hover {
    background: var(--menu-hover-bg);
    color: var(--text-strong);
    border: none;
  }
`;

const PageTitleWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  animation: ${slideIn} 0.2s ease;
`;

const CookBadge = styled(Tag)`
  background: rgba(249, 115, 22, 0.1);
  border: 1px solid rgba(249, 115, 22, 0.2);
  color: #f97316;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  @media (max-width: 480px) {
    display: none;
  }
`;

const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 3px;
  border: none;
  border-radius: 8px;
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

const MainContent = styled(Content)`
  padding: 8px;
  background: transparent;
  padding-bottom: 72px;
  animation: ${fadeIn} 0.2s ease;

  @media (min-width: 768px) {
    padding: 20px;
    padding-bottom: 20px;
  }

  @media (min-width: 1024px) {
    padding: 24px;
  }
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

// ── Mobile drawer ──────────────────────────────────────────────────────────

const DrawerBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 8px;
`;

// ── Mobile bottom nav ──────────────────────────────────────────────────────

const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 2000;
  height: 58px;
  background: var(--navbar-bg);
  border-top: 1px solid var(--sidebar-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: stretch;
  padding: 0 2px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
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
  color: ${({ $active }) => ($active ? "#f97316" : "var(--text-muted)")};
  transition:
    color 0.15s ease,
    background 0.15s ease,
    transform 0.1s ease;
  min-width: 0;
  position: relative;

  &:active {
    background: var(--menu-hover-bg);
    transform: scale(0.92);
  }

  .anticon {
    font-size: 18px;
  }
`;

const ActiveDot = styled.div`
  position: absolute;
  top: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #f97316;
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

// ── Loading skeleton ───────────────────────────────────────────────────────

const SkeletonWrap = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// ── Helpers ────────────────────────────────────────────────────────────────

function getActivePath(pathname: string) {
  // Match /cook-portal/segment → /cook-portal/segment
  const match = pathname.match(/^(\/cook-portal\/[^/]+)/);
  if (match) return match[1];
  return pathname;
}

// ── Component ──────────────────────────────────────────────────────────────

export function CookLayout() {
  const screens = useBreakpoint();
  const isDesktop = Boolean(screens.lg);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { profile, signOut, profileLoading } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const { message } = App.useApp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOpen(false);
  }, [location.pathname]);

  const siderWidth = collapsed
    ? SIDEBAR_WIDTH_COLLAPSED
    : SIDEBAR_WIDTH_EXPANDED;
  const activePath = getActivePath(location.pathname);
  const pageTitle = PAGE_TITLES[activePath] ?? "Cook Dashboard";

  // Desktop menu items
  const menuItems = useMemo<MenuProps["items"]>(
    () =>
      COOK_NAV_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: collapsed ? null : item.label,
        title: item.label,
      })),
    [collapsed],
  );

  // Mobile bottom nav — first 5 items (dashboard + 4 main sections)
  const mobileBottomItems = COOK_NAV_ITEMS.slice(0, 5);

  // Profile dropdown
  const profileMenuItems: MenuProps["items"] = [
    {
      key: "name",
      label: profile?.full_name ?? "Cook",
      icon: <UserOutlined />,
      disabled: true,
    },
    {
      key: "role",
      label: "Role: Cook",
      icon: <CoffeeOutlined />,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "profile",
      label: "My Profile",
      icon: <UserOutlined />,
      onClick: () => navigate("/cook-portal/profile"),
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

  const desktopMenu = (
    <StyledMenu
      mode="inline"
      selectedKeys={[activePath]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
    />
  );

  const mobileMenuItems = useMemo<MenuProps["items"]>(
    () =>
      COOK_NAV_ITEMS.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      })),
    [],
  );

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
          <CookSider
            $collapsed={collapsed}
            width={SIDEBAR_WIDTH_EXPANDED}
            collapsedWidth={SIDEBAR_WIDTH_COLLAPSED}
            collapsed={collapsed}
            trigger={null}
          >
            <SiderTop $collapsed={collapsed}>
              <LogoMark>
                <CoffeeOutlined />
              </LogoMark>
              <BrandWrap $visible={!collapsed}>
                <BrandName>{APP_NAME}</BrandName>
                <BrandRole>Cook Portal</BrandRole>
              </BrandWrap>
            </SiderTop>

            <NavWrap>
              {profileLoading ? (
                <SkeletonWrap>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton.Button
                      key={i}
                      active
                      block
                      style={{ borderRadius: 8, height: 40 }}
                    />
                  ))}
                </SkeletonWrap>
              ) : (
                desktopMenu
              )}
            </NavWrap>

            <SiderBottom $collapsed={collapsed}>
              <Dropdown
                menu={{ items: profileMenuItems }}
                trigger={["click"]}
                placement="topRight"
              >
                <ProfileRow $collapsed={collapsed}>
                  <Avatar
                    size={30}
                    src={profile?.avatar_url ?? undefined}
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                      color: "#fff",
                      flexShrink: 0,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                    icon={<UserOutlined />}
                  >
                    {!profile?.avatar_url
                      ? (profile?.full_name?.charAt(0)?.toUpperCase() ?? "C")
                      : null}
                  </Avatar>
                  <ProfileMeta $visible={!collapsed}>
                    <Typography.Text
                      strong
                      style={{
                        color: "var(--text-strong)",
                        fontSize: "0.8rem",
                        display: "block",
                      }}
                    >
                      {profile?.full_name ?? "Cook"}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        color: "#f97316",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                      }}
                    >
                      Cook
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
          </CookSider>
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
            <DrawerBrand>
              <LogoMark>
                <CoffeeOutlined />
              </LogoMark>
              <div>
                <Typography.Text
                  strong
                  style={{
                    color: "var(--text-strong)",
                    fontSize: "0.95rem",
                    display: "block",
                  }}
                >
                  {APP_NAME}
                </Typography.Text>
                <Typography.Text
                  style={{
                    color: "#f97316",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Cook Portal
                </Typography.Text>
              </div>
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
                    gap: 8,
                    padding: "6px 8px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <Avatar
                    size={28}
                    src={profile?.avatar_url ?? undefined}
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    icon={<UserOutlined />}
                  >
                    {!profile?.avatar_url
                      ? (profile?.full_name?.charAt(0)?.toUpperCase() ?? "C")
                      : null}
                  </Avatar>
                  <div>
                    <Typography.Text
                      strong
                      style={{
                        color: "var(--text-strong)",
                        fontSize: "0.8rem",
                        display: "block",
                      }}
                    >
                      {profile?.full_name ?? "Cook"}
                    </Typography.Text>
                    <Typography.Text
                      style={{
                        color: "#f97316",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                      }}
                    >
                      Cook
                    </Typography.Text>
                  </div>
                </div>
              </Dropdown>
            </div>
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
              <PageTitleWrap>
                <Typography.Text
                  strong
                  style={{
                    color: "var(--text-strong)",
                    fontSize: isDesktop ? "1rem" : "0.95rem",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: isDesktop ? 300 : 160,
                  }}
                >
                  {pageTitle}
                </Typography.Text>
                {isDesktop && (
                  <CookBadge>
                    <CoffeeOutlined /> Cook
                  </CookBadge>
                )}
              </PageTitleWrap>
            </NavLeft>

            <NavRight>
              <Tooltip title={mode === "dark" ? "Light mode" : "Dark mode"}>
                <NavBtn
                  icon={mode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                  onClick={toggleMode}
                  aria-label="Toggle theme"
                />
              </Tooltip>

              <Tooltip title="Notifications">
                <Badge count={0} size="small">
                  <NavBtn icon={<BellOutlined />} aria-label="Notifications" />
                </Badge>
              </Tooltip>

              <Dropdown
                menu={{ items: profileMenuItems }}
                trigger={["click"]}
                placement="bottomRight"
              >
                <ProfileBtn type="button" aria-label="Profile menu">
                  <Avatar
                    size={28}
                    src={profile?.avatar_url ?? undefined}
                    style={{
                      background:
                        "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                    icon={<UserOutlined />}
                  >
                    {!profile?.avatar_url
                      ? (profile?.full_name?.charAt(0)?.toUpperCase() ?? "C")
                      : null}
                  </Avatar>
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
                        {profile?.full_name ?? "Cook"}
                      </Typography.Text>
                      <Typography.Text
                        style={{
                          color: "#f97316",
                          fontSize: "0.68rem",
                          fontWeight: 600,
                        }}
                      >
                        Cook
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

      {/* ── Mobile bottom nav — fixed at viewport bottom ── */}
      {!isDesktop && (
        <BottomNav role="navigation" aria-label="Cook navigation">
          {mobileBottomItems.map((item) => {
            const isActive = activePath === item.key;
            return (
              <BottomNavItem
                key={item.key}
                $active={isActive}
                onClick={() => navigate(item.key)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && <ActiveDot />}
                {item.icon}
                <BottomNavLabel>{item.label}</BottomNavLabel>
              </BottomNavItem>
            );
          })}
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
    </>
  );
}
