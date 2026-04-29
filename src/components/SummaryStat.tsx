import type { ReactNode } from 'react'
import styled from 'styled-components'
import type { SummaryStatItem } from '@/lib/types'

interface SummaryStatProps extends SummaryStatItem {
  icon?: ReactNode
  color?: string
}

const StatCard = styled.div<{ $color: string }>`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1), 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  @media (min-width: 768px) {
    padding: 14px 16px;
    border-radius: 14px;
  }
`

const IconWrap = styled.div<{ $color: string }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${({ $color }) => `${$color}18`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 16px;
  color: ${({ $color }) => $color};

  @media (min-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
`

const StatValue = styled.div`
  font-size: clamp(14px, 3.5vw, 18px);
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.3px;
  line-height: 1.2;
`

export function SummaryStat({ title, value, subtitle, icon, color = 'var(--primary)' }: SummaryStatProps) {
  return (
    <StatCard $color={color}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          {title}
        </div>
        <StatValue>{value}</StatValue>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
            {subtitle}
          </div>
        )}
      </div>
      {icon && <IconWrap $color={color}>{icon}</IconWrap>}
    </StatCard>
  )
}
