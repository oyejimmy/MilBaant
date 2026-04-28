import type { ReactNode } from 'react'
import styled from 'styled-components'
import type { SummaryStatItem } from '@/lib/types'

interface SummaryStatProps extends SummaryStatItem {
  icon?: ReactNode
  color?: string
}

const StatCard = styled.div<{ $color: string }>`
  background: var(--surface);
  border: none;
  border-radius: 14px;
  padding: 8px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 768px) {
    padding: 10px 16px;
    gap: 12px;
  }
`

const StatValue = styled.div`
  font-size: clamp(14px, 4vw, 18px);
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.3px;
  line-height: 1.2;
`

export function SummaryStat({ title, value, subtitle, icon, color = 'var(--primary)' }: SummaryStatProps) {
  return (
    <StatCard $color={color}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 1 }}>{title}</div>
        <StatValue>{value}</StatValue>
        {subtitle && (
          <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 1, lineHeight: 1.3 }}>{subtitle}</div>
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
    </StatCard>
  )
}
