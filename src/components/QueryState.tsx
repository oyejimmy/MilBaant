import type { ReactNode } from 'react'
import { Alert, Empty } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { SectionBlock } from '@/components/Glass'

export function QueryState({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'Nothing to show yet.',
  children,
}: {
  isLoading: boolean
  error: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <SectionBlock>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '300px',
          gap: '16px'
        }}>
          <LoadingOutlined style={{ fontSize: 48, color: 'var(--primary)' }} spin />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading data...</span>
        </div>
      </SectionBlock>
    )
  }

  if (error) {
    return (
      <SectionBlock>
        <Alert
          type="error"
          showIcon
          message="Something went wrong"
          description={error.message}
        />
      </SectionBlock>
    )
  }

  if (isEmpty) {
    return (
      <SectionBlock>
        <Empty description={emptyMessage} />
      </SectionBlock>
    )
  }

  return <>{children}</>
}
