import { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import {
  App,
  Avatar,
  Drawer,
  Dropdown,
  Grid,
  Menu,
  Typography,
  Tooltip,
} from "antd";
import type { MenuProps } from "antd";
import {
  KeyOutlined,
  LogoutOutlined,
  MenuOutlined,
  MoonOutlined,
  SunOutlined,
  SyncOutlined,
  UserOutlined,
  WifiOutlined,
} from "@ant-design/icons";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { APP_NAME } from "@/lib/constants";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/hooks/useAuth";
import { useThemeMode } from "@/context/ThemeModeContext";
import { useCookRequests } from "@/hooks/useCookRequests";
import { useAnnouncements } from "@/hooks/useAnnouncements";
import { useSyncQueue } from "@/hooks/useSyncQueue";
import {
  Shell,
  MainLayout,
  MainContent,
  ContentWrap,
  TopHeader,
  NavLeft,
  NavCenter,
  NavRight,
  NavBtn,
  ProfileBtn,
  BreadcrumbWrap,
  DrawerNav,
  DrawerBrand,
  LogoMark,
  StyledMenu,
  SyncStatusDot,
} from "./styles";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { ResetPasswordModal } from "./ResetPasswordModal";
import { LogoHouseIcon } from "./LogoHouseIcon";
import { getActivePath, getBreadcrumbs, useFilteredNavItems } from "./hooks";
import { SIDEBAR_WIDTH_EXPANDED, SIDEBAR_WIDTH_COLLAPSED } from "./constants";

const { useBreakpoint } = Grid;

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

  const cookRequestsQuery = useCookRequests();
  const announcementsQuery = useAnnouncements();
  const { isOnline, pendingCount, status: syncStatus, sync } = useSyncQueue();

  const pendingRequestCount = (cookRequestsQuery.data ?? []).filter(
    (r) => r.status === "pending",
  ).length;
  const announcementCount = (announcementsQuery.data ?? []).length;

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
  const filteredNavGroups = useFilteredNavItems(isAdmin, isCook);

  const profileMenuItems: MenuProps["items"] = useMemo(
    () => [
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
    ],
    [profile, navigate, signOut, message],
  );

  const mobileDrawerMenuItems = useMemo(() => {
    return filteredNavGroups.map((group, gi) => ({
      key: `group-${gi}-${group.label}`,
      type: "group" as const,
      label: group.label || null,
      children: group.items.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
      })),
    }));
  }, [filteredNavGroups]);

  const welcomeText = isCook ? "Cook Portal" : isAdmin ? "Admin" : "Resident";
  const welcomeGradient = isCook
    ? "linear-gradient(90deg, #f97316, #fb923c)"
    : isAdmin
      ? "linear-gradient(90deg, #7c3aed, #a855f7)"
      : "linear-gradient(90deg, #1677ff, #06b6d4)";

  return (
    <>
      <Shell>
        {isDesktop && (
          <DesktopSidebar
            collapsed={collapsed}
            onCollapse={setCollapsed}
            activePath={activePath}
            onNavigate={navigate}
            profileMenuItems={profileMenuItems}
            profile={profile}
            pendingRequestCount={pendingRequestCount}
            announcementCount={announcementCount}
            isAdmin={isAdmin}
            isCook={isCook}
          />
        )}

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

              <div style={{ flex: 1 }}>
                <StyledMenu>
                  <Menu
                    mode="inline"
                    selectedKeys={[activePath]}
                    items={mobileDrawerMenuItems}
                    onClick={({ key }) => {
                      navigate(key);
                      setMobileOpen(false);
                    }}
                  />
                </StyledMenu>
              </div>

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

            <NavCenter>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.7px",
                  lineHeight: 1,
                  background: welcomeGradient,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {welcomeText}
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
                      <SyncStatusDot $color={!isOnline ? "#ff4d4f" : "#f59e0b"} />
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

          {!isDesktop && (
            <MobileBottomNav
              activePath={activePath}
              onNavigate={navigate}
              onOpenDrawer={() => setMobileOpen(true)}
              pendingRequestCount={pendingRequestCount}
              announcementCount={announcementCount}
              isAdmin={isAdmin}
              isCook={isCook}
            />
          )}
        </MainLayout>
      </Shell>

      <ResetPasswordModal
        open={resetPwOpen}
        onClose={() => setResetPwOpen(false)}
      />
    </>
  );
}
