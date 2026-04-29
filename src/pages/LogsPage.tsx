import { useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { Avatar, Input, Select, Table, Tag, Typography } from 'antd'
import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, ResponsiveGrid } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useActivityLogs } from '@/hooks/useActivityLog'
import type { ActivityLog } from '@/lib/types'

/* ─── Constants ───────────────────────────────────────────────────────────── */

const ACTION_META: Record<ActivityLog['action'], { color: string; icon: React.ReactNode; label: string }> = {
  create: { color: 'var(--success)', icon: <PlusCircleOutlined />, label: 'Created' },
  update: { color: 'var(--primary)', icon: <EditOutlined />,       label: 'Updated' },
  delete: { color: 'var(--error)',   icon: <DeleteOutlined />,     label: 'Deleted'  },
}

const ENTITY_LABELS: Record<string, string> = {
  expense:       'Expense',
  ride:          'Ride',
  cook_advance:  'Cook Advance',
  cook_purchase: 'Cook Purchase',
  settlement:    'Settlement',
  announcement:  'Announcement',
}

const ENTITY_TAG_COLOR: Record<string, string> = {
  expense:       'purple',
  ride:          'cyan',
  cook_advance:  'orange',
  cook_purchase: 'gold',
  settlement:    'geekblue',
  announcement:  'magenta',
}

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const SearchInput = styled(Input)`
  height: 32px  ;
  border-radius: 8px  ;
  background: transparent  ;
  border: 1px solid var(--border-default)  ;
  box-shadow: none  ;

  .ant-input {
    background: transparent  ;
    font-size: 13px  ;
  }

  &:hover {
    border-color: var(--text-secondary)  ;
  }

  &:focus-within {
    border-color: var(--primary)  ;
    box-shadow: none  ;
  }
`

const ActionCell = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color }) => $color};
`

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function LogsPage() {
  const [search, setSearch]             = useState('')
  const [actionFilter, setActionFilter] = useState<string | null>(null)
  const [entityFilter, setEntityFilter] = useState<string | null>(null)

  const logsQuery = useActivityLogs()
  const logs = logsQuery.data ?? []

  const filtered = logs.filter((l) => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      l.description.toLowerCase().includes(q) ||
      (l.actor?.full_name ?? '').toLowerCase().includes(q) ||
      l.entity.toLowerCase().includes(q)
    const matchAction = !actionFilter || l.action === actionFilter
    const matchEntity = !entityFilter || l.entity === entityFilter
    return matchSearch && matchAction && matchEntity
  })

  // Stats
  const createCount = logs.filter((l) => l.action === 'create').length
  const updateCount = logs.filter((l) => l.action === 'update').length
  const deleteCount = logs.filter((l) => l.action === 'delete').length

  const columns: ColumnsType<ActivityLog> = [
    {
      title: 'Time',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      sorter: (a, b) => a.created_at.localeCompare(b.created_at),
      defaultSortOrder: 'descend',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {dayjs(v).format('DD MMM YYYY, HH:mm')}
        </Typography.Text>
      ),
    },
    {
      title: 'User',
      key: 'actor',
      width: 140,
      render: (_: unknown, record: ActivityLog) => {
        const name = record.actor?.full_name ?? 'Unknown'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Avatar
              size={22}
              style={{ background: 'var(--primary)', color: '#fff', fontSize: 10, flexShrink: 0 }}
              icon={<UserOutlined />}
            />
            <Typography.Text strong style={{ fontSize: 12 }}>{name}</Typography.Text>
          </div>
        )
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      filters: [
        { text: 'Created', value: 'create' },
        { text: 'Updated', value: 'update' },
        { text: 'Deleted', value: 'delete' },
      ],
      onFilter: (value, record) => record.action === value,
      render: (v: ActivityLog['action']) => {
        const meta = ACTION_META[v]
        return (
          <ActionCell $color={meta.color}>
            {meta.icon}
            {meta.label}
          </ActionCell>
        )
      },
    },
    {
      title: 'Module',
      dataIndex: 'entity',
      key: 'entity',
      width: 130,
      filters: Object.entries(ENTITY_LABELS).map(([v, l]) => ({ text: l, value: v })),
      onFilter: (value, record) => record.entity === value,
      render: (v: string) => (
        <Tag
          color={ENTITY_TAG_COLOR[v] ?? 'default'}
          style={{ margin: 0, fontSize: 11, textTransform: 'capitalize' }}
        >
          {(ENTITY_LABELS[v] ?? v).replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (v: string) => (
        <Typography.Text style={{ fontSize: 13, color: 'var(--text-strong)' }}>{v}</Typography.Text>
      ),
    },
  ]

  return (
    <PageStack>
      <PageHeader
        title="Activity Logs"
        subtitle="A read-only audit trail of all actions performed in the app. Logs cannot be edited or deleted."
        breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Community' }, { title: 'Activity Logs' }]}
      />

      <QueryState isLoading={logsQuery.isLoading} error={logsQuery.error as Error | null}>

        {/* Stats */}
        <ResponsiveGrid style={{ marginBottom: 16 }}>
          <SummaryStat
            title="Created"
            value={createCount}
            subtitle="Records added"
            icon={<PlusCircleOutlined />}
            color="var(--success)"
          />
          <SummaryStat
            title="Updated"
            value={updateCount}
            subtitle="Records modified"
            icon={<EditOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Deleted"
            value={deleteCount}
            subtitle="Records removed"
            icon={<DeleteOutlined />}
            color="var(--error)"
          />
        </ResponsiveGrid>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchInput
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)', fontSize: 12 }} />}
            placeholder="Search user, module or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            allowClear
            style={{ flex: 1, minWidth: 180, maxWidth: 340 }}
          />
          <Select
            placeholder="Action"
            allowClear
            value={actionFilter}
            onChange={(v) => setActionFilter(v ?? null)}
            style={{ width: 120, height: 32 }}
            options={[
              { label: 'Created', value: 'create' },
              { label: 'Updated', value: 'update' },
              { label: 'Deleted', value: 'delete' },
            ]}
          />
          <Select
            placeholder="Module"
            allowClear
            value={entityFilter}
            onChange={(v) => setEntityFilter(v ?? null)}
            style={{ width: 150, height: 32 }}
            options={Object.entries(ENTITY_LABELS).map(([v, l]) => ({ label: l, value: v }))}
          />
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
            {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
          </Typography.Text>
        </div>

        {/* Table */}
        <Table<ActivityLog>
          rowKey="id"
          columns={columns}
          dataSource={filtered}
          size="small"
          scroll={{ x: 700 }}
          pagination={{
            pageSize: 25,
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
            size: 'small',
          }}
          locale={{ emptyText: (
            <div style={{ padding: '32px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <AuditOutlined style={{ fontSize: 32, color: 'var(--text-muted)', opacity: 0.4 }} />
              <Typography.Text style={{ color: 'var(--text-muted)' }}>No logs match your filters.</Typography.Text>
            </div>
          )}}
        />
      </QueryState>
    </PageStack>
  )
}
