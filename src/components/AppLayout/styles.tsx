import styled from "styled-components";
import { Layout, Button, Typography } from "antd";

const { Header, Content, Sider } = Layout;

// ============================================
// Layout Containers
// ============================================

export const Shell = styled(Layout)`
  min-height: 100vh;
  background: var(--content-bg);
`;

export const AppSider = styled(Sider)<{ $collapsed: boolean }>`
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

export const MainLayout = styled(Layout)<{ $ml: number }>`
  background: transparent;
  margin-left: ${({ $ml }) => $ml}px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.2s ease;
`;

export const MainContent = styled(Content)`
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

export const ContentWrap = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
`;

// ============================================
// Sidebar Components
// ============================================

export const SiderTop = styled.div<{ $collapsed: boolean }>`
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

export const LogoMark = styled.div`
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

export const BrandText = styled(Typography.Text)<{ $visible: boolean }>`
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

export const NavWrap = styled.div`
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

export const StyledMenu = styled.div`
  .ant-menu {
    background: transparent;
    border-inline-end: none;
    padding: 0 6px;
  }

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

export const SiderBottom = styled.div<{ $collapsed: boolean }>`
  border-top: 1px solid var(--sidebar-border);
  padding: ${({ $collapsed }) => ($collapsed ? "10px 6px" : "10px")};
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
`;

export const ProfileRow = styled.div<{ $collapsed: boolean }>`
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

export const ProfileMeta = styled.div<{ $visible: boolean }>`
  overflow: hidden;
  white-space: nowrap;
  flex: 1;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? "160px" : "0")};
  transition:
    opacity 0.2s ease,
    max-width 0.2s ease;
`;

export const CollapseBtn = styled(Button)<{ $collapsed: boolean }>`
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

// ============================================
// Header Components
// ============================================

export const TopHeader = styled(Header)<{ $scrolled: boolean }>`
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
    $scrolled ? "0 4px 20px rgba(0,0,0,0.10)" : "0 2px 8px rgba(0,0,0,0.05)"};

  @media (min-width: 768px) {
    height: 56px;
    line-height: 56px;
    padding: 0 24px;
  }
`;

export const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`;

export const NavCenter = styled.div`
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

export const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  @media (min-width: 768px) {
    gap: 6px;
  }
`;

export const NavBtn = styled(Button)`
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

export const ProfileBtn = styled.button`
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

export const BreadcrumbWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

// ============================================
// Mobile Drawer Components
// ============================================

export const DrawerNav = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

export const DrawerBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 6px;
`;

// ============================================
// Mobile Bottom Navigation Components
// ============================================

export const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 56px;
  background: var(--navbar-bg);
  border-top: 1px solid var(--sidebar-border);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: stretch;
  padding: 0 4px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
`;

export const BottomNavItem = styled.button<{ $active: boolean }>`
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
  position: relative;

  &:active {
    background: var(--menu-hover-bg);
  }
  .anticon {
    font-size: 17px;
  }
`;

export const ActiveDot = styled.div`
  position: absolute;
  top: 4px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--primary);
`;

export const BottomNavLabel = styled.span`
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
`;

// ============================================
// Helper Components
// ============================================

export const NavBadge = styled.span<{ $color?: string }>`
  background: ${({ $color }) => $color || "var(--primary)"};
  color: #fff;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  line-height: 16px;
  min-width: 18px;
  text-align: center;
  display: inline-block;
`;

export const BadgeDot = styled(NavBadge)`
  position: absolute;
  top: -4px;
  right: -6px;
  font-size: 9px;
  padding: 0 4px;
  line-height: 14px;
  min-width: 14px;
  pointer-events: none;
`;

export const SyncStatusDot = styled.span<{ $color: string }>`
  position: absolute;
  top: 2px;
  right: 2px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  border: 1.5px solid var(--navbar-bg);
`;