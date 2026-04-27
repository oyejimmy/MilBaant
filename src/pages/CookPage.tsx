import { useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
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
import {
  CoffeeOutlined,
  DeleteOutlined,
  WalletOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import styled from 'styled-components'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAuth } from '@/hooks/useAuth'
import {
  useCookAdvances,
  useCookPurchases,
  useCreateAdvance,
  useCreatePurchase,
  useDeleteAdvance,
  useDeletePurchase,
} from '@/hooks/useCook'
import {
  PURCHASE_CATEGORY_OPTIONS,
  PURCHASE_CATEGORY_COLORS,
} from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/formatters'
import type { CookAdvance, CookPurchase, PurchaseCategory } from '@/lib/types'

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const BalanceCard = styled.div<{ $status: 'surplus' | 'deficit' | 'zero' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  border-left: 4px solid ${({ $status }) =>
    $status === 'surplus' ? '#52c41a' : $status === 'deficit' ? '#ff4d4f' : '#909ffa'};
  flex-wrap: wrap;
`

const BalanceAmount = styled.div<{ $status: 'surplus' | 'deficit' | 'zero' }>`
  font-size: 1.6rem;
  font-weight: 800;
  color: ${({ $status }) =>
    $status === 'surplus' ? '#52c41a' : $status === 'deficit' ? '#ff4d4f' : '#909ffa'};
  font-family: 'Plus Jakarta Sans', sans-serif;
`

/* ─── Page ────────────────────────────────────────────────────────────────── */

export function CookPage() {
  const [advanceOpen, setAdvanceOpen] = useState(false)
  const [purchaseOpen, setPurchaseOpen] = useState(false)
  const [filterMonth, setFilterMonth] = useState<Dayjs | null>(null)

  const { userId, isAdmin } = useAuth()

  const advancesQuery = useCookAdvances()
  const purchasesQuery = useCookPurchases()
  const createAdvance = useCreateAdvance()
  const createPurchase = useCreatePurchase()
  const deleteAdvance = useDeleteAdvance()
  const deletePurchase = useDeletePurchase()

  const allAdvances = advancesQuery.data ?? []
  const allPurchases = purchasesQuery.data ?? []

  // Month filter
  const advances = filterMonth
    ? allAdvances.filter((a) => a.date.startsWith(filterMonth.format('YYYY-MM')))
    : allAdvances

  const purchases = filterMonth
    ? allPurchases.filter((p) => p.date.startsWith(filterMonth.format('YYYY-MM')))
    : allPurchases

  const totalAdvanced = advances.reduce((s, a) => s + a.amount, 0)
  const totalSpent = purchases.reduce((s, p) => s + p.amount, 0)
  const balance = totalAdvanced - totalSpent
  const balanceStatus = balance > 0.01 ? 'surplus' : balance < -0.01 ? 'deficit' : 'zero'

  const usedPercent = totalAdvanced > 0 ? Math.min(100, (totalSpent / totalAdvanced) * 100) : 0

  /* ── Handlers ── */

  async function handleCreateAdvance(values: { amount: number; date: Dayjs; note: string }) {
    if (!userId) return
    try {
      await createAdvance.mutateAsync({
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        note: values.note,
        givenBy: userId,
      })
      message.success('Advance recorded.')
      setAdvanceOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save.')
    }
  }

  async function handleCreatePurchase(values: {
    date: Dayjs
    item: string
    amount: number
    category: PurchaseCategory
    note: string
  }) {
    if (!userId) return
    try {
      await createPurchase.mutateAsync({
        date: values.date.format('YYYY-MM-DD'),
        item: values.item,
        amount: values.amount,
        category: values.category,
        note: values.note,
        createdBy: userId,
      })
      message.success('Purchase logged.')
      setPurchaseOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to save.')
    }
  }

  async function handleDeleteAdvance(id: string) {
    try {
      await deleteAdvance.mutateAsync({ id, userId: userId ?? '' })
      message.success('Advance removed.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  async function handleDeletePurchase(id: string) {
    try {
      await deletePurchase.mutateAsync({ id, userId: userId ?? '' })
      message.success('Purchase removed.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  /* ── Columns ── */

  const advanceColumns: ColumnsType<CookAdvance> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Amount Given',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <Typography.Text strong style={{ color: '#52c41a' }}>
          +{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Given By',
      key: 'givenBy',
      render: (_: unknown, r: CookAdvance) => (
        <Tag color="blue">{r.giver?.full_name ?? '—'}</Tag>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_: unknown, r: CookAdvance) =>
        isAdmin || !!userId ? (
          <Popconfirm title="Remove this advance?" onConfirm={() => void handleDeleteAdvance(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ]

  const purchaseColumns: ColumnsType<CookPurchase> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
      render: (v: string) => formatDate(v),
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: 'Item',
      dataIndex: 'item',
      key: 'item',
      render: (v: string) => (
        <Typography.Text strong style={{ color: 'var(--text-strong)' }}>{v}</Typography.Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (v: string) => (
        <Tag color={PURCHASE_CATEGORY_COLORS[v] ?? 'default'} style={{ textTransform: 'capitalize' }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Amount Spent',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: number) => (
        <Typography.Text strong style={{ color: '#ff4d4f' }}>
          -{formatCurrency(v)}
        </Typography.Text>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Logged By',
      key: 'creator',
      responsive: ['md'] as ('md')[],
      render: (_: unknown, r: CookPurchase) => (
        <Tag color="purple">{r.creator?.full_name ?? '—'}</Tag>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
      responsive: ['lg'] as ('lg')[],
      render: (v: string | null) =>
        v || <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: '',
      key: 'del',
      width: 50,
      render: (_: unknown, r: CookPurchase) =>
        !!userId ? (
          <Popconfirm title="Remove this purchase?" onConfirm={() => void handleDeletePurchase(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        ) : null,
    },
  ]

  // Category breakdown for purchases
  const categoryBreakdown = PURCHASE_CATEGORY_OPTIONS.map(({ label, value }) => {
    const total = purchases
      .filter((p) => p.category === value)
      .reduce((s, p) => s + p.amount, 0)
    return { label, value, total }
  }).filter((c) => c.total > 0)

  const isLoading = advancesQuery.isLoading || purchasesQuery.isLoading
  const error = (advancesQuery.error as Error | null) ?? (purchasesQuery.error as Error | null)

  return (
    <PageStack>
      <PageHeader
        title="Cook Ledger"
        subtitle="Track advance money given to the cook and every item purchased with it. Full transparency for all flatmates."
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              placeholder="Filter by month"
              value={filterMonth}
              onChange={(v) => setFilterMonth(v ? v.startOf('month') : null)}
              allowClear
            />
            {!!userId && (
              <Button
                icon={<ShoppingCartOutlined />}
                onClick={() => setPurchaseOpen(true)}
              >
                Log Purchase
              </Button>
            )}
            {!!userId && (
              <Button
                type="primary"
                icon={<WalletOutlined />}
                onClick={() => setAdvanceOpen(true)}
              >
                Give Advance
              </Button>
            )}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>
        {/* Balance card */}
        <BalanceCard $status={balanceStatus}>
          <div>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>
              CURRENT BALANCE
            </Typography.Text>
            <BalanceAmount $status={balanceStatus}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </BalanceAmount>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              {balanceStatus === 'surplus'
                ? `Cook has ${formatCurrency(balance)} remaining to spend`
                : balanceStatus === 'deficit'
                ? `Cook overspent by ${formatCurrency(Math.abs(balance))}`
                : 'Advance fully used — perfectly balanced'}
            </Typography.Text>
          </div>

          <div style={{ minWidth: 160 }}>
            <Flex justify="space-between" style={{ marginBottom: 6 }}>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                Used {usedPercent.toFixed(0)}%
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                {formatCurrency(totalSpent)} / {formatCurrency(totalAdvanced)}
              </Typography.Text>
            </Flex>
            <Progress
              percent={usedPercent}
              showInfo={false}
              strokeColor={balanceStatus === 'deficit' ? '#ff4d4f' : '#52c41a'}
              trailColor="var(--card-border)"
              size="small"
            />
          </div>
        </BalanceCard>

        {/* Stats */}
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Total Advanced"
              value={formatCurrency(totalAdvanced)}
              subtitle="Money given to cook."
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle="Items purchased by cook."
            />
          </Col>
          <Col xs={24} sm={8}>
            <SummaryStat
              title="Purchases"
              value={purchases.length}
              subtitle="Items logged this period."
            />
          </Col>
        </Row>

        {/* Category breakdown */}
        {categoryBreakdown.length > 0 && (
          <SectionBlock>
            <Typography.Title level={5} style={{ margin: '0 0 14px', color: 'var(--text-strong)' }}>
              Spending by Category
            </Typography.Title>
            <Row gutter={[10, 10]}>
              {categoryBreakdown.map((c) => (
                <Col key={c.value} xs={12} sm={8} md={6} lg={4}>
                  <div style={{
                    padding: '10px 12px',
                    borderRadius: 7,
                    border: '1px solid var(--card-border)',
                    background: 'var(--content-bg)',
                    textAlign: 'center',
                  }}>
                    <Tag color={PURCHASE_CATEGORY_COLORS[c.value]} style={{ marginBottom: 6 }}>
                      {c.label}
                    </Tag>
                    <Typography.Text strong style={{ display: 'block', color: 'var(--text-strong)', fontSize: '0.88rem' }}>
                      {formatCurrency(c.total)}
                    </Typography.Text>
                  </div>
                </Col>
              ))}
            </Row>
          </SectionBlock>
        )}

        {/* Purchases table */}
        <SectionBlock>
          <Flex align="center" justify="space-between" style={{ marginBottom: 12 }} wrap gap={8}>
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              <ShoppingCartOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
              What the Cook Bought
            </Typography.Title>
            <Tag color="red">{formatCurrency(totalSpent)} total</Tag>
          </Flex>
          <Table<CookPurchase>
            rowKey="id"
            size="small"
            columns={purchaseColumns}
            dataSource={purchases}
            pagination={{ pageSize: 12, hideOnSinglePage: true, size: 'small' }}
            scroll={{ x: 600 }}
            locale={{ emptyText: 'No purchases logged yet.' }}
          />
        </SectionBlock>

        {/* Advances table */}
        <SectionBlock>
          <Flex align="center" justify="space-between" style={{ marginBottom: 12 }} wrap gap={8}>
            <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
              <WalletOutlined style={{ marginRight: 8, color: '#52c41a' }} />
              Advances Given
            </Typography.Title>
            <Tag color="green">{formatCurrency(totalAdvanced)} total</Tag>
          </Flex>
          <Table<CookAdvance>
            rowKey="id"
            size="small"
            columns={advanceColumns}
            dataSource={advances}
            pagination={{ pageSize: 8, hideOnSinglePage: true, size: 'small' }}
            scroll={{ x: 500 }}
            locale={{ emptyText: 'No advances recorded yet.' }}
          />
        </SectionBlock>

        {/* Deficit warning */}
        {balanceStatus === 'deficit' && (
          <Alert
            type="warning"
            showIcon
            message={`Cook overspent by ${formatCurrency(Math.abs(balance))}`}
            description="The cook has spent more than the advance given. Consider recording a new advance or reviewing the purchases."
          />
        )}
      </QueryState>

      {/* Give Advance modal */}
      {advanceOpen && (
        <AdvanceModal
          submitting={createAdvance.isPending}
          onClose={() => setAdvanceOpen(false)}
          onSubmit={handleCreateAdvance}
        />
      )}

      {/* Log Purchase modal */}
      {purchaseOpen && (
        <PurchaseModal
          submitting={createPurchase.isPending}
          onClose={() => setPurchaseOpen(false)}
          onSubmit={handleCreatePurchase}
        />
      )}
    </PageStack>
  )
}

/* ─── Advance Modal ───────────────────────────────────────────────────────── */

function AdvanceModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean
  onClose: () => void
  onSubmit: (v: { amount: number; date: Dayjs; note: string }) => Promise<void>
}) {
  const [form] = Form.useForm()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values as { amount: number; date: Dayjs; note: string })
    form.resetFields()
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <WalletOutlined style={{ color: '#52c41a' }} />
          <span>Give Advance to Cook</span>
        </Flex>
      }
      okText="Record Advance"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width={400}
    >
      <Form form={form} layout="vertical" initialValues={{ date: dayjs() }} style={{ paddingTop: 8 }}>
        <Form.Item label="Amount (PKR)" name="amount" rules={[{ required: true, message: 'Enter amount.' }]}>
          <InputNumber min={1} precision={2} style={{ width: '100%' }} placeholder="e.g. 5000" />
        </Form.Item>
        <Form.Item label="Date" name="date" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item label="Note (optional)" name="note">
          <Input.TextArea rows={2} placeholder="e.g. Monthly advance for groceries" />
        </Form.Item>
      </Form>
    </Modal>
  )
}

/* ─── Purchase Modal ──────────────────────────────────────────────────────── */

function PurchaseModal({
  submitting,
  onClose,
  onSubmit,
}: {
  submitting: boolean
  onClose: () => void
  onSubmit: (v: { date: Dayjs; item: string; amount: number; category: PurchaseCategory; note: string }) => Promise<void>
}) {
  const [form] = Form.useForm()

  async function handleOk() {
    const values = await form.validateFields()
    await onSubmit(values as { date: Dayjs; item: string; amount: number; category: PurchaseCategory; note: string })
    form.resetFields()
  }

  return (
    <Modal
      open
      title={
        <Flex align="center" gap={8}>
          <ShoppingCartOutlined style={{ color: '#ff4d4f' }} />
          <span>Log Cook Purchase</span>
        </Flex>
      }
      okText="Save Purchase"
      confirmLoading={submitting}
      onCancel={onClose}
      onOk={() => void handleOk()}
      width={420}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ date: dayjs(), category: 'grocery' }}
        style={{ paddingTop: 8 }}
      >
        <Row gutter={12}>
          <Col xs={24} sm={14}>
            <Form.Item label="Item Name" name="item" rules={[{ required: true, message: 'Enter item.' }]}>
              <Input placeholder="e.g. Chicken, Tomatoes, Rice" prefix={<CoffeeOutlined style={{ color: 'var(--text-muted)' }} />} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Form.Item label="Category" name="category" rules={[{ required: true }]}>
              <Select options={PURCHASE_CATEGORY_OPTIONS.map((o) => ({ label: o.label, value: o.value }))} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Amount (PKR)" name="amount" rules={[{ required: true, message: 'Enter amount.' }]}>
              <InputNumber min={1} precision={2} style={{ width: '100%' }} placeholder="e.g. 850" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Date" name="date" rules={[{ required: true }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Note (optional)" name="note">
          <Input.TextArea rows={2} placeholder="e.g. Bought from local market" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
