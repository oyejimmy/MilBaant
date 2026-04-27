import { useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Drawer,
  Dropdown,
  Grid,
  Layout,
  Menu,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  ApartmentOutlined,
  AuditOutlined,
  CalendarOutlined,
  CarOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  NotificationOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { APP_NAME, NAV_ITEMS } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useThemeMode } from '@/context/ThemeModeContext'

const { Header, Content, Sider } = Layout
const { useBreakpoint } = Grid

/* ─── Shell ───────────────────────────────────────────────────────────────── */

const Shell = styled(Layout)`
  min-height: 100vh;
  background: var(--content-bg) !important;
`

/* ─── Desktop Sidebar ─────────────────────────────────────────────────────── */

const AppSider = styled(Sider)`
  position: fixed !important;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 200;
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--sidebar-border) !important;
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1) !important;

  .ant-layout-sider-children {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }
`

/* ─── Sidebar internals ───────────────────────────────────────────────────── */

const SiderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  height: 56px;
  min-height: 56px;
  border-bottom: 1px solid var(--sidebar-border);
  flex-shrink: 0;
  overflow: hidden;
`

const LogoMark = styled.div`
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 7px;
  background: #909ffa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
`

const BrandText = styled(Typography.Text)<{ $visible: boolean }>`
  font-family: 'Plus Jakarta Sans', sans-serif !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  color: var(--text-strong) !important;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? '160px' : '0')};
  transition: opacity 0.18s ease, max-width 0.18s ease;
`

const NavWrap = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 8px 6px;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 3px; }
`

const StyledMenu = styled(Menu)`
  background: transparent !important;
  border-inline-end: none !important;

  .ant-menu-item {
    border-radius: 7px !important;
    margin: 2px 0 !important;
    height: 42px !important;
    line-height: 42px !important;
    width: 100% !important;
  }

  .ant-menu-item-selected {
    background: rgba(144, 159, 250, 0.14) !important;
    color: #909ffa !important;
    .anticon { color: #909ffa !important; }
  }

  .ant-menu-item:not(.ant-menu-item-selected):hover {
    background: var(--menu-hover-bg) !important;
  }
`

const SiderBottom = styled.div<{ $collapsed: boolean }>`
  border-top: 1px solid var(--sidebar-border);
  padding: ${({ $collapsed }) => ($collapsed ? '10px 6px' : '10px 10px')};
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
`

const ProfileRow = styled.div<{ $collapsed: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: ${({ $collapsed }) => ($collapsed ? '6px 0' : '6px 8px')};
  border-radius: 7px;
  cursor: pointer;
  transition: background 0.15s ease;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')};
  &:hover { background: var(--menu-hover-bg); }
`

const ProfileMeta = styled.div<{ $visible: boolean }>`
  overflow: hidden;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  max-width: ${({ $visible }) => ($visible ? '160px' : '0')};
  transition: opacity 0.18s ease, max-width 0.18s ease;
  white-space: nowrap;
`

const CollapseBtn = styled(Button)<{ $collapsed: boolean }>`
  width: 100% !important;
  border-radius: 7px !important;
  border-color: var(--sidebar-border) !important;
  background: transparent !important;
  color: var(--text-muted) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: ${({ $collapsed }) => ($collapsed ? 'center' : 'flex-start')} !important;
  gap: 6px;

  &:hover {
    background: var(--menu-hover-bg) !important;
    color: var(--text-strong) !important;
    border-color: var(--sidebar-border) !important;
  }
`

/* ─── Main layout ─────────────────────────────────────────────────────────── */

const MainLayout = styled(Layout)<{ $ml: number }>`
  background: transparent !important;
  margin-left: ${({ $ml }) => $ml}px;
  transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
`

/* ─── Navbar ──────────────────────────────────────────────────────────────── */

const TopHeader = styled(Header)`
  position: sticky !important;
  top: 0;
  z-index: 100;
  height: 56px !important;
  line-height: 56px !important;
  padding: 0 16px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: var(--navbar-bg) !important;
  border-bottom: 1px solid var(--navbar-border) !important;
  border-radius: 0 !important;
`

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const NavTitle = styled(Typography.Text)`
  font-size: 0.95rem !important;
  font-weight: 600 !important;
  color: var(--text-strong) !important;
`

const NavBtn = styled(Button)`
  border-radius: 7px !important;
  border-color: var(--navbar-border) !important;
  background: transparent !important;
  color: var(--text-muted) !important;
  width: 34px !important;
  height: 34px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  &:hover {
    background: var(--menu-hover-bg) !important;
    color: var(--text-strong) !important;
    border-color: #909ffa !important;
  }
`

const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px 3px 3px;
  border: 1px solid var(--navbar-border);
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: var(--menu-hover-bg);
    border-color: #909ffa;
  }
`

/* ─── Content ─────────────────────────────────────────────────────────────── */

const MainContent = styled(Content)`
  padding: 16px;
  background: transparent !important;

  @media (min-width: 768px) {
    padding: 24px;
  }
`

const ContentWrap = styled.div`
  width: min(1360px, 100%);
  margin: 0 auto;
`

/* ─── Mobile drawer nav ───────────────────────────────────────────────────── */

const DrawerNav = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const DrawerBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 16px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 8px;
`

/* ─── Icon map ────────────────────────────────────────────────────────────── */

function getMenuIcon(path: string) {
  switch (path) {
    case '/': return <DashboardOutlined />
    case '/expenses': return <DollarCircleOutlined />
    case '/weekend-expenses': return <CalendarOutlined />
    case '/rides': return <CarOutlined />
    case '/cook': return <CoffeeOutlined />
    case '/flat-view': return <ApartmentOutlined />
    case '/announcements': return <NotificationOutlined />
    case '/admin': return <SettingOutlined />
    case '/logs': return <AuditOutlined />
    default: return <DashboardOutlined />
  }
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function AppLayout() {
  const screens = useBreakpoint()
  const isDesktop = Boolean(screens.lg)
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isAdmin, profile, canManageExpenses, signOut } = useAuth()
  const { mode, toggleMode } = useThemeMode()

  const EXPANDED = 220
  const COLLAPSED = 56
  const siderWidth = collapsed ? COLLAPSED : EXPANDED

  const activePath =
    location.pathname === '/' ? '/' : `/${location.pathname.split('/')[1]}`

  const menuItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => ({
        key: item.key,
        label: item.label,
        icon: getMenuIcon(item.key),
      })),
    [isAdmin],
  )

  const currentLabel =
    menuItems.find((item) => item.key === activePath)?.label ?? 'Dashboard'

  async function handleSignOut() {
    try {
      await signOut()
      message.success('Signed out.')
      navigate('/login', { replace: true })
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to sign out.')
    }
  }

  const profileMenuItems = [
    {
      key: 'name',
      label: profile?.full_name ?? 'Flatmate',
      icon: <UserOutlined />,
      disabled: true,
    },
    {
      key: 'role',
      label: `Role: ${isAdmin ? 'Admin' : 'User'}`,
      icon: <TeamOutlined />,
      disabled: true,
    },
    {
      key: 'access',
      label: canManageExpenses ? 'Can add expenses' : 'View only',
      icon: <DollarCircleOutlined />,
      disabled: true,
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      label: 'Sign Out',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => void handleSignOut(),
    },
  ]

  /* Shared nav menu used in both sidebar and mobile drawer */
  const navMenu = (
    <StyledMenu
      mode="inline"
      selectedKeys={[activePath]}
      inlineCollapsed={isDesktop ? collapsed : false}
      items={menuItems}
      onClick={({ key }) => {
        navigate(key)
        setMobileOpen(false)
      }}
    />
  )

  return (
    <Shell>
      {/* ── Desktop sidebar ── */}
      {isDesktop && (
        <AppSider
          width={EXPANDED}
          collapsedWidth={COLLAPSED}
          collapsed={collapsed}
          trigger={null}
        >
          <SiderTop>
            <LogoMark>M</LogoMark>
            <BrandText $visible={!collapsed}>{APP_NAME}</BrandText>
          </SiderTop>

          <NavWrap>{navMenu}</NavWrap>

          <SiderBottom $collapsed={collapsed}>
            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="topRight">
              <ProfileRow $collapsed={collapsed}>
                <Avatar size={28} style={{ background: '#909ffa', color: '#fff', flexShrink: 0 }} icon={<UserOutlined />} />
                <ProfileMeta $visible={!collapsed}>
                  <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.8rem', display: 'block' }}>
                    {profile?.full_name ?? 'Flatmate'}
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                    {isAdmin ? 'Admin' : 'Resident'}
                  </Typography.Text>
                </ProfileMeta>
              </ProfileRow>
            </Dropdown>

            <CollapseBtn
              $collapsed={collapsed}
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            >
              {!collapsed && <span style={{ fontSize: '0.78rem' }}>Collapse</span>}
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
          width={240}
          styles={{
            body: { padding: '16px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column' },
            header: { display: 'none' },
          }}
        >
          <DrawerNav>
            <DrawerBrand>
              <LogoMark>M</LogoMark>
              <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.95rem' }}>
                {APP_NAME}
              </Typography.Text>
            </DrawerBrand>

            <div style={{ flex: 1 }}>{navMenu}</div>

            <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 12, marginTop: 8 }}>
              <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="topRight">
                <ProfileRow $collapsed={false} style={{ marginBottom: 0 }}>
                  <Avatar size={28} style={{ background: '#909ffa', color: '#fff' }} icon={<UserOutlined />} />
                  <div>
                    <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.8rem', display: 'block' }}>
                      {profile?.full_name ?? 'Flatmate'}
                    </Typography.Text>
                    <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                      {isAdmin ? 'Admin' : 'Resident'}
                    </Typography.Text>
                  </div>
                </ProfileRow>
              </Dropdown>
            </div>
          </DrawerNav>
        </Drawer>
      )}

      {/* ── Main area ── */}
      <MainLayout $ml={isDesktop ? siderWidth : 0}>
        <TopHeader>
          <NavLeft>
            {!isDesktop && (
              <NavBtn icon={<MenuOutlined />} onClick={() => setMobileOpen(true)} />
            )}
            <NavTitle>{currentLabel}</NavTitle>
          </NavLeft>

          <NavRight>
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <NavBtn
                icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleMode}
              />
            </Tooltip>

            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
              <ProfileBtn type="button">
                <Avatar size={26} style={{ background: '#909ffa', color: '#fff' }} icon={<UserOutlined />} />
                {isDesktop && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
                    <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.78rem' }}>
                      {profile?.full_name ?? 'Flatmate'}
                    </Typography.Text>
                    <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                      {isAdmin ? 'Admin' : 'Resident'}
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
      </MainLayout>
    </Shell>
  )
}
