import type { ReactNode } from 'react'
import styled from 'styled-components'
import type { SummaryStatItem } from '@/lib/types'

interface SummaryStatProps extends SummaryStatItem {
  icon?: ReactNode
  color?: string
}

const StatCard = styled.div<{ $color: string }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid var(--card-border);
  box-shadow:
    0 1px 0 rgba(255,255,255,0.06) inset,
    0 2px 8px rgba(0,0,0,0.07),
    0 1px 2px rgba(0,0,0,0.04);
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  /* Colored bottom accent bar */
  &::after {
    content: '';
    position: absolute;
    left: 16px;
    right: 16px;
    bottom: 0;
    height: 2px;
    background: ${({ $color }) => $color};
    border-radius: 2px 2px 0 0;
    opacity: 0.7;
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.06) inset,
      0 8px 24px rgba(0,0,0,0.11),
      0 2px 6px rgba(0,0,0,0.06);
  }
`

const IconWrap = styled.div<{ $color: string }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: ${({ $color }) => `${$color}18`};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 20px;
  color: ${({ $color }) => $color};
`

const StatLabel = styled.div`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 5px;
`

const StatValue = styled.div`
  font-size: clamp(16px, 3.5vw, 22px);
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.15;
`

const StatSub = styled.div`
  font-size: 11.5px;
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1.4;
`

export function SummaryStat({ title, value, subtitle, icon, color = 'var(--primary)' }: SummaryStatProps) {
  return (
    <StatCard $color={color}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <StatLabel>{title}</StatLabel>
        <StatValue>{value}</StatValue>
        {subtitle && <StatSub>{subtitle}</StatSub>}
      </div>
      {icon && <IconWrap $color={color}>{icon}</IconWrap>}
    </StatCard>
  )
}
