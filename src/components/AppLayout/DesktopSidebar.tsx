import { Avatar, Dropdown, Menu, Typography } from "antd";
import {
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import {
  AppSider,
  SiderTop,
  LogoMark,
  BrandText,
  NavWrap,
  StyledMenu,
  SiderBottom,
  ProfileRow,
  ProfileMeta,
  CollapseBtn,
  NavBadge,
} from "./styles";
import { LogoHouseIcon } from "./LogoHouseIcon";
import {
  SIDEBAR_WIDTH_EXPANDED,
  SIDEBAR_WIDTH_COLLAPSED,
} from "./constants";
import { APP_NAME } from "@/lib/constants";
import { useFilteredNavItems } from "./hooks";
import type { MenuProps } from "antd";
import { useMemo } from "react";

interface DesktopSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  activePath: string;
  onNavigate: (path: string) => void;
  profileMenuItems: MenuProps["items"];
  profile: any;
  pendingRequestCount: number;
  announcementCount: number;
  isAdmin: boolean;
  isCook: boolean;
}

export function DesktopSidebar({
  collapsed,
  onCollapse,
  activePath,
  onNavigate,
  profileMenuItems,
  profile,
  pendingRequestCount,
  announcementCount,
  isAdmin,
  isCook,
}: DesktopSidebarProps) {
  const filteredNavGroups = useFilteredNavItems(isAdmin, isCook);

  const menuItems = useMemo(() => {
    return filteredNavGroups.map((group, index) => ({
      key: `group-${index}-${group.label}`,
      type: "group" as const,
      label: !collapsed && group.label ? group.label : null,
      children: group.items.map((item) => {
        const badge =
          item.key === "/cook-requests" && pendingRequestCount > 0
            ? pendingRequestCount
            : item.key === "/announcements" && announcementCount > 0
              ? announcementCount
              : 0;

        return {
          key: item.key,
          icon: item.icon,
          label:
            collapsed || badge === 0 ? (
              item.label
            ) : (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                {item.label}
              <NavBadge
                $color={item.key === "/cook-requests" ? "#ff4d4f" : undefined}
              >
                {badge}
              </NavBadge>
            </span>
            ),
          title: item.label,
        };
      }),
    }));
  }, [
    filteredNavGroups,
    collapsed,
    pendingRequestCount,
    announcementCount,
  ]);

  return (
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

      <NavWrap>
        <StyledMenu>
          <Menu
            mode="inline"
            selectedKeys={[activePath]}
            items={menuItems}
            onClick={({ key }) => onNavigate(key)}
          />
        </StyledMenu>
      </NavWrap>

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
          onClick={() => onCollapse(!collapsed)}
        >
          {!collapsed && <span style={{ fontSize: "0.78rem" }}>Collapse</span>}
        </CollapseBtn>
      </SiderBottom>
    </AppSider>
  );
}
