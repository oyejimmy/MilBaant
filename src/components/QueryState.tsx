import type { ReactNode } from 'react'
import { Alert, Empty, Result } from 'antd'
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
        <Result
          icon={<LoadingOutlined style={{ fontSize: 40, color: '#909ffa' }} spin />}
          title="Loading data"
        />
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
