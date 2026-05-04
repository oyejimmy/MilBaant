import { Avatar, Button, Flex, Tag, Typography } from 'antd'
import { ArrowRightOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { formatCurrency } from '@/lib/formatters'

const Card = styled.div<{ $type: 'owe' | 'owed' | 'neutral' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  flex-wrap: wrap;
  border-left: 3px solid ${({ $type }) =>
    $type === 'owe' ? '#ff7875' : $type === 'owed' ? '#52c41a' : 'var(--card-border)'};
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${({ $type }) =>
      $type === 'owe' ? '#ff4d4f' : $type === 'owed' ? '#52c41a' : '#909ffa'};
  }
`

interface DebtCardProps {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
  currentUserId?: string
  onSettle?: () => void
  settling?: boolean
}

export function DebtCard({
  fromId,
  fromName,
  toId,
  toName,
  amount,
  currentUserId,
  onSettle,
  settling = false,
}: DebtCardProps) {
  const isDebtor = fromId === currentUserId
  const isCreditor = toId === currentUserId
  const type = isDebtor ? 'owe' : isCreditor ? 'owed' : 'neutral'

  return (
    <Card $type={type}>
      <Flex align="center" gap={8} wrap style={{ flex: 1, minWidth: 0 }}>
        <Avatar
          size={24}
          style={{ background: '#909ffa', color: '#fff', fontSize: 11, flexShrink: 0 }}
          icon={<UserOutlined />}
        />
        <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
          {fromName}
        </Typography.Text>
        <ArrowRightOutlined style={{ color: 'var(--text-muted)', fontSize: 11 }} />
        <Avatar
          size={24}
          style={{ background: '#52c41a', color: '#fff', fontSize: 11, flexShrink: 0 }}
          icon={<UserOutlined />}
        />
        <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
          {toName}
        </Typography.Text>
        {isDebtor && <Tag color="red" style={{ margin: 0, fontSize: 11 }}>You owe</Tag>}
        {isCreditor && <Tag color="green" style={{ margin: 0, fontSize: 11 }}>Owed to you</Tag>}
      </Flex>
      <Flex align="center" gap={8} style={{ flexShrink: 0 }}>
        <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.9rem' }}>
          {formatCurrency(amount)}
        </Typography.Text>
        {onSettle && (
          <Button
            size="small"
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={onSettle}
            loading={settling}
          >
            Settle
          </Button>
        )}
      </Flex>
    </Card>
  )
}
