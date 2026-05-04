import { Button, Tooltip } from 'antd'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { useTheme } from '@/hooks/useTheme'

interface ThemeToggleProps {
  /** 'icon' renders a square icon button (default). 'switch' renders a labeled button. */
  variant?: 'icon' | 'labeled'
  size?: 'small' | 'middle' | 'large'
  className?: string
}

/**
 * ThemeToggle — drop-in component to switch between light and dark mode.
 *
 * Usage:
 *   <ThemeToggle />
 *   <ThemeToggle variant="labeled" />
 */
export function ThemeToggle({ variant = 'icon', size = 'middle', className }: ThemeToggleProps) {
  const { isDark, toggle } = useTheme()

  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode'
  const icon  = isDark ? <SunOutlined /> : <MoonOutlined />

  if (variant === 'labeled') {
    return (
      <Button
        onClick={toggle}
        icon={icon}
        size={size}
        className={className}
        aria-label={label}
        style={{
          background:   'transparent',
          border:       '1px solid var(--border-default)',
          color:        'var(--text-primary)',
          borderRadius: 'var(--radius-md)',
          fontWeight:   500,
          display:      'flex',
          alignItems:   'center',
          gap:          6,
        }}
      >
        {isDark ? 'Light mode' : 'Dark mode'}
      </Button>
    )
  }

  return (
    <Tooltip title={label} placement="bottom">
      <Button
        onClick={toggle}
        icon={icon}
        size={size}
        className={className}
        aria-label={label}
        style={{
          background:    'transparent',
          border:        '1px solid var(--border-default)',
          color:         'var(--text-secondary)',
          borderRadius:  'var(--radius-md)',
          width:         size === 'small' ? 32 : size === 'large' ? 44 : 36,
          height:        size === 'small' ? 32 : size === 'large' ? 44 : 36,
          padding:       0,
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'center',
          flexShrink:    0,
          transition:    'all 0.2s ease',
        }}
      />
    </Tooltip>
  )
}
