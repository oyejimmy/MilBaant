import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import {
  DashboardOutlined,
  WalletOutlined,
  ApartmentOutlined,
  MenuOutlined,
} from '@ant-design/icons'

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { key: '/', label: 'Home', icon: <DashboardOutlined /> },
  { key: '/expenses', label: 'Expenses', icon: <WalletOutlined /> },
  { key: '/flat-view', label: 'Flat', icon: <ApartmentOutlined /> },
]

const BottomNavContainer = styled.nav`
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
  padding-bottom: max(env(safe-area-inset-bottom, 0px), 0px);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);

  @supports (padding: max(0px)) {
    padding-bottom: max(env(safe-area-inset-bottom), 4px);
  }
`

const NavButton = styled.button<{ $active: boolean }>`
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
  margin: 2px;
  color: ${({ $active }) => ($active ? 'var(--primary)' : 'var(--text-muted)')};
  transition: color 0.15s ease, background 0.15s ease;
  min-width: 0;
  position: relative;

  /* Touch feedback */
  &:active {
    background: var(--menu-hover-bg);
    transform: scale(0.95);
  }

  /* Active indicator */
  ${({ $active }) =>
    $active &&
    `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: var(--primary);
      border-radius: 0 0 3px 3px;
    }
  `}

  .anticon {
    font-size: 20px;
    transition: transform 0.2s ease;
  }

  ${({ $active }) =>
    $active &&
    `
    .anticon {
      transform: scale(1.1);
    }
  `}
`

const NavLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  line-height: 1;
  letter-spacing: 0.2px;
`

interface MobileBottomNavProps {
  onMoreClick?: () => void
}

function getActivePath(pathname: string): string {
  return pathname === '/' ? '/' : `/${pathname.split('/')[1]}`
}

export function MobileBottomNav({ onMoreClick }: MobileBottomNavProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const activePath = getActivePath(location.pathname)

  return (
    <BottomNavContainer role="navigation" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.key}
          $active={activePath === item.key}
          onClick={() => navigate(item.key)}
          aria-label={item.label}
          aria-current={activePath === item.key ? 'page' : undefined}
        >
          {item.icon}
          <NavLabel>{item.label}</NavLabel>
        </NavButton>
      ))}
      <NavButton
        $active={false}
        onClick={onMoreClick}
        aria-label="More navigation"
      >
        <MenuOutlined />
        <NavLabel>More</NavLabel>
      </NavButton>
    </BottomNavContainer>
  )
}
