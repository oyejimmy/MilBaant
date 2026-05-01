import { Button, Tag, Typography } from 'antd'
import { DeleteOutlined, EditOutlined, FileImageOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { CATEGORY_LABELS } from '@/lib/constants'
import type { Expense } from '@/lib/types'

const CardContainer = styled.div`
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 14px 16px;
  background: var(--card-bg);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    background: var(--menu-hover-bg);
  }
`

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`

const CardTitle = styled.div`
  flex: 1;
  min-width: 0;
`

const CardAmount = styled.div<{ $color?: string }>`
  font-size: 18px;
  font-weight: 700;
  color: ${({ $color }) => $color || 'var(--text-strong)'};
  white-space: nowrap;
  flex-shrink: 0;
`

const CardRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
`

const CardLabel = styled.span`
  color: var(--text-muted);
  font-size: 12px;
`

const CardValue = styled.span`
  color: var(--text-strong);
  font-weight: 500;
  text-align: right;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--card-border);
  margin-top: 4px;

  > * {
    flex: 1;
  }

  .ant-btn {
    width: 100%;
  }
`

interface ExpenseCardProps {
  expense: Expense
  onEdit?: (expense: Expense) => void
  onDelete?: (expense: Expense) => void
  onViewBill?: (expense: Expense) => void
  showActions?: boolean
}

/**
 * ExpenseCard - Mobile-friendly card for displaying expense details
 * 
 * Replaces table rows on mobile with a touch-friendly card layout
 */
export function ExpenseCard({
  expense,
  onEdit,
  onDelete,
  onViewBill,
  showActions = true,
}: ExpenseCardProps) {
  const categoryLabel = CATEGORY_LABELS[expense.category] || expense.category
  const isWeekend = expense.category === 'weekend_meal'

  return (
    <CardContainer>
      <CardHeader>
        <CardTitle>
          <Typography.Text
            strong
            style={{
              fontSize: 15,
              color: 'var(--text-strong)',
              display: 'block',
              marginBottom: 4,
            }}
          >
            {expense.description}
          </Typography.Text>
          <Tag color={isWeekend ? 'orange' : 'blue'} style={{ fontSize: 11 }}>
            {categoryLabel}
          </Tag>
        </CardTitle>
        <CardAmount $color={isWeekend ? 'var(--warning)' : 'var(--primary)'}>
          {formatCurrency(expense.amount)}
        </CardAmount>
      </CardHeader>

      <CardRow>
        <CardLabel>Paid by</CardLabel>
        <CardValue>{expense.creator?.full_name || 'Unknown'}</CardValue>
      </CardRow>

      <CardRow>
        <CardLabel>Date</CardLabel>
        <CardValue>{formatDate(expense.date)}</CardValue>
      </CardRow>

      {isWeekend && expense.expense_participants && expense.expense_participants.length > 0 && (
        <CardRow>
          <CardLabel>Participants</CardLabel>
          <CardValue>
            {expense.expense_participants.length} member{expense.expense_participants.length !== 1 ? 's' : ''}
          </CardValue>
        </CardRow>
      )}

      {expense.bill_image_url && (
        <CardRow>
          <CardLabel>Bill</CardLabel>
          <Button
            type="link"
            size="small"
            icon={<FileImageOutlined />}
            onClick={() => onViewBill?.(expense)}
            style={{ padding: 0, height: 'auto', fontSize: 12 }}
          >
            View Image
          </Button>
        </CardRow>
      )}

      {showActions && (onEdit || onDelete) && (
        <CardActions>
          {onEdit && (
            <Button
              icon={<EditOutlined />}
              onClick={() => onEdit(expense)}
              size="middle"
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              icon={<DeleteOutlined />}
              onClick={() => onDelete(expense)}
              danger
              size="middle"
            >
              Delete
            </Button>
          )}
        </CardActions>
      )}
    </CardContainer>
  )
}
