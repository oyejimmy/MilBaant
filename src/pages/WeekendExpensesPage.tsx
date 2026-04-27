import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  Image,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { ExpenseFormModal, type ExpenseSubmission } from '@/components/ExpenseFormModal'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAuth } from '@/hooks/useAuth'
import { useCreateExpense, useDeleteExpense, useExpenses } from '@/hooks/useExpenses'
import { useProfiles } from '@/hooks/useProfiles'
import { useCreateSettlement, useDeleteSettlement, useSettlements } from '@/hooks/useSettlements'
import { uploadBillImage } from '@/lib/storage'
import {
  buildDebtMatrix,
  calculateWeekendExpenseShare,
  splitExpensesByType,
} from '@/lib/expense-helpers'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMonthYear,
} from '@/lib/formatters'
import type { DebtRow, DebtSettlement, Expense } from '@/lib/types'

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const DebtCard = styled.div<{ $type: 'owe' | 'owed' | 'settled' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  flex-wrap: wrap;

  border-left: 3px solid ${({ $type }) =>
    $type === 'owe' ? '#ff7875' : $type === 'owed' ? '#52c41a' : 'var(--card-border)'};
`

const DebtLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`

/* ─── Main page ───────────────────────────────────────────────────────────── */

export function WeekendExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [viewExpense, setViewExpense] = useState<Expense | null>(null)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [settleModal, setSettleModal] = useState<DebtRow | null>(null)

  const { userId, isAdmin } = useAuth()
  const expensesQuery = useExpenses(selectedMonth)
  const profilesQuery = useProfiles()
  const settlementsQuery = useSettlements()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const createSettlement = useCreateSettlement()
  const deleteSettlement = useDeleteSettlement()

  const profiles = profilesQuery.data ?? []
  const { weekendExpenses } = splitExpensesByType(expensesQuery.data ?? [])
  const settlements = settlementsQuery.data ?? []

  const totalAmount = weekendExpenses.reduce((s, e) => s + e.amount, 0)
  const uniqueParticipants = new Set(
    weekendExpenses.flatMap((e) => e.expense_participants.map((p) => p.user_id)),
  ).size

  // Build raw debt matrix from expenses
  const rawDebts = buildDebtMatrix(weekendExpenses, profiles)

  // Subtract settled amounts from debts
  const debtRows = applySettlements(rawDebts, settlements)

  /* ── Handlers ── */

  async function handleCreateExpense({ values, file }: ExpenseSubmission) {
    if (!userId) return
    try {
      const billImageUrl = file ? await uploadBillImage(userId, file) : null
      await createExpense.mutateAsync({
        createdBy: userId,
        category: 'weekend_meal',
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        description: values.description,
        participantIds: values.participantIds ?? [],
        billImageUrl,
      })
      message.success('Weekend expense added.')
      setAddModalOpen(false)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to save.')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense.mutateAsync({ expenseId: id, userId: userId ?? '' })
      message.success('Deleted.')
      if (viewExpense?.id === id) setViewExpense(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to delete.')
    }
  }

  async function handleSettle(debt: DebtRow, amount: number, note: string) {
    if (!userId) return
    try {
      await createSettlement.mutateAsync({
        payerId: debt.fromId,
        payeeId: debt.toId,
        amount,
        note,
        settledAt: dayjs().format('YYYY-MM-DD'),
        createdBy: userId,
      })
      message.success('Settlement recorded.')
      setSettleModal(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to record settlement.')
    }
  }

  async function handleDeleteSettlement(id: string) {
    try {
      await deleteSettlement.mutateAsync({ id, userId: userId ?? '' })
      message.success('Settlement removed.')
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to remove.')
    }
  }

  /* ── Table columns ── */

  const columns: ColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: 'Paid By',
      key: 'paidBy',
      width: 120,
      render: (_: unknown, record: Expense) => (
        <Tag color="purple">{record.creator?.full_name ?? '—'}</Tag>
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
      title: 'Share / Person',
      key: 'share',
      width: 120,
      render: (_: unknown, record: Expense) =>
        formatCurrency(calculateWeekendExpenseShare(record)),
    },
    {
      title: 'Participants',
      key: 'participants',
      responsive: ['md'] as ('md')[],
      render: (_: unknown, record: Expense) => (
        <Flex wrap gap={4}>
          {record.expense_participants.map((p) => (
            <Tag key={p.user_id} color="blue" style={{ margin: 0, fontSize: '0.72rem' }}>
              {p.profile?.full_name ?? '?'}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 70,
      render: (_: unknown, record: Expense) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); setViewExpense(record) }}
          />
          {!!userId && (
            <Popconfirm
              title="Delete this expense?"
              onConfirm={() => void handleDelete(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const isLoading = expensesQuery.isLoading || profilesQuery.isLoading || settlementsQuery.isLoading
  const error = (expensesQuery.error as Error | null) ?? (profilesQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Weekend Expenses"
        subtitle={`Weekend meal costs for ${formatMonthYear(selectedMonth)}, split among selected participants.`}
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
                onClick={() => setAddModalOpen(true)}
              >
                Add Expense
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Stats */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <SummaryStat title="Total Spend" value={formatCurrency(totalAmount)} subtitle="All weekend meals this month." />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat title="Entries" value={weekendExpenses.length} subtitle="Weekend expense records." />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat title="Participants" value={uniqueParticipants} subtitle="Distinct flatmates involved." />
          </Col>
        </Row>

        {/* Expenses table */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            All Weekend Meals
          </Typography.Title>
          <Table<Expense>
            rowKey="id"
            columns={columns}
            dataSource={weekendExpenses}
            pagination={{ pageSize: 10, hideOnSinglePage: true, size: 'small' }}
            scroll={{ x: 600 }}
            size="small"
            onRow={(record) => ({
              onClick: (e) => {
                const t = e.target as HTMLElement
                if (t.closest('button') || t.closest('.ant-btn')) return
                setViewExpense(record)
              },
              style: { cursor: 'pointer' },
            })}
            locale={{ emptyText: 'No weekend expenses for this month.' }}
          />
        </SectionBlock>

        {/* Debt / Credit summary */}
        <SectionBlock>
          <Space direction="vertical" size={4} style={{ width: '100%', marginBottom: 16 }}>
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              Who Owes Whom
            </Typography.Title>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Based on who paid each bill and who participated. Green = someone owes you. Red = you owe someone.
            </Typography.Text>
          </Space>

          {debtRows.length === 0 ? (
            <Alert
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              message="All settled up! No outstanding debts for this month."
            />
          ) : (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {debtRows.map((debt) => {
                const isCurrentUserDebtor = debt.fromId === userId
                const isCurrentUserCreditor = debt.toId === userId
                const type = isCurrentUserDebtor ? 'owe' : isCurrentUserCreditor ? 'owed' : 'settled'

                return (
                  <DebtCard key={`${debt.fromId}-${debt.toId}`} $type={type}>
                    <DebtLabel>
                      <Avatar size={24} style={{ background: '#909ffa', color: '#fff', fontSize: 11 }} icon={<UserOutlined />} />
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
                        {debt.fromName}
                      </Typography.Text>
                      <ArrowRightOutlined style={{ color: 'var(--text-muted)', fontSize: 11 }} />
                      <Avatar size={24} style={{ background: '#52c41a', color: '#fff', fontSize: 11 }} icon={<UserOutlined />} />
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.85rem' }}>
                        {debt.toName}
                      </Typography.Text>
                      {isCurrentUserDebtor && (
                        <Tag color="red" style={{ margin: 0 }}>You owe</Tag>
                      )}
                      {isCurrentUserCreditor && (
                        <Tag color="green" style={{ margin: 0 }}>Owed to you</Tag>
                      )}
                    </DebtLabel>

                    <Flex align="center" gap={8}>
                      <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.9rem' }}>
                        {formatCurrency(debt.netAmount)}
                      </Typography.Text>
                      {!!userId && (
                        <Button
                          size="small"
                          type="primary"
                          icon={<CheckCircleOutlined />}
                          onClick={() => setSettleModal(debt)}
                        >
                          Settle
                        </Button>
                      )}
                    </Flex>
                  </DebtCard>
                )
              })}
            </Space>
          )}
        </SectionBlock>

        {/* Settlement history */}
        <SectionBlock>
          <Typography.Title level={5} style={{ margin: '0 0 12px', color: 'var(--text-strong)' }}>
            Settlement History
          </Typography.Title>
          {settlements.length === 0 ? (
            <Typography.Text style={{ color: 'var(--text-muted)' }}>No settlements recorded yet.</Typography.Text>
          ) : (
            <Table<DebtSettlement>
              rowKey="id"
              size="small"
              pagination={{ pageSize: 8, hideOnSinglePage: true, size: 'small' }}
              scroll={{ x: 500 }}
              dataSource={settlements}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'settled_at',
                  key: 'settled_at',
                  width: 190,
                  render: (v: string) => formatDate(v),
                },
                {
                  title: 'Paid By',
                  key: 'payer',
                  render: (_: unknown, r: DebtSettlement) => (
                    <Tag color="blue">{r.payer?.full_name ?? r.payer_id}</Tag>
                  ),
                },
                {
                  title: 'Paid To',
                  key: 'payee',
                  render: (_: unknown, r: DebtSettlement) => (
                    <Tag color="green">{r.payee?.full_name ?? r.payee_id}</Tag>
                  ),
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (v: number) => (
                    <Typography.Text strong>{formatCurrency(v)}</Typography.Text>
                  ),
                },
                {
                  title: 'Note',
                  dataIndex: 'note',
                  key: 'note',
                  ellipsis: true,
                  responsive: ['md'] as ('md')[],
                  render: (v: string | null) =>
                    v || <Typography.Text type="secondary">—</Typography.Text>,
                },
                {
                  title: '',
                  key: 'del',
                  width: 50,
                  render: (_: unknown, r: DebtSettlement) =>
                    !!userId ? (
                      <Popconfirm
                        title="Remove this settlement?"
                        onConfirm={() => void handleDeleteSettlement(r.id)}
                      >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ) : null,
                },
              ]}
            />
          )}
        </SectionBlock>
      </QueryState>

      {/* Add expense modal */}
      <ExpenseFormModal
        open={addModalOpen}
        submitting={createExpense.isPending}
        profiles={profiles}
        lockedCategory="weekend_meal"
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateExpense}
      />

      {/* Expense detail modal */}
      {viewExpense && (
        <ExpenseDetailModal
          expense={viewExpense}
          onClose={() => setViewExpense(null)}
          onDelete={!!userId ? handleDelete : undefined}
          deleting={deleteExpense.isPending}
        />
      )}

      {/* Settle debt modal */}
      {settleModal && (
        <SettleModal
          debt={settleModal}
          submitting={createSettlement.isPending}
          onClose={() => setSettleModal(null)}
          onSubmit={handleSettle}
        />
      )}
    </PageStack>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function applySettlements(debts: DebtRow[], settlements: DebtSettlement[]): DebtRow[] {
  // Build a map of settled amounts per pair
  const settled = new Map<string, number>()
  for (const s of settlements) {
    const key = [s.payer_id, s.payee_id].sort().join('|')
    settled.set(key, (settled.get(key) ?? 0) + s.amount)
  }

  return debts
    .map((debt) => {
      const key = [debt.fromId, debt.toId].sort().join('|')
      const paidOff = settled.get(key) ?? 0
      return { ...debt, netAmount: Math.max(0, debt.netAmount - paidOff) }
    })
    .filter((d) => d.netAmount > 0.01)
}

/* ─── Expense detail modal ────────────────────────────────────────────────── */

const ModalGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding-top: 4px;

  @media (max-width: 480px) {
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
  font-size: 0.72rem;
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

const ParticipantList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;

  &::-webkit-scrollbar { width: 3px; }
  &::-webkit-scrollbar-thumb { background: var(--card-border); border-radius: 3px; }
`

const ParticipantRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-radius: 6px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
`

function ExpenseDetailModal({
  expense,
  onClose,
  onDelete,
  deleting,
}: {
  expense: Expense
  onClose: () => void
  onDelete?: (id: string) => Promise<void>
  deleting: boolean
}) {
  const sharePerPerson = calculateWeekendExpenseShare(expense)

  return (
    <Modal
      open
      onCancel={onClose}
      title={
        <Flex align="center" gap={8}>
          <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: '0.95rem' }}>
            Weekend Expense
          </Typography.Text>
          <Tag color="blue" style={{ margin: 0 }}>Read Only</Tag>
          {expense.creator && (
            <Tag color="purple" style={{ margin: 0 }}>{expense.creator.full_name}</Tag>
          )}
        </Flex>
      }
      footer={
        <Flex justify={onDelete ? 'space-between' : 'flex-end'} align="center">
          {onDelete && (
            <Popconfirm title="Delete this expense?" onConfirm={() => void onDelete(expense.id)}>
              <Button danger size="small" icon={<DeleteOutlined />} loading={deleting}>Delete</Button>
            </Popconfirm>
          )}
          <Button size="small" onClick={onClose}>Close</Button>
        </Flex>
      }
      width={480}
      styles={{ body: { padding: '12px 16px 4px' } }}
    >
      <ModalGrid>
        {/* Left: key fields */}
        <InfoBlock>
          <InfoRow>
            <InfoLabel>Date</InfoLabel>
            <InfoValue>{formatDate(expense.date)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Amount</InfoLabel>
            <InfoValue style={{ color: '#909ffa', fontSize: '1rem', fontWeight: 700 }}>
              {formatCurrency(expense.amount)}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Share / Person</InfoLabel>
            <InfoValue>{formatCurrency(sharePerPerson)}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Description</InfoLabel>
            <InfoValue style={{ color: expense.description ? 'var(--text-strong)' : 'var(--text-muted)', fontWeight: 400 }}>
              {expense.description || 'No description'}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Recorded</InfoLabel>
            <InfoValue style={{ fontSize: '0.78rem', fontWeight: 400 }}>
              {formatDateTime(expense.created_at)}
            </InfoValue>
          </InfoRow>

          {/* Bill image inline — small thumbnail */}
          {expense.bill_image_url && (
            <InfoRow>
              <InfoLabel>Bill</InfoLabel>
              <Image
                src={expense.bill_image_url}
                alt="Bill"
                width={80}
                height={60}
                style={{ borderRadius: 6, objectFit: 'cover', border: '1px solid var(--card-border)' }}
              />
            </InfoRow>
          )}
        </InfoBlock>

        {/* Right: participants */}
        <InfoBlock>
          <InfoRow>
            <InfoLabel>Participants ({expense.expense_participants.length})</InfoLabel>
          </InfoRow>
          {expense.expense_participants.length === 0 ? (
            <Typography.Text type="secondary" style={{ fontSize: '0.82rem' }}>
              No participants recorded.
            </Typography.Text>
          ) : (
            <ParticipantList>
              {expense.expense_participants.map((p) => (
                <ParticipantRow key={p.user_id}>
                  <Typography.Text style={{ fontSize: '0.8rem', color: 'var(--text-strong)' }}>
                    {p.profile?.full_name ?? '?'}
                  </Typography.Text>
                  <Typography.Text style={{ fontSize: '0.8rem', color: '#909ffa', fontWeight: 600 }}>
                    {formatCurrency(sharePerPerson)}
                  </Typography.Text>
                </ParticipantRow>
              ))}
            </ParticipantList>
          )}
        </InfoBlock>
      </ModalGrid>
    </Modal>
  )
}

/* ─── Settle modal ────────────────────────────────────────────────────────── */

function SettleModal({
  debt,
  submitting,
  onClose,
  onSubmit,
}: {
  debt: DebtRow
  submitting: boolean
  onClose: () => void
  onSubmit: (debt: DebtRow, amount: number, note: string) => Promise<void>
}) {
  const [form] = Form.useForm<{ amount: number; note: string }>()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(debt, values.amount, values.note ?? '')
    form.resetFields()
  }

  return (
    <Modal
      open
      onCancel={onClose}
      title="Record Settlement"
      okText="Confirm Payment"
      confirmLoading={submitting}
      onOk={() => void handleOk()}
      width={420}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', paddingTop: 8 }}>
        <Alert
          type="info"
          showIcon
          message={
            <span>
              <strong>{debt.fromName}</strong> pays <strong>{debt.toName}</strong> to clear debt of{' '}
              <strong>{formatCurrency(debt.netAmount)}</strong>
            </span>
          }
        />

        <Form form={form} layout="vertical" initialValues={{ amount: debt.netAmount }}>
          <Form.Item
            label="Amount Paid"
            name="amount"
            rules={[{ required: true, message: 'Enter amount.' }]}
          >
            <InputNumber
              min={0.01}
              max={debt.netAmount}
              precision={2}
              prefix="PKR"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <Form.Item label="Note (optional)" name="note">
            <Form.Item name="note" noStyle>
              <input
                placeholder="e.g. Cash handed over"
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 7,
                  border: '1px solid var(--card-border)',
                  background: 'var(--card-bg)',
                  color: 'var(--text-strong)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </Form.Item>
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  )
}
