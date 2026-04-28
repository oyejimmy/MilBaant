import type { ReactNode } from 'react'
import { Card, Space, Typography } from 'antd'
import styled from 'styled-components'
import { useMobileLayout } from '@/hooks/useResponsive'

const MobileCardContainer = styled.div`
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:active {
    transform: scale(0.98);
    background: var(--menu-hover-bg);
  }
`

const MobileCardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 24px;
`

const MobileCardLabel = styled.span`
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  min-width: 80px;
`

const MobileCardValue = styled.span<{ $strong?: boolean }>`
  font-size: 14px;
  color: ${({ $strong }) => ($strong ? 'var(--text-strong)' : 'var(--text)')};
  font-weight: ${({ $strong }) => ($strong ? 600 : 400)};
  text-align: right;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const MobileCardActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--card-border);
  margin-top: 4px;

  > * {
    flex: 1;
    min-width: 0;
  }

  .ant-btn {
    width: 100%;
  }
`

interface ResponsiveCardField {
  label: string
  value: ReactNode
  strong?: boolean
}

interface ResponsiveCardProps {
  fields: ResponsiveCardField[]
  actions?: ReactNode
  onClick?: () => void
  className?: string
}

/**
 * ResponsiveCard - Converts table rows to mobile-friendly cards
 * 
 * On mobile: Shows as a card with label-value pairs
 * On desktop: Can be used in a table or as a regular card
 */
export function ResponsiveCard({ fields, actions, onClick, className }: ResponsiveCardProps) {
  const isMobile = useMobileLayout()

  if (!isMobile) {
    // On desktop, render as a regular Ant Design card
    return (
      <Card
        size="small"
        className={className}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {fields.map((field, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                {field.label}
              </Typography.Text>
              <Typography.Text strong={field.strong} style={{ fontSize: 13 }}>
                {field.value}
              </Typography.Text>
            </div>
          ))}
          {actions && <div style={{ marginTop: 8 }}>{actions}</div>}
        </Space>
      </Card>
    )
  }

  // Mobile layout
  return (
    <MobileCardContainer onClick={onClick} className={className}>
      {fields.map((field, index) => (
        <MobileCardRow key={index}>
          <MobileCardLabel>{field.label}</MobileCardLabel>
          <MobileCardValue $strong={field.strong}>{field.value}</MobileCardValue>
        </MobileCardRow>
      ))}
      {actions && <MobileCardActions>{actions}</MobileCardActions>}
    </MobileCardContainer>
  )
}

/**
 * ResponsiveCardList - Container for multiple ResponsiveCards
 */
export const ResponsiveCardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`
