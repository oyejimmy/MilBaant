import { useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import {
  Alert,
  Avatar,
  Button,
  Checkbox,
  DatePicker,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ArrowRightOutlined,
  AuditOutlined,
  CalendarOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  DollarOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock, MobileCard, MobileRow, MobileLabel, ResponsiveGrid } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAuth } from '@/hooks/useAuth'
import { useRides, useCreateRide, useDeleteRide } from '@/hooks/useRides'
import { useProfiles } from '@/hooks/useProfiles'
import { RIDE_SERVICES } from '@/lib/constants'
import { formatCurrency, formatDate, formatDateTime, formatMonthYear } from '@/lib/formatters'
import type { CreateRideInput, Ride } from '@/lib/types'

const { useBreakpoint } = Grid

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const DebtCard = styled.div<{ $type: 'owe' | 'owed' | 'neutral' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  flex-wrap: wrap;
  border-left: 3px solid ${({ $type }) =>
    $type === 'owe' ? '#ff7875' : $type === 'owed' ? '#52c41a' : 'var(--card-border)'};
`

const RiderChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 5px;
  background: rgba(144, 159, 250, 0.1);
  border: 1px solid rgba(144, 159, 250, 0.2);
  font-size: 0.72rem;
  color: var(--text-strong);
`

/* ─── Debt helpers ────────────────────────────────────────────────────────── */

interface DebtEntry {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}

function buildRideDebts(rides: Ride[]): DebtEntry[] {
  // net[debtor][creditor] = amount debtor owes creditor
  const net = new Map<string, Map<string, number>>()

  for (const ride of rides) {
    const riderCount = ride.ride_riders.length
    if (riderCount === 0) continue
    const share = ride.amount / riderCount

    for (const rider of ride.ride_riders) {
      if (rider.user_id === ride.paid_by) continue
      const debtor = rider.user_id
      const creditor = ride.paid_by
      if (!net.has(debtor)) net.set(debtor, new Map())
      const row = net.get(debtor)!
      row.set(creditor, (row.get(creditor) ?? 0) + share)
    }
  }

  // Simplify pairs
  const result: DebtEntry[] = []
  const visited = new Set<string>()

  const profileMap = new Map<string, string>()
  for (const ride of rides) {
    if (ride.payer) profileMap.set(ride.payer.id, ride.payer.full_name)
    for (const r of ride.ride_riders) {
      if (r.profile) profileMap.set(r.profile.id, r.profile.full_name)
    }
  }

  for (const [fromId, toMap] of net) {
    for (const [toId, amount] of toMap) {
      const key = [fromId, toId].sort().join('|')
      if (visited.has(key)) continue
      visited.add(key)

      const reverse = net.get(toId)?.get(fromId) ?? 0
      const net_ = amount - reverse
      if (Math.abs(net_) < 0.01) continue

      const [debtorId, creditorId, netAmt] =
        net_ > 0 ? [fromId, toId, net_] : [toId, fromId, -net_]

      result.push({
        fromId: debtorId,
        fromName: profileMap.get(debtorId) ?? debtorId,
        toId: creditorId,
        toName: profileMap.get(creditorId) ?? creditorId,
        amount: netAmt,
      })
    }
  }

  return result.sort((a, b) => b.amount - a.amount)
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function RidesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [addOpen, setAddOpen] = useState(false)
  const [viewRide, setViewRide] = useState<Ride | null>(null)

  const { userId } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const ridesQuery = useRides(selectedMonth)
  const profilesQuery = useProfiles()
  const createRide = useCreateRide()
  const deleteRide = useDeleteRide()

  const profiles = profilesQuery.data ?? []
  const rides = ridesQuery.data ?? []

  const totalSpend = rides.reduce((s, r) => s + r.amount, 0)
  const totalRides = rides.length
  const uniqueRiders = new Set(rides.flatMap((r) => r.ride_riders.map((rr) => rr.user_id))).size

  const debts = useMemo(() => buildRideDebts(rides), [rides])

  /* ── Per-person monthly summary ── */
  const riderSummary = useMemo(() => {
    const map = new Map<string, { name: string; totalShare: number; rideCount: number }>()
    for (const ride of rides) {
      const share = ride.ride_riders.length > 0 ? ride.amount / ride.ride_riders.length : 0
      for (const rr of ride.ride_riders) {
        const name = rr.profile?.full_name ?? rr.user_id
        const existing = map.get(rr.user_id) ?? { name, totalShare: 0, rideCount: 0 }
        map.set(rr.user_id, {
          name,
          totalShare: existing.totalShare + share,
          rideCount: existing.rideCount + 1,
        })
      }
    }
    return [...map.entries()].map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.totalShare - a.totalShare)
  }, [rides])

  /* ── Handlers ── */

  async function handleCreate(input: CreateRideInput) {
    try {
      await createRide.mutateAsync(input)
      message.success('Ride added.')
      setAddOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save ride.')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteRide.mutateAsync({ id, userId: userId ?? '' })
      message.success('Ride deleted.')
      if (viewRide?.id === id) setViewRide(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  /* ── Table columns ── */

  const columns: ColumnsType<Ride> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Service',
      dataIndex: 'service',
      key: 'service',
      width: 100,
      render: (v: string) => <Tag color="geekblue">{v}</Tag>,
    },
    {
      title: 'Route',
      dataIndex: 'route',
      key: 'route',
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <Flex align="center" gap={4}>
            <CarOutlined style={{ color: 'var(--text-muted)', fontSize: 12 }} />
            <Typography.Text style={{ fontSize: '0.85rem' }}>{v}</Typography.Text>
          </Flex>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Paid By',
      key: 'paidBy',
      width: 120,
      render: (_: unknown, r: Ride) => (
        <Tag color="purple">{r.payer?.full_name ?? '—'}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 110,
      render: (v: number) => <Typography.Text strong>{formatCurrency(v)}</Typography.Text>,
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Share / Rider',
      key: 'share',
      width: 120,
      render: (_: unknown, r: Ride) =>
        r.ride_riders.length > 0
          ? formatCurrency(r.amount / r.ride_riders.length)
          : '—',
    },
    {
      title: 'Riders',
      key: 'riders',
      responsive: ['md'] as ('md')[],
      render: (_: unknown, r: Ride) => (
        <Flex wrap gap={4}>
          {r.ride_riders.map((rr) => (
            <RiderChip key={rr.user_id}>
              <UserOutlined style={{ fontSize: 10 }} />
              {rr.profile?.full_name ?? '?'}
            </RiderChip>
          ))}
        </Flex>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: unknown, r: Ride) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); setViewRide(r) }}
          />
          {!!userId && (
            <Popconfirm
              title="Delete this ride?"
              onConfirm={() => void handleDelete(r.id)}
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const summaryColumns: ColumnsType<typeof riderSummary[0]> = [
    {
      title: 'Flatmate',
      dataIndex: 'name',
      key: 'name',
      render: (v: string) => (
        <Flex align="center" gap={8}>
          <Avatar size={24} style={{ background: '#909ffa', color: '#fff', fontSize: 11 }} icon={<UserOutlined />} />
          <Typography.Text style={{ color: 'var(--text-strong)' }}>{v}</Typography.Text>
        </Flex>
      ),
    },
    {
      title: 'Rides',
      dataIndex: 'rideCount',
      key: 'rideCount',
      width: 80,
      render: (v: number) => <Tag>{v}</Tag>,
    },
    {
      title: 'Total Share',
      dataIndex: 'totalShare',
      key: 'totalShare',
      render: (v: number) => (
        <Typography.Text strong style={{ color: '#909ffa' }}>
          {formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.totalShare - b.totalShare,
    },
  ]

  const isLoading = ridesQuery.isLoading || profilesQuery.isLoading
  const error = (ridesQuery.error as Error | null) ?? (profilesQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Rides"
        subtitle={`Shared taxi rides for ${formatMonthYear(selectedMonth)} — Yango, InDriver, and more. One person pays, everyone splits.`}
        breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Rides' }]}
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(v) => v && setSelectedMonth(v.startOf('month'))}
            />
            {!!userId && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddOpen(true)}
              >
                Add Ride
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Stats */}
        <ResponsiveGrid>
          <SummaryStat title="Total Spend"    value={formatCurrency(totalSpend)} subtitle="All rides this month."        icon={<CarOutlined />}    color="var(--primary)" />
          <SummaryStat title="Total Rides"    value={totalRides}                 subtitle="Number of shared rides."      icon={<AuditOutlined />}  color="#7c3aed" />
          <SummaryStat title="Unique Riders"  value={uniqueRiders}               subtitle="Distinct flatmates who rode." icon={<TeamOutlined />}   color="#059669" />
        </ResponsiveGrid>

        {/* Rides table */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 10px', color: 'var(--text-strong)' }}>
            All Rides
          </Typography.Title>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {rides.length === 0 && <Typography.Text type="secondary">No rides recorded for this month.</Typography.Text>}
              {rides.map((r) => (
                <MobileCard key={r.id} onClick={() => setViewRide(r)}>
                  <MobileRow>
                    <Flex gap={6} align="center">
                      <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>{r.service}</Tag>
                      <MobileLabel>{formatDate(r.date)}</MobileLabel>
                    </Flex>
                    <Typography.Text strong style={{ color: 'var(--text-strong)' }}>{formatCurrency(r.amount)}</Typography.Text>
                  </MobileRow>
                  {r.route && (
                    <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      <CarOutlined style={{ marginRight: 4 }} />{r.route}
                    </Typography.Text>
                  )}
                  <MobileRow>
                    <Flex gap={4} wrap>
                      <Tag color="purple" style={{ margin: 0, fontSize: 11 }}>{r.payer?.full_name ?? '—'} paid</Tag>
                      {r.ride_riders.slice(0, 2).map((rr) => (
                        <RiderChip key={rr.user_id}>{rr.profile?.full_name ?? '?'}</RiderChip>
                      ))}
                      {r.ride_riders.length > 2 && <RiderChip>+{r.ride_riders.length - 2}</RiderChip>}
                    </Flex>
                    <Flex gap={4} align="center" onClick={(e) => e.stopPropagation()}>
                      {!!userId && (
                        <Popconfirm title="Delete this ride?" onConfirm={() => void handleDelete(r.id)}>
                          <Button size="small" danger icon={<DeleteOutlined />} />
                        </Popconfirm>
                      )}
                    </Flex>
                  </MobileRow>
                  <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Share/rider: {r.ride_riders.length > 0 ? formatCurrency(r.amount / r.ride_riders.length) : '—'}
                  </Typography.Text>
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table<Ride>
              rowKey="id"
              columns={columns}
              dataSource={rides}
              size="small"
              pagination={{ pageSize: 10, hideOnSinglePage: true, size: 'small' }}
              scroll={{ x: 600 }}
              onRow={(record) => ({
                onClick: (e) => { const t = e.target as HTMLElement; if (t.closest('button') || t.closest('.ant-btn')) return; setViewRide(record) },
                style: { cursor: 'pointer' },
              })}
              locale={{ emptyText: 'No rides recorded for this month.' }}
            />
          )}
        </SectionBlock>

        {/* Per-person summary */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 10px', color: 'var(--text-strong)' }}>
            Monthly Share per Rider
          </Typography.Title>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {riderSummary.length === 0 && <Typography.Text type="secondary">No data yet.</Typography.Text>}
              {riderSummary.map((row) => (
                <MobileCard key={row.id} style={{ cursor: 'default' }}>
                  <MobileRow>
                    <Flex align="center" gap={8}>
                      <Avatar size={22} style={{ background: '#909ffa', color: '#fff', fontSize: 10 }} icon={<UserOutlined />} />
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>{row.name}</Typography.Text>
                    </Flex>
                    <Typography.Text strong style={{ color: '#909ffa' }}>{formatCurrency(row.totalShare)}</Typography.Text>
                  </MobileRow>
                  <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.rideCount} ride{row.rideCount !== 1 ? 's' : ''}</Typography.Text>
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={riderSummary}
              columns={summaryColumns}
              locale={{ emptyText: 'No data yet.' }}
            />
          )}
        </SectionBlock>

        {/* Who owes whom */}
        <SectionBlock>
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 14 }}>
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              Who Owes Whom
            </Typography.Title>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Net debts from ride splits. Green = owed to you · Red = you owe.
            </Typography.Text>
          </Space>

          {debts.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="All settled up — no outstanding ride debts this month."
            />
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {debts.map((d) => {
                const isDebtor = d.fromId === userId
                const isCreditor = d.toId === userId
                const type = isDebtor ? 'owe' : isCreditor ? 'owed' : 'neutral'

                return (
                  <DebtCard key={`${d.fromId}-${d.toId}`} $type={type}>
                    <Flex align="center" gap={8} wrap>
                      <Avatar size={22} style={{ background: '#909ffa', color: '#fff', fontSize: 10 }} icon={<UserOutlined />} />
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
                        {d.fromName}
                      </Typography.Text>
                      <ArrowRightOutlined style={{ color: 'var(--text-muted)', fontSize: 11 }} />
                      <Avatar size={22} style={{ background: '#52c41a', color: '#fff', fontSize: 10 }} icon={<UserOutlined />} />
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
                        {d.toName}
                      </Typography.Text>
                      {isDebtor && <Tag color="red" style={{ margin: 0 }}>You owe</Tag>}
                      {isCreditor && <Tag color="green" style={{ margin: 0 }}>Owed to you</Tag>}
                    </Flex>
                    <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                      {formatCurrency(d.amount)}
                    </Typography.Text>
                  </DebtCard>
                )
              })}
            </Space>
          )}
        </SectionBlock>
      </QueryState>

      {/* Add ride modal */}
      {addOpen && (
        <AddRideModal
          profiles={profiles}
          userId={userId ?? ''}
          submitting={createRide.isPending}
          onClose={() => setAddOpen(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* Detail modal */}
      {viewRide && (
        <RideDetailModal
          ride={viewRide}
          onClose={() => setViewRide(null)}
          onDelete={!!userId ? handleDelete : undefined}
          deleting={deleteRide.isPending}
        />
      )}
    </PageStack>
  )
}

/* ─── Add Ride Modal ──────────────────────────────────────────────────────── */

interface RideFormValues {
  date: Dayjs
  service: string
  route: string
  amount: number
  paidBy: string
  note: string
  riderIds: string[]
}

// ── Shared modal styled components ────────────────────────────────────────
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
`

const HeaderIcon = styled.div<{ $gradient: string; $shadow: string }>`
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: ${({ $gradient }) => $gradient};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: ${({ $shadow }) => $shadow};
  .anticon { color: white; font-size: 18px; }
`

const FormBody = styled.div`
  padding: 16px 24px 0;
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) { grid-template-columns: 1fr; }
`

const ModalDivider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 14px 0;
`

const ModalSectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  .anticon { color: var(--primary); font-size: 13px; }
`

// Rider chip for the participant selector
const RiderChipLabel = styled.label<{ $checked: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 10px;
  border: 1.5px solid ${({ $checked }) => ($checked ? 'var(--primary)' : 'var(--border-light)')};
  background: ${({ $checked }) => ($checked ? 'var(--primary-soft)' : 'var(--bg-elevated)')};
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
  &:hover { border-color: var(--primary); background: var(--primary-soft); }
`

const RiderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 8px;
`

function AddRideModal({
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: {
  profiles: { id: string; full_name: string }[]
  userId: string
  submitting: boolean
  onClose: () => void
  onSubmit: (input: CreateRideInput) => Promise<void>
}) {
  const [form] = Form.useForm<RideFormValues>()
  const riderIds: string[] = Form.useWatch('riderIds', form) ?? []

  const profileOptions = profiles.map((p) => ({ label: p.full_name, value: p.id }))

  function toggleRider(id: string, checked: boolean) {
    const current: string[] = form.getFieldValue('riderIds') ?? []
    form.setFieldValue('riderIds', checked ? [...current, id] : current.filter((x) => x !== id))
  }

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit({
      date: values.date.format('YYYY-MM-DD'),
      service: values.service,
      route: values.route,
      amount: values.amount,
      paidBy: values.paidBy,
      note: values.note,
      riderIds: values.riderIds,
      createdBy: userId,
    })
    form.resetFields()
  }

  return (
    <Modal
      open
      title={null}
      okText="Save Ride"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(520px, 95vw)"
      style={{ top: 24 }}
      styles={{
        body: { padding: 0, maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' },
        footer: { padding: '12px 24px 20px', borderTop: '1px solid var(--border-light)', margin: 0 },
      }}
      okButtonProps={{ size: 'large' }}
      cancelButtonProps={{ size: 'large' }}
    >
      {/* Header */}
      <ModalHeader>
        <HeaderIcon
          $gradient="linear-gradient(135deg, #4527a0 0%, #909ffa 100%)"
          $shadow="0 4px 12px rgba(69,39,160,0.35)"
        >
          <CarOutlined />
        </HeaderIcon>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            Add Ride
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Log a shared taxi ride and split the fare
          </Typography.Text>
        </div>
      </ModalHeader>

      <FormBody>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ date: dayjs(), service: 'Yango', paidBy: userId, riderIds: [userId] }}
        >
          {/* Section: Ride Info */}
          <ModalSectionLabel>
            <CarOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ride Details
            </Typography.Text>
          </ModalSectionLabel>

          <TwoCol>
            <Form.Item label="Date" name="date" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>
            <Form.Item label="Service" name="service" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
              <Select options={RIDE_SERVICES.map((s) => ({ label: s, value: s }))} />
            </Form.Item>
          </TwoCol>

          <Form.Item label="Route (optional)" name="route" style={{ marginBottom: 12 }}>
            <Input placeholder="e.g. Home → Mall of Lahore" prefix={<CarOutlined style={{ color: 'var(--text-muted)' }} />} />
          </Form.Item>

          <TwoCol>
            <Form.Item label="Total Fare (PKR)" name="amount" rules={[{ required: true, message: 'Enter fare.' }]} style={{ marginBottom: 12 }}>
              <InputNumber min={1} precision={2} style={{ width: '100%' }} placeholder="350" prefix={<DollarOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>
            <Form.Item label="Paid By" name="paidBy" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
              <Select options={profileOptions} />
            </Form.Item>
          </TwoCol>

          {/* Section: Riders */}
          <ModalDivider />
          <ModalSectionLabel>
            <TeamOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Riders
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {riderIds.length} / {profiles.length} selected
            </Typography.Text>
          </ModalSectionLabel>

          <Form.Item
            name="riderIds"
            rules={[{ validator: async (_, v: string[]) => { if (!v?.length) throw new Error('Select at least one rider.') } }]}
            style={{ marginBottom: 12 }}
          >
            <RiderGrid>
              {profiles.map((p) => {
                const checked = riderIds.includes(p.id)
                const initials = p.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <RiderChipLabel key={p.id} $checked={checked} onClick={() => toggleRider(p.id, !checked)}>
                    <Avatar size={22} style={{ background: checked ? 'var(--primary)' : 'var(--border-default)', color: 'white', fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
                      {initials}
                    </Avatar>
                    <Typography.Text style={{ fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? 'var(--primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.full_name}
                    </Typography.Text>
                    <Checkbox checked={checked} style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </RiderChipLabel>
                )
              })}
            </RiderGrid>
          </Form.Item>

          {/* Note */}
          <ModalDivider />
          <Form.Item label="Note (optional)" name="note" style={{ marginBottom: 16 }}>
            <Input.TextArea rows={2} placeholder="e.g. Late night ride back from dinner" style={{ resize: 'none' }} />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  )
}

/* ─── Ride Detail Modal ───────────────────────────────────────────────────── */

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 4px;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const InfoBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`

const InfoRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const InfoLabel = styled.span`
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
`

const InfoValue = styled.span`
  font-size: 0.88rem;
  color: var(--text-strong);
  font-weight: 500;
`

const RiderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
`

const RidersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 200px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 3px; }
`

function RideDetailModal({
  ride,
  onClose,
  onDelete,
  deleting,
}: {
  ride: Ride
  onClose: () => void
  onDelete?: (id: string) => Promise<void>
  deleting: boolean
}) {
  const sharePerRider = ride.ride_riders.length > 0 ? ride.amount / ride.ride_riders.length : 0

  return (
    <Modal
      open
      onCancel={onClose}
      title={
        <Flex align="center" gap={8}>
          <CarOutlined style={{ color: '#909ffa' }} />
          <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.95rem' }}>
            Ride Details
          </Typography.Text>
          <Tag color="geekblue" style={{ margin: 0 }}>{ride.service}</Tag>
          {ride.payer && <Tag color="purple" style={{ margin: 0 }}>{ride.payer.full_name} paid</Tag>}
        </Flex>
      }
      footer={
        <Flex justify={onDelete ? 'space-between' : 'flex-end'} align="center">
          {onDelete && (
            <Popconfirm title="Delete this ride?" onConfirm={() => void onDelete(ride.id)}>
              <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>Delete</Button>
            </Popconfirm>
          )}
          <Button size="small" onClick={onClose}>Close</Button>
        </Flex>
      }
      width="min(460px, 95vw)"
      styles={{ body: { padding: '12px 16px 4px' } }}
    >
      <ModalGrid>
        {/* Left */}
        <InfoBlock>
          <InfoRow>
            <InfoLabel>Date</InfoLabel>
            <InfoValue>{formatDate(ride.date)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Total Fare</InfoLabel>
            <InfoValue style={{ color: '#909ffa', fontSize: '1rem', fontWeight: 700 }}>
              {formatCurrency(ride.amount)}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Share / Rider</InfoLabel>
            <InfoValue>{formatCurrency(sharePerRider)}</InfoValue>
          </InfoRow>
          {ride.route && (
            <InfoRow>
              <InfoLabel>Route</InfoLabel>
              <InfoValue>{ride.route}</InfoValue>
            </InfoRow>
          )}
          {ride.note && (
            <InfoRow>
              <InfoLabel>Note</InfoLabel>
              <InfoValue style={{ fontWeight: 400 }}>{ride.note}</InfoValue>
            </InfoRow>
          )}
          <InfoRow>
            <InfoLabel>Recorded</InfoLabel>
            <InfoValue style={{ fontSize: '0.76rem', fontWeight: 400 }}>
              {formatDateTime(ride.created_at)}
            </InfoValue>
          </InfoRow>
        </InfoBlock>

        {/* Right: riders */}
        <InfoBlock>
          <InfoRow>
            <InfoLabel>Riders ({ride.ride_riders.length})</InfoLabel>
          </InfoRow>
          {ride.ride_riders.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: '0.82rem' }}>
              No riders recorded.
            </Typography.Text>
          ) : (
            <RidersList>
              {ride.ride_riders.map((rr) => (
                <RiderRow key={rr.user_id}>
                  <Flex align="center" gap={6}>
                    <Avatar size={20} style={{ background: '#909ffa', color: '#fff', fontSize: 10 }} icon={<UserOutlined />} />
                    <Typography.Text style={{ fontSize: '0.8rem', color: 'var(--text-strong)' }}>
                      {rr.profile?.full_name ?? '?'}
                      {rr.user_id === ride.paid_by && (
                        <Tag color="purple" style={{ marginLeft: 6, fontSize: '0.68rem', padding: '0 4px' }}>paid</Tag>
                      )}
                    </Typography.Text>
                  </Flex>
                  <Typography.Text style={{ fontSize: '0.8rem', color: '#909ffa', fontWeight: 600 }}>
                    {formatCurrency(sharePerRider)}
                  </Typography.Text>
                </RiderRow>
              ))}
            </RidersList>
          )}
        </InfoBlock>
      </ModalGrid>
    </Modal>
  )
}
