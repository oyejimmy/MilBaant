import { Empty, Typography } from 'antd'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Empty
      image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 4, color: 'var(--text-strong)' }}>
            {title}
          </Typography.Text>
          {description && (
            <Typography.Text style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {description}
            </Typography.Text>
          )}
        </div>
      }
    >
      {action}
    </Empty>
  )
}
