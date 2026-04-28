import { useMemo, useState } from 'react'
import {
  Avatar,
  Breadcrumb,
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
import type { MenuProps } from 'antd'
import {
  ApartmentOutlined,
  AuditOutlined,
  CarOutlined,
  CoffeeOutlined,
  DashboardOutlined,
  DollarCircleOutlined,
  FundOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  NotificationOutlined,
  ScheduleOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { APP_NAME } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useThemeMode } from '@/context/ThemeModeContext'

const { Header, Content, Sider } = Layout
const { useBreakpoint } = Grid

// ── Sidebar dimensions ─────────────────────────────────────────────────────
const EXPANDED  = 228
const COLLAPSED = 60

// ── Grouped menu definition ────────────────────────────────────────────────
interface NavGroup {
  label: string
  items: Array<{ key: string; label: string; icon: React.ReactNode; adminOnly?: boolean }>
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { key: '/',          label: 'Dashboard',    icon: <DashboardOutlined /> },
    ],
  },
  {
    label: 'Management',
    items: [
      { key: '/expenses',         label: 'Expenses',       icon: <WalletOutlined /> },
      { key: '/contributions',    label: 'Contributions',  icon: <DollarCircleOutlined /> },
      { key: '/cook',             label: 'Cook Ledger',    icon: <FundOutlined /> },
      { key: '/daily-menu',       label: 'Daily Menu',     icon: <ScheduleOutlined /> },
    ],
  },
  {
    label: '',
    items: [
      { key: '/weekend-expenses', label: 'Weekend Meals',  icon: <CoffeeOutlined /> },
      { key: '/rides',            label: 'Rides',          icon: <CarOutlined /> },
    ],
  },
  {
    label: 'Community',
    items: [
      { key: '/announcements',    label: 'Announcements',  icon: <NotificationOutlined /> },
      { key: '/logs',             label: 'Activity Logs',  icon: <AuditOutlined /> },
    ],
  },
  {
    label: 'System',
    items: [
      { key: '/flat-view',        label: 'Flat View',      icon: <ApartmentOutlined /> },
      { key: '/admin',            label: 'Admin',          icon: <SettingOutlined />, adminOnly: true },
    ],
  },
]

// ── Styled components ──────────────────────────────────────────────────────

const Shell = styled(Layout)`
  min-height: 100vh;
  background: var(--content-bg) !important;
`

const AppSider = styled(Sider)<{ $collapsed: boolean }>`
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

const SiderTop = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
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
  border-radius: 8px;
  background: linear-gradient(135deg, #909ffa 0%, #6b7ff0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(144, 159, 250, 0.35);
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
  padding: 8px 0;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--sidebar-border); border-radius: 3px; }
`

const StyledMenu = styled(Menu)`
  background: transparent !important;
  border-inline-end: none !important;
  padding: 0 6px;

  .ant-menu-item {
    border-radius: 7px !important;
    margin: 1px 0 !important;
    height: 38px !important;
    line-height: 38px !important;
    width: 100% !important;
    font-size: 0.82rem !important;
  }

  .ant-menu-item-selected {
    background: rgba(144, 159, 250, 0.14) !important;
    color: #909ffa !important;
    font-weight: 600 !important;
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

const MainLayout = styled(Layout)<{ $ml: number }>`
  background: transparent !important;
  margin-left: ${({ $ml }) => $ml}px;
  transition: margin-left 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
`

const TopHeader = styled(Header)`
  position: sticky !important;
  top: 0;
  z-index: 100;
  height: 52px !important;
  line-height: 52px !important;
  padding: 0 10px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  background: var(--navbar-bg) !important;
  border-bottom: 1px solid var(--navbar-border) !important;
  box-shadow: 0 1px 0 var(--navbar-border) !important;

  @media (min-width: 768px) {
    height: 56px !important;
    line-height: 56px !important;
    padding: 0 20px !important;
  }
`

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
`

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;

  @media (min-width: 768px) { gap: 6px; }
`

const NavBtn = styled(Button)`
  border-radius: 7px !important;
  border-color: var(--navbar-border) !important;
  background: transparent !important;
  color: var(--text-muted) !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;

  @media (min-width: 768px) { width: 34px !important; height: 34px !important; }

  &:hover {
    background: var(--menu-hover-bg) !important;
    color: var(--text-strong) !important;
    border-color: #909ffa !important;
  }
`

const ProfileBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 6px 3px 3px;
  border: 1px solid var(--navbar-border);
  border-radius: 7px;
  background: transparent;
  cursor: pointer;
  color: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
  flex-shrink: 0;

  @media (min-width: 768px) { gap: 6px; padding: 3px 8px 3px 3px; }

  &:hover { background: var(--menu-hover-bg); border-color: #909ffa; }
`

const BreadcrumbWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`

const MainContent = styled(Content)`
  padding: 12px;
  background: transparent !important;
  padding-bottom: 72px;

  @media (min-width: 768px) {
    padding: 24px;
    padding-bottom: 24px;
  }
`

const ContentWrap = styled.div`
  width: min(1400px, 100%);
  margin: 0 auto;
`

// ── Mobile drawer ──────────────────────────────────────────────────────────
const DrawerNav = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const DrawerBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 0 14px;
  border-bottom: 1px solid var(--sidebar-border);
  margin-bottom: 6px;
`

// ── Mobile bottom nav ──────────────────────────────────────────────────────
const BottomNav = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 300;
  height: 56px;
  background: var(--navbar-bg);
  border-top: 1px solid var(--navbar-border);
  display: flex;
  align-items: stretch;
  padding: 0 2px;
  padding-bottom: env(safe-area-inset-bottom, 0px);
`

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
  color: ${({ $active }) => ($active ? '#909ffa' : 'var(--text-muted)')};
  transition: color 0.15s ease, background 0.15s ease;
  min-width: 0;

  &:active { background: var(--menu-hover-bg); }
  .anticon { font-size: 17px; }
`

const BottomNavLabel = styled.span`
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
`

// ── Helpers ────────────────────────────────────────────────────────────────
function getActivePath(pathname: string) {
  return pathname === '/' ? '/' : `/${pathname.split('/')[1]}`
}

function getBreadcrumbs(activePath: string) {
  const all = NAV_GROUPS.flatMap((g) => g.items)
  const item = all.find((i) => i.key === activePath)
  if (!item) return [{ title: 'Dashboard' }]
  return [{ title: 'MilBaant' }, { title: item.label }]
}

// ── Component ──────────────────────────────────────────────────────────────
export function AppLayout() {
  const screens    = useBreakpoint()
  const isDesktop  = Boolean(screens.lg)
  const navigate   = useNavigate()
  const location   = useLocation()
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const { isAdmin, profile, canManageExpenses, signOut } = useAuth()
  const { mode, toggleMode } = useThemeMode()

  const siderWidth = collapsed ? COLLAPSED : EXPANDED
  const activePath = getActivePath(location.pathname)
  const breadcrumbs = getBreadcrumbs(activePath)

  // Build Ant Design menu items with group dividers
  const menuItems = useMemo<MenuProps['items']>(() => {
    const items: MenuProps['items'] = []
    NAV_GROUPS.forEach((group, gi) => {
      const visibleItems = group.items.filter((i) => !i.adminOnly || isAdmin)
      if (visibleItems.length === 0) return

      // Group divider (not shown when collapsed — just a visual separator)
      if (gi > 0) {
        items.push({ type: 'divider', key: `div-${gi}`, style: { margin: '4px 10px', opacity: 0.5 } })
      }

      // Group label as a disabled item (hidden when collapsed)
      if (!collapsed) {
        items.push({
          key: `group-${gi}`,
          label: (
            <span style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              lineHeight: 1,
            }}>
              {group.label}
            </span>
          ),
          disabled: true,
          style: { cursor: 'default', height: 24, minHeight: 24, lineHeight: '24px', padding: '0 10px', marginBottom: 2 },
        })
      }

      // Actual nav items
      visibleItems.forEach((item) => {
        items.push({
          key: item.key,
          icon: item.icon,
          label: collapsed ? null : item.label,
        })
      })
    })
    return items
  }, [isAdmin, collapsed])

  // Flat list for mobile bottom nav (first 5 most important)
  const mobileItems = useMemo(() => {
    return NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => !i.adminOnly || isAdmin)
      .slice(0, 5)
  }, [isAdmin])

  const profileMenuItems: MenuProps['items'] = [
    { key: 'name',   label: profile?.full_name ?? 'Flatmate', icon: <UserOutlined />,         disabled: true },
    { key: 'role',   label: `Role: ${isAdmin ? 'Admin' : 'User'}`, icon: <TeamOutlined />,    disabled: true },
    { key: 'access', label: canManageExpenses ? 'Can add expenses' : 'View only', icon: <DollarCircleOutlined />, disabled: true },
    { type: 'divider' },
    { key: 'logout', label: 'Sign Out', icon: <LogoutOutlined />, danger: true,
      onClick: () => void (async () => {
        try { await signOut(); void message.success('Signed out.'); navigate('/login', { replace: true }) }
        catch (e) { void message.error(e instanceof Error ? e.message : 'Unable to sign out.') }
      })(),
    },
  ]

  const navMenu = (
    <StyledMenu
      mode="inline"
      selectedKeys={[activePath]}
      inlineCollapsed={isDesktop ? collapsed : false}
      items={menuItems}
      onClick={({ key }) => { navigate(key); setMobileOpen(false) }}
    />
  )

  return (
    <Shell>
      {/* ── Desktop sidebar ── */}
      {isDesktop && (
        <AppSider
          $collapsed={collapsed}
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
                <Avatar
                  size={28}
                  style={{ background: '#909ffa', color: '#fff', flexShrink: 0 }}
                  icon={<UserOutlined />}
                />
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
          styles={{
            body: { padding: '16px', background: 'var(--sidebar-bg)', display: 'flex', flexDirection: 'column', width: 240 },
            header: { display: 'none' },
            wrapper: { width: 240 },
          }}
        >
          <DrawerNav>
            <DrawerBrand>
              <LogoMark>M</LogoMark>
              <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.95rem' }}>
                {APP_NAME}
              </Typography.Text>
            </DrawerBrand>

            <div style={{ flex: 1 }}>
              <StyledMenu
                mode="inline"
                selectedKeys={[activePath]}
                items={menuItems}
                onClick={({ key }) => { navigate(key); setMobileOpen(false) }}
              />
            </div>

            <div style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 12, marginTop: 8 }}>
              <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="topRight">
                <ProfileRow $collapsed={false}>
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
              <NavBtn icon={<MenuOutlined />} onClick={() => setMobileOpen(true)} aria-label="Open menu" />
            )}
            <BreadcrumbWrap>
              {isDesktop ? (
                <Breadcrumb
                  items={breadcrumbs}
                  style={{ fontSize: '0.82rem' }}
                />
              ) : (
                <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.9rem' }}>
                  {breadcrumbs[breadcrumbs.length - 1]?.title}
                </Typography.Text>
              )}
            </BreadcrumbWrap>
          </NavLeft>

          <NavRight>
            <Tooltip title={mode === 'dark' ? 'Light mode' : 'Dark mode'}>
              <NavBtn
                icon={mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleMode}
                aria-label="Toggle theme"
              />
            </Tooltip>

            <Dropdown menu={{ items: profileMenuItems }} trigger={['click']} placement="bottomRight">
              <ProfileBtn type="button" aria-label="Profile menu">
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

      {/* ── Mobile bottom nav ── */}
      {!isDesktop && (
        <BottomNav role="navigation" aria-label="Main navigation">
          {mobileItems.map((item) => (
            <BottomNavItem
              key={item.key}
              $active={activePath === item.key}
              onClick={() => navigate(item.key)}
              aria-label={item.label}
              aria-current={activePath === item.key ? 'page' : undefined}
            >
              {item.icon}
              <BottomNavLabel>{item.label}</BottomNavLabel>
            </BottomNavItem>
          ))}
          <BottomNavItem $active={false} onClick={() => setMobileOpen(true)} aria-label="More navigation">
            <MenuOutlined />
            <BottomNavLabel>More</BottomNavLabel>
          </BottomNavItem>
        </BottomNav>
      )}
    </Shell>
  )
}
