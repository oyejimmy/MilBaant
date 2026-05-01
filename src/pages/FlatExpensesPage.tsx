import { useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import html2canvas from 'html2canvas'
import {
  Alert,
  Avatar,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  DeleteOutlined,
  DollarCircleOutlined,
  FileExcelOutlined,
  MinusCircleOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  UserOutlined,
  WalletOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock, MobileCard, MobileRow, MobileLabel } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAuth } from '@/hooks/useAuth'
import { useProfiles } from '@/hooks/useProfiles'
import {
  useCreateFlatFundAllocation,
  useCreateFlatFundExpense,
  useDeleteFlatFundAllocation,
  useDeleteFlatFundExpense,
  useFlatFundAllocations,
  useFlatFundExpenses,
} from '@/hooks/useFlatFund'
import {
  FLAT_FUND_CATEGORY_COLORS,
  FLAT_FUND_CATEGORY_LABELS,
  FLAT_FUND_CATEGORY_OPTIONS,
} from '@/lib/constants'
import { exportFlatExpensesToExcel } from '@/lib/export'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type {
  CreateFlatFundAllocationInput,
  CreateFlatFundExpenseInput,
  FlatFundAllocation,
  FlatFundExpense,
  FlatFundMemberSummary,
} from '@/lib/types'

const { useBreakpoint } = Grid

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const MemberBalanceCard = styled.div<{ $status: 'surplus' | 'deficit' | 'zero' }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  border-left: 4px solid ${({ $status }) =>
    $status === 'surplus' ? '#52c41a' : $status === 'deficit' ? '#ff4d4f' : '#909ffa'};
`

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
  .anticon {
    color: white;
    font-size: 18px;
  }
`

const FormBody = styled.div`
  padding: 16px 24px 0;
`

const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  .anticon {
    color: var(--primary);
    font-size: 13px;
  }
`

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function buildMemberSummaries(
  allocations: FlatFundAllocation[],
  expenses: FlatFundExpense[],
  profiles: Array<{ id: string; full_name: string }>,
): FlatFundMemberSummary[] {
  const map = new Map<string, FlatFundMemberSummary>()

  for (const p of profiles) {
    map.set(p.id, { userId: p.id, fullName: p.full_name, totalAllocated: 0, totalSpent: 0, balance: 0 })
  }

  for (const a of allocations) {
    const existing = map.get(a.user_id)
    if (existing) {
      existing.totalAllocated += a.amount
    } else {
      map.set(a.user_id, {
        userId: a.user_id,
        fullName: a.member?.full_name ?? a.user_id,
        totalAllocated: a.amount,
        totalSpent: 0,
        balance: 0,
      })
    }
  }

  for (const e of expenses) {
    const existing = map.get(e.user_id)
    if (existing) {
      existing.totalSpent += e.amount
    }
  }

  for (const s of map.values()) {
    s.balance = s.totalAllocated - s.totalSpent
  }

  return [...map.values()]
    .filter((s) => s.totalAllocated > 0 || s.totalSpent > 0)
    .sort((a, b) => b.totalAllocated - a.totalAllocated)
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function FlatExpensesPage() {
  const [allocateOpen, setAllocateOpen] = useState(false)
  const [expenseOpen, setExpenseOpen] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const { userId, isAdmin } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md

  const profilesQuery = useProfiles()
  const allocationsQuery = useFlatFundAllocations()
  const expensesQuery = useFlatFundExpenses()
  const createAllocation = useCreateFlatFundAllocation()
  const createExpense = useCreateFlatFundExpense()
  const deleteAllocation = useDeleteFlatFundAllocation()
  const deleteExpense = useDeleteFlatFundExpense()

  const profiles = profilesQuery.data ?? []
  const allocations = allocationsQuery.data ?? []
  const expenses = expensesQuery.data ?? []

  const summaries = useMemo(
    () => buildMemberSummaries(allocations, expenses, profiles),
    [allocations, expenses, profiles],
  )

  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0)
  const totalSpent = expenses.reduce((s, e) => s + e.amount, 0)
  const totalBalance = totalAllocated - totalSpent

  /* ── Handlers ── */

  async function handleCreateAllocation(input: CreateFlatFundAllocationInput) {
    try {
      await createAllocation.mutateAsync(input)
      message.success('Allocation recorded.')
      setAllocateOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save.')
    }
  }

  async function handleCreateExpense(input: CreateFlatFundExpenseInput) {
    try {
      await createExpense.mutateAsync(input)
      message.success('Expense logged.')
      setExpenseOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save.')
    }
  }

  async function handleDeleteAllocation(id: string) {
    try {
      await deleteAllocation.mutateAsync({ id, userId: userId ?? '' })
      message.success('Allocation removed.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  async function handleDeleteExpense(id: string) {
    try {
      await deleteExpense.mutateAsync({ id, userId: userId ?? '' })
      message.success('Expense removed.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  async function handleDownloadXlsx() {
    try {
      await exportFlatExpensesToExcel(expenses, allocations)
      message.success('Excel file downloaded.')
    } catch {
      message.error('Failed to export Excel.')
    }
  }

  async function handleDownloadImage() {
    if (!printRef.current) return
    setCapturing(true)
    try {
      const canvas = await html2canvas(printRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `flat-expenses-${dayjs().format('YYYY-MM-DD')}.png`
      link.click()
      message.success('Image downloaded.')
    } catch {
      message.error('Failed to capture image.')
    } finally {
      setCapturing(false)
    }
  }

  /* ── Table columns ── */

  const allocationColumns: ColumnsType<FlatFundAllocation> = [
    { title: 'S.N', key: 'sn', width: 52, render: (_: unknown, __: FlatFundAllocation, index: number) => <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{index + 1}</Typography.Text> },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110, render: (v: string) => formatDate(v), sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: 'Member', key: 'member', render: (_: unknown, r: FlatFundAllocation) => <Tag color="blue">{r.member?.full_name ?? '—'}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Typography.Text strong style={{ color: '#52c41a' }}>+{formatCurrency(v)}</Typography.Text>, sorter: (a, b) => a.amount - b.amount },
    { title: 'Allocated By', key: 'allocator', render: (_: unknown, r: FlatFundAllocation) => <Tag color="purple">{r.allocator?.full_name ?? '—'}</Tag> },
    { title: 'Note', dataIndex: 'note', key: 'note', ellipsis: true, render: (v: string | null) => v || <Typography.Text type="secondary">—</Typography.Text> },
    {
      title: '',
      key: 'del',
      width: 44,
      render: (_: unknown, r: FlatFundAllocation) =>
        isAdmin ? (
          <Popconfirm title="Remove this allocation?" onConfirm={() => void handleDeleteAllocation(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ]

  const expenseColumns: ColumnsType<FlatFundExpense> = [
    { title: 'S.N', key: 'sn', width: 52, render: (_: unknown, __: FlatFundExpense, index: number) => <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>{index + 1}</Typography.Text> },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 110, render: (v: string) => formatDate(v), sorter: (a, b) => a.date.localeCompare(b.date) },
    { title: 'Member', key: 'member', render: (_: unknown, r: FlatFundExpense) => <Tag color="blue">{r.member?.full_name ?? '—'}</Tag> },
    { title: 'Description', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120, render: (v: string) => <Tag color={FLAT_FUND_CATEGORY_COLORS[v] ?? 'default'} style={{ textTransform: 'capitalize' }}>{FLAT_FUND_CATEGORY_LABELS[v] ?? v}</Tag> },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v: number) => <Typography.Text strong style={{ color: '#ff4d4f' }}>-{formatCurrency(v)}</Typography.Text>, sorter: (a, b) => a.amount - b.amount },
    {
      title: '',
      key: 'del',
      width: 44,
      render: (_: unknown, r: FlatFundExpense) =>
        r.created_by === userId || isAdmin ? (
          <Popconfirm title="Remove this expense?" onConfirm={() => void handleDeleteExpense(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ]

  const isLoading = profilesQuery.isLoading || allocationsQuery.isLoading || expensesQuery.isLoading
  const error = (profilesQuery.error as Error | null) ?? (allocationsQuery.error as Error | null) ?? (expensesQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Flat Expenses"
        subtitle="Track shared flat money — allocate funds to members and log what they spend on flat items like bulbs, bread, water bottles, and more."
        breadcrumbs={[{ title: 'Home', path: '/' }, { title: 'Flat Fund' }]}
        actions={
          <Space wrap>
            {!!userId && (
              <Button icon={<MinusCircleOutlined />} onClick={() => setExpenseOpen(true)}>
                Log Expense
              </Button>
            )}
            {isAdmin && (
              <Button type="primary" icon={<PlusCircleOutlined />} onClick={() => setAllocateOpen(true)}>
                Allocate Funds
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Summary stats */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <SummaryStat title="Total Allocated" value={formatCurrency(totalAllocated)} subtitle="Total flat fund given to members." icon={<WalletOutlined />} color="var(--primary)" />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat title="Total Spent" value={formatCurrency(totalSpent)} subtitle="Total spent from flat fund." icon={<DollarCircleOutlined />} color="#ff4d4f" />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Remaining Balance"
              value={formatCurrency(totalBalance)}
              subtitle={totalBalance >= 0 ? 'Still available in flat fund.' : 'Overspent — needs top-up.'}
              icon={<WalletOutlined />}
              color={totalBalance >= 0 ? '#52c41a' : '#ff4d4f'}
            />
          </Col>
        </Row>

        {/* Per-member balance cards */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 14px', color: 'var(--text-strong)' }}>
            Member Balances
          </Typography.Title>
          {summaries.length === 0 ? (
            <Alert type="info" showIcon title="No allocations yet. Admins can allocate flat fund money to members." />
          ) : (
            <Row gutter={[10, 10]}>
              {summaries.map((s) => {
                const status = s.balance > 0.01 ? 'surplus' : s.balance < -0.01 ? 'deficit' : 'zero'
                const usedPct = s.totalAllocated > 0 ? Math.min(100, (s.totalSpent / s.totalAllocated) * 100) : 0
                return (
                  <Col key={s.userId} xs={24} sm={12} lg={8}>
                    <MemberBalanceCard $status={status}>
                      <Avatar size={36} style={{ background: '#909ffa', color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0 }} icon={<UserOutlined />} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: 13 }}>{s.fullName}</Typography.Text>
                        <div style={{ display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                          <Typography.Text style={{ fontSize: 11, color: '#52c41a' }}>+{formatCurrency(s.totalAllocated)}</Typography.Text>
                          <Typography.Text style={{ fontSize: 11, color: '#ff4d4f' }}>-{formatCurrency(s.totalSpent)}</Typography.Text>
                        </div>
                        <Progress
                          percent={usedPct}
                          showInfo={false}
                          size="small"
                          strokeColor={status === 'deficit' ? '#ff4d4f' : '#52c41a'}
                          railColor="var(--card-border)"
                          style={{ marginTop: 4 }}
                        />
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <Typography.Text strong style={{ color: status === 'surplus' ? '#52c41a' : status === 'deficit' ? '#ff4d4f' : '#909ffa', fontSize: 14 }}>
                          {s.balance >= 0 ? '+' : ''}{formatCurrency(s.balance)}
                        </Typography.Text>
                        <Typography.Text style={{ display: 'block', fontSize: 10, color: 'var(--text-muted)' }}>
                          {status === 'surplus' ? 'remaining' : status === 'deficit' ? 'overspent' : 'balanced'}
                        </Typography.Text>
                      </div>
                    </MemberBalanceCard>
                  </Col>
                )
              })}
            </Row>
          )}
        </SectionBlock>

        {/* Expenses log + Allocations — wrapped for image export */}
        <div ref={printRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Expenses log */}
        <SectionBlock>
          <Flex align="center" justify="space-between" wrap gap={8} style={{ marginBottom: 10 }}>
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              <MinusCircleOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              Flat Expenses Log
            </Typography.Title>
            <Space size={6}>
              <Button
                size="small"
                icon={<PictureOutlined />}
                loading={capturing}
                onClick={() => void handleDownloadImage()}
              >
                Save as Image
              </Button>
              <Button
                size="small"
                icon={<FileExcelOutlined />}
                onClick={() => void handleDownloadXlsx()}
              >
                Excel
              </Button>
            </Space>
          </Flex>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {expenses.length === 0 && <Typography.Text type="secondary">No expenses logged yet.</Typography.Text>}
              {expenses.map((e) => (
                <MobileCard key={e.id}>
                  <MobileRow>
                    <Flex gap={6} align="center">
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{e.member?.full_name ?? '—'}</Tag>
                      <Tag color={FLAT_FUND_CATEGORY_COLORS[e.category] ?? 'default'} style={{ margin: 0, fontSize: 10 }}>{FLAT_FUND_CATEGORY_LABELS[e.category] ?? e.category}</Tag>
                    </Flex>
                    <Typography.Text strong style={{ color: '#ff4d4f' }}>-{formatCurrency(e.amount)}</Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)' }}>{e.description}</Typography.Text>
                    <MobileLabel>{formatDate(e.date)}</MobileLabel>
                  </MobileRow>
                  {(e.created_by === userId || isAdmin) && (
                    <MobileRow>
                      <div />
                      <Popconfirm title="Remove?" onConfirm={() => void handleDeleteExpense(e.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </MobileRow>
                  )}
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table<FlatFundExpense>
              rowKey="id"
              size="small"
              columns={expenseColumns}
              dataSource={expenses}
              pagination={{ pageSize: 15, hideOnSinglePage: true, size: 'small', showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} expenses` }}
              scroll={{ x: 550 }}
              locale={{ emptyText: 'No expenses logged yet.' }}
            />
          )}
        </SectionBlock>

        {/* Allocations log */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 10px', color: 'var(--text-strong)' }}>
            <PlusCircleOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Fund Allocations
          </Typography.Title>
          {isMobile ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {allocations.length === 0 && <Typography.Text type="secondary">No allocations recorded yet.</Typography.Text>}
              {allocations.map((a) => (
                <MobileCard key={a.id}>
                  <MobileRow>
                    <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{a.member?.full_name ?? '—'}</Tag>
                    <Typography.Text strong style={{ color: '#52c41a' }}>+{formatCurrency(a.amount)}</Typography.Text>
                  </MobileRow>
                  <MobileRow>
                    <Flex gap={6} align="center">
                      <MobileLabel>{formatDate(a.date)}</MobileLabel>
                      <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>by {a.allocator?.full_name ?? '—'}</Typography.Text>
                    </Flex>
                    {isAdmin && (
                      <Popconfirm title="Remove?" onConfirm={() => void handleDeleteAllocation(a.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    )}
                  </MobileRow>
                  {a.note && <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>{a.note}</Typography.Text>}
                </MobileCard>
              ))}
            </Space>
          ) : (
            <Table<FlatFundAllocation>
              rowKey="id"
              size="small"
              columns={allocationColumns}
              dataSource={allocations}
              pagination={{ pageSize: 15, hideOnSinglePage: true, size: 'small', showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} allocations` }}
              scroll={{ x: 500 }}
              locale={{ emptyText: 'No allocations recorded yet.' }}
            />
          )}
        </SectionBlock>

        </div>{/* end printRef */}
      </QueryState>

      {/* Modals */}
      {allocateOpen && (
        <AllocateModal
          profiles={profiles}
          userId={userId ?? ''}
          submitting={createAllocation.isPending}
          onClose={() => setAllocateOpen(false)}
          onSubmit={handleCreateAllocation}
        />
      )}

      {expenseOpen && (
        <LogExpenseModal
          profiles={profiles}
          userId={userId ?? ''}
          submitting={createExpense.isPending}
          onClose={() => setExpenseOpen(false)}
          onSubmit={handleCreateExpense}
        />
      )}
    </PageStack>
  )
}

/* ─── Allocate Modal ──────────────────────────────────────────────────────── */

function AllocateModal({
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: {
  profiles: Array<{ id: string; full_name: string }>
  userId: string
  submitting: boolean
  onClose: () => void
  onSubmit: (input: CreateFlatFundAllocationInput) => Promise<void>
}) {
  const [form] = Form.useForm<{ userId: string; amount: number; note: string; date: Dayjs }>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit({
      userId: values.userId,
      amount: values.amount,
      note: values.note,
      allocatedBy: userId,
      date: values.date.format('YYYY-MM-DD'),
    })
    form.resetFields()
  }

  return (
    <Modal
      open
      title={null}
      okText="Allocate Funds"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(460px, 95vw)"
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
          $gradient="linear-gradient(135deg, #1465a3 0%, #52c41a 100%)"
          $shadow="0 4px 12px rgba(20,101,163,0.35)"
        >
          <PlusCircleOutlined />
        </HeaderIcon>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            Allocate Flat Fund
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Assign flat fund money to a member
          </Typography.Text>
        </div>
      </ModalHeader>

      <FormBody>
        <Form form={form} layout="vertical" requiredMark={false} initialValues={{ date: dayjs() }}>
          {/* Section label */}
          <SectionLabel>
            <PlusCircleOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Allocation Details
            </Typography.Text>
          </SectionLabel>

          <Form.Item
            label="Member"
            name="userId"
            rules={[{ required: true, message: 'Select a member.' }]}
            style={{ marginBottom: 12 }}
          >
            <Select
              placeholder="Who is receiving the funds?"
              suffixIcon={<UserOutlined />}
              options={profiles.map((p) => ({ label: p.full_name, value: p.id }))}
            />
          </Form.Item>

          <TwoCol>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: 'Enter amount.' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="e.g. 5000"
                prefix={<DollarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <DatePicker
                style={{ width: '100%' }}
                format="DD/MM/YYYY"
                suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>
          </TwoCol>

          <Form.Item label="Note (optional)" name="note" style={{ marginBottom: 16 }}>
            <Input.TextArea
              rows={2}
              placeholder="e.g. For water bottles this month"
              style={{ resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  )
}

/* ─── Log Expense Modal ───────────────────────────────────────────────────── */

function LogExpenseModal({
  profiles,
  userId,
  submitting,
  onClose,
  onSubmit,
}: {
  profiles: Array<{ id: string; full_name: string }>
  userId: string
  submitting: boolean
  onClose: () => void
  onSubmit: (input: CreateFlatFundExpenseInput) => Promise<void>
}) {
  const [form] = Form.useForm<{ userId: string; amount: number; description: string; category: string; date: Dayjs }>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit({
      userId: values.userId,
      amount: values.amount,
      description: values.description,
      category: values.category as CreateFlatFundExpenseInput['category'],
      date: values.date.format('YYYY-MM-DD'),
      createdBy: userId,
    })
    form.resetFields()
  }

  return (
    <Modal
      open
      title={null}
      okText="Log Expense"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width="min(480px, 95vw)"
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
          $gradient="linear-gradient(135deg, #e65100 0%, #ff7043 100%)"
          $shadow="0 4px 12px rgba(230,81,0,0.35)"
        >
          <MinusCircleOutlined />
        </HeaderIcon>
        <div>
          <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)', lineHeight: 1.3 }}>
            Log Flat Expense
          </Typography.Title>
          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Record what a member spent from flat fund
          </Typography.Text>
        </div>
      </ModalHeader>

      <FormBody>
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{ date: dayjs(), userId, category: 'other' }}
        >
          {/* Section label */}
          <SectionLabel>
            <MinusCircleOutlined />
            <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Expense Details
            </Typography.Text>
          </SectionLabel>

          <Form.Item
            label="Spent By"
            name="userId"
            rules={[{ required: true, message: 'Select a member.' }]}
            style={{ marginBottom: 12 }}
          >
            <Select
              placeholder="Who spent the money?"
              options={profiles.map((p) => ({ label: p.full_name, value: p.id }))}
            />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Enter description.' }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Bought 2 water bottles" />
          </Form.Item>

          <TwoCol>
            <Form.Item
              label="Category"
              name="category"
              rules={[{ required: true }]}
              style={{ marginBottom: 12 }}
            >
              <Select options={FLAT_FUND_CATEGORY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))} />
            </Form.Item>
            <Form.Item
              label="Amount (PKR)"
              name="amount"
              rules={[{ required: true, message: 'Enter amount.' }]}
              style={{ marginBottom: 12 }}
            >
              <InputNumber
                min={1}
                precision={2}
                style={{ width: '100%' }}
                placeholder="e.g. 120"
                prefix={<DollarOutlined style={{ color: 'var(--text-muted)' }} />}
              />
            </Form.Item>
          </TwoCol>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true }]}
            style={{ marginBottom: 16 }}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              suffixIcon={<CalendarOutlined style={{ color: 'var(--text-muted)' }} />}
            />
          </Form.Item>
        </Form>
      </FormBody>
    </Modal>
  )
}
