import { Grid, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { MobileCard } from '@/components/Glass/index'

const { useBreakpoint } = Grid

interface ResponsiveDataTableProps<T> {
  data: T[]
  columns: ColumnsType<T>
  rowKey: string | ((record: T) => string)
  mobileRender: (record: T) => React.ReactNode
  loading?: boolean
  emptyText?: string
  pagination?: false | { pageSize: number; hideOnSinglePage?: boolean }
  onRowClick?: (record: T) => void
  scroll?: { x?: number; y?: number }
}

export function ResponsiveDataTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowKey,
  mobileRender,
  loading = false,
  emptyText = 'No data available',
  pagination = { pageSize: 10, hideOnSinglePage: true },
  onRowClick,
  scroll,
}: ResponsiveDataTableProps<T>) {
  const screens = useBreakpoint()
  const isMobile = !screens.md

  if (isMobile) {
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        {data.length === 0 && (
          <Typography.Text type="secondary">{emptyText}</Typography.Text>
        )}
        {data.map((record) => {
          const key = typeof rowKey === 'function' ? rowKey(record) : String(record[rowKey])
          return (
            <MobileCard
              key={key}
              onClick={onRowClick ? () => onRowClick(record) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {mobileRender(record)}
            </MobileCard>
          )
        })}
      </Space>
    )
  }

  return (
    <Table<T>
      rowKey={rowKey}
      columns={columns}
      dataSource={data}
      loading={loading}
      size="small"
      pagination={pagination}
      scroll={scroll}
      onRow={onRowClick ? (record) => ({
        onClick: (e) => {
          const target = e.target as HTMLElement
          if (target.closest('button') || target.closest('.ant-btn')) return
          onRowClick(record)
        },
        style: { cursor: 'pointer' },
      }) : undefined}
      locale={{ emptyText }}
    />
  )
}
