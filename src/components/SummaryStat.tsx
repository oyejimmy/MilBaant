import type { ReactNode } from 'react'
import type { SummaryStatItem } from '@/lib/types'

interface SummaryStatProps extends SummaryStatItem {
  icon?: ReactNode
  color?: string
}

export function SummaryStat({ title, value, subtitle, icon, color = '#1677ff' }: SummaryStatProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: `1.5px solid ${color}22`,
      borderRadius: 14,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color, letterSpacing: '-0.3px', lineHeight: 1.2 }}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {icon && (
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: `${color}18`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 14,
          color,
        }}>
          {icon}
        </div>
      )}
    </div>
  )
}
