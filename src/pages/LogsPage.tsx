import { useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { Input, Table, Tag, Typography } from 'antd'
import { AuditOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { useActivityLogs } from '@/hooks/useActivityLog'
import type { ActivityLog } from '@/lib/types'

const ACTION_COLOR: Record<ActivityLog['action'], string> = {
  create: 'green',
  update: 'blue',
  delete: 'red',
}

const ENTITY_COLOR: Record<string, string> = {
  expense: 'purple',
  ride: 'cyan',
  cook_advance: 'orange',
  cook_purchase: 'gold',
  settlement: 'geekblue',
  announcement: 'magenta',
}

export function LogsPage() {
  const [search, setSearch] = useState('')
  const logsQuery = useActivityLogs()
  const logs = logsQuery.data ?? []

  const filtered = search.trim()
    ? logs.filter(
        (l) =>
          l.description.toLowerCase().includes(search.toLowerCase()) ||
          l.actor?.full_name.toLowerCase().includes(search.toLowerCase()) ||
          l.entity.toLowerCase().includes(search.toLowerCase()),
      )
    : logs

  const columns: ColumnsType<ActivityLog> = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (v: string) => dayjs(v).format('DD MMM YYYY, HH:mm'),
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      defaultSortOrder: 'descend',
    },
    {
      title: 'User',
      key: 'actor',
      width: 150,
      render: (_: unknown, record: ActivityLog) => (
        <Typography.Text strong>{record.actor?.full_name ?? 'Unknown'}</Typography.Text>
      ),
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 90,
      render: (v: ActivityLog['action']) => (
        <Tag color={ACTION_COLOR[v]} style={{ textTransform: 'capitalize', fontWeight: 600 }}>
          {v}
        </Tag>
      ),
      filters: [
        { text: 'Create', value: 'create' },
        { text: 'Update', value: 'update' },
        { text: 'Delete', value: 'delete' },
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: 'Module',
      dataIndex: 'entity',
      key: 'entity',
      width: 140,
      render: (v: string) => (
        <Tag color={ENTITY_COLOR[v] ?? 'default'} style={{ textTransform: 'capitalize' }}>
          {v.replace('_', ' ')}
        </Tag>
      ),
      filters: Object.keys(ENTITY_COLOR).map((e) => ({ text: e.replace('_', ' '), value: e })),
      onFilter: (value, record) => record.entity === value,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => <Typography.Text style={{ color: 'var(--text-base)' }}>{v}</Typography.Text>,
    },
  ]

  return (
    <PageStack>
      <PageHeader
        title="Activity Logs"
        subtitle="A read-only audit trail of all actions performed in the app. Logs cannot be edited or deleted."
      />
      <SectionBlock>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <AuditOutlined style={{ fontSize: 18, color: 'var(--text-muted)' }} />
          <Input.Search
            placeholder="Search by user, module or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ maxWidth: 400 }}
          />
          <Typography.Text type="secondary" style={{ marginLeft: 'auto' }}>
            {filtered.length} entries
          </Typography.Text>
        </div>
        <QueryState isLoading={logsQuery.isLoading} error={logsQuery.error as Error | null}>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={filtered}
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: 900 }}
            size="small"
          />
        </QueryState>
      </SectionBlock>
    </PageStack>
  )
}
