import type { ReactNode } from 'react'
import styled from 'styled-components'
import type { SummaryStatItem } from '@/lib/types'

interface SummaryStatProps extends SummaryStatItem {
  icon?: ReactNode
  color?: string
}

const StatCard = styled.div<{ $color: string }>`
  background: var(--surface);
  border: 1.5px solid ${({ $color }) => $color}22;
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  @media (min-width: 768px) {
    padding: 14px 18px;
    gap: 12px;
  }
`

const StatValue = styled.div<{ $color: string }>`
  font-size: clamp(14px, 4vw, 18px);
  font-weight: 700;
  color: ${({ $color }) => $color};
  letter-spacing: -0.3px;
  line-height: 1.2;
`

export function SummaryStat({ title, value, subtitle, icon, color = '#1677ff' }: SummaryStatProps) {
  return (
    <StatCard $color={color}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 2 }}>{title}</div>
        <StatValue $color={color}>{value}</StatValue>
        {subtitle && (
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2, lineHeight: 1.3 }}>{subtitle}</div>
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
