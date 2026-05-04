import { Typography } from 'antd'
import styled from 'styled-components'

const Card = styled.div<{ $color?: string }>`
  padding: 16px 20px;
  background: var(--card-bg);
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
  }
`

const Label = styled(Typography.Text)`
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`

const Value = styled(Typography.Title)<{ $color?: string }>`
  margin: 4px 0 0 0  ;
  color: ${({ $color }) => $color || 'var(--text-strong)'}  ;
  font-size: clamp(1.2rem, 3vw, 1.5rem)  ;
  font-weight: 700  ;
`

const Subtitle = styled(Typography.Text)`
  font-size: 11px;
  color: var(--text-muted);
  display: block;
  margin-top: 4px;
`

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  color?: string
  borderColor?: string
}

export function StatCard({ label, value, subtitle, color, borderColor }: StatCardProps) {
  return (
    <Card $color={borderColor}>
      <Label>{label}</Label>
      <Value level={3} $color={color}>
        {value}
      </Value>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </Card>
  )
}
