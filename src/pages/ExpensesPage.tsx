import React, { useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import html2canvas from 'html2canvas'
import type { ColumnsType } from 'antd/es/table'
import {
  Avatar,
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
  Grid,
  Image,
  InputNumber,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PrinterOutlined,
  PlusOutlined,
  SaveOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import { ExpenseFormModal, type ExpenseSubmission } from '@/components/ExpenseFormModal'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, SectionBlock, MobileCard, MobileRow, MobileLabel } from '@/components/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '@/hooks/useExpenses'
import { useProfiles } from '@/hooks/useProfiles'
import { useMemberCountSetting, useUpsertMemberCount } from '@/hooks/useSettings'
import { useContributionPayments, useDeleteContributionPayment } from '@/hooks/useContributions'
import {
  buildMonthlyUserSummary,
  calculateFixedTotal,
  calculatePerMemberShare,
  calculateWeekendExpenseShare,
  splitExpensesByType,
} from '@/lib/expense-helpers'
import {
  formatCurrency,
  formatDate,
  formatMonthYear,
} from '@/lib/formatters'
import { uploadBillImage } from '@/lib/storage'
import type { ContributionPayment, Expense, UserMonthlySummary } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/constants'
import { exportExpensesToExcel } from '@/lib/export'

const { useBreakpoint } = Grid

export function ExpensesPage() {
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [distributeOpen, setDistributeOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [printImageUrl, setPrintImageUrl] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)
  const [draftMemberCount, setDraftMemberCount] = useState<number | null>(null)
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())

  const { userId, canManageExpenses, isAdmin } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const expensesQuery = useExpenses(selectedMonth)
  const profilesQuery = useProfiles()
  const memberCountQuery = useMemberCountSetting()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const updateExpense = useUpdateExpense()
  const saveMemberCount = useUpsertMemberCount()
  const paymentsQuery = useContributionPayments(selectedMonth.format('YYYY-MM'))
  const deletePayment = useDeleteContributionPayment()

  const expenses = expensesQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const memberCount = memberCountQuery.data ?? 10
  const effectiveDraftMemberCount = draftMemberCount ?? memberCount
  const payments = paymentsQuery.data ?? []

  // Map userId → their payments for this month
  const paymentsByUser = new Map<string, ContributionPayment[]>()
  for (const p of payments) {
    const existing = paymentsByUser.get(p.user_id) ?? []
    paymentsByUser.set(p.user_id, [...existing, p])
  }

  const { fixedExpenses, weekendExpenses } = splitExpensesByType(expenses)
  const fixedTotal = calculateFixedTotal(fixedExpenses)
  const perMemberShare = calculatePerMemberShare(fixedTotal, memberCount)
  const userSummary = buildMonthlyUserSummary(profiles, perMemberShare, weekendExpenses)

  function toggleDescription(id: string) {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function handleOpenPrint() {
    setPrintOpen(true)
    // wait for modal + printRef to render
    setTimeout(() => {
      void (async () => {
        if (!printRef.current) return
        setCapturing(true)
        try {
          const canvas = await html2canvas(printRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
          })
          setPrintImageUrl(canvas.toDataURL('image/png'))
        } catch {
          message.error('Failed to generate image.')
        } finally {
          setCapturing(false)
        }
      })()
    }, 300)
  }

  function handleSavePrintImage() {
    if (!printImageUrl) return
    const link = document.createElement('a')
    link.href = printImageUrl
    link.download = `expenses-${selectedMonth.format('YYYY-MM')}.png`
    link.click()
  }

  function handleClosePrint() {
    setPrintOpen(false)
    setPrintImageUrl(null)
  }

  async function handleEditExpense({ values, file }: ExpenseSubmission) {
    if (!editingExpense) return
    try {
      if (file && userId) {
        await uploadBillImage(userId, file)
      }
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        amount: values.amount,
        description: values.description ?? null,
        userId: userId ?? '',
      })
      message.success('Expense updated.')
      setEditingExpense(null)
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Unable to update expense.')
    }
  }

  async function handleCreateExpense({ values, file }: ExpenseSubmission) {
    if (!userId) {
      message.error('You need to be signed in to add an expense.')
      return
    }

    try {
      const billImageUrl = file ? await uploadBillImage(userId, file) : null
      await createExpense.mutateAsync({
        createdBy: userId,
        category: values.category,
        amount: values.amount,
        date: values.date.format('YYYY-MM-DD'),
        lastDate: values.lastDate ? values.lastDate.format('YYYY-MM-DD') : undefined,
        description: values.description,
        participantIds:
          values.category === 'weekend_meal'
            ? (values.participantIds ?? [])
            : profiles.map((profile) => profile.id),
        billImageUrl,
      })
      message.success('Expense saved successfully.')
      setAddModalOpen(false)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to save the expense.',
      )
    }
  }

  async function handleDeleteExpense(expenseId: string, label?: string) {
    try {
      await deleteExpense.mutateAsync({ expenseId, userId: userId ?? '', label })
      message.success('Expense deleted.')
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to delete the expense.',
      )
    }
  }

  async function handleSaveMemberCount() {
    if (!effectiveDraftMemberCount || effectiveDraftMemberCount < 1) {
      message.error('Please enter a valid member count.')
      return
    }

    try {
      await saveMemberCount.mutateAsync(effectiveDraftMemberCount)
      message.success('Member count updated.')
      setDraftMemberCount(null)
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : 'Unable to update the member count.',
      )
    }
  }

  // Payment submission handler - UI implementation pending
  /*
  async function handleSubmitPayment(values: { amount: number; paidAt: Dayjs; note: string; file?: File }) {
    if (!userId) return
    try {
      let screenshotUrl: string | null = null
      if (values.file) {
        screenshotUrl = await uploadPaymentScreenshot(userId, values.file)
      }
      await createPayment.mutateAsync({
        userId,
        month: selectedMonth.format('YYYY-MM'),
        amount: values.amount,
        paidAt: values.paidAt.format('YYYY-MM-DD'),
        screenshotUrl,
        note: values.note,
        createdBy: userId,
      })
      message.success('Payment submitted successfully.')
      setPayModalOpen(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to submit payment.')
    }
  }
  */

  async function handleDeletePayment(id: string) {
    try {
      await deletePayment.mutateAsync({ id, userId: userId ?? '' })
      message.success('Payment record removed.')
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Unable to delete.')
    }
  }

  const DESCRIPTION_LIMIT = 60

  const fixedColumns: ColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      sorter: (a: Expense, b: Expense) => a.date.localeCompare(b.date),
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      sorter: (a: Expense, b: Expense) => CATEGORY_LABELS[a.category].localeCompare(CATEGORY_LABELS[b.category]),
      render: (value: Expense['category']) => <Tag color="blue">{CATEGORY_LABELS[value]}</Tag>,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Expense, b: Expense) => a.amount - b.amount,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      sorter: (a: Expense, b: Expense) => (a.description ?? '').localeCompare(b.description ?? ''),
      render: (value: string | null, record: Expense) => {
        const parts: string[] = []
        
        if (value) {
          parts.push(value)
        }
        
        if (record.last_date) {
          parts.push(`Last Date: ${formatDate(record.last_date)}`)
        }
        
        if (parts.length === 0) return '—'
        
        const fullText = parts.join(' | ')
        const isLong = fullText.length > DESCRIPTION_LIMIT
        const expanded = expandedDescriptions.has(record.id)
        
        return (
          <span>
            {isLong && !expanded ? `${fullText.slice(0, DESCRIPTION_LIMIT)}…` : fullText}
            {isLong && (
              <Typography.Link
                style={{ marginLeft: 6, fontSize: 12 }}
                onClick={() => toggleDescription(record.id)}
              >
                {expanded ? 'See less' : 'See more'}
              </Typography.Link>
            )}
          </span>
        )
      },
    },
    ...(isAdmin
      ? [
          {
            title: 'Actions',
            key: 'action',
            render: (_: unknown, record: Expense) => (
              <Space>
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => setEditingExpense(record)}
                />
                <Popconfirm
                  title="Delete this expense?"
                  description="This action cannot be undone."
                  onConfirm={() => void handleDeleteExpense(record.id, CATEGORY_LABELS[record.category])}
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ]

  const weekendColumns: ColumnsType<Expense> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 190,
      render: (value: string) => formatDate(value),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (value: string | null) => value || 'Weekend meal',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Participants',
      key: 'participants',
      render: (_: unknown, record: Expense) => (
        <Flex wrap gap={8}>
          {record.expense_participants.map((participant) => (
            <Tag key={`${record.id}-${participant.user_id}`} color="cyan">
              {participant.profile?.full_name ?? 'Unknown'}
            </Tag>
          ))}
        </Flex>
      ),
    },
    {
      title: 'Share per Person',
      key: 'share',
      render: (_: unknown, record: Expense) =>
        formatCurrency(calculateWeekendExpenseShare(record)),
    },
    {
      title: 'Bill Image',
      dataIndex: 'bill_image_url',
      key: 'bill_image_url',
      render: (value: string | null) =>
        value ? <Image width={64} src={value} alt="Bill" /> : '—',
    },
    ...(isAdmin
      ? [
          {
            title: 'Action',
            key: 'action',
            render: (_: unknown, record: Expense) => (
              <Popconfirm
                title="Delete this expense?"
                description="This action cannot be undone."
                onConfirm={() => void handleDeleteExpense(record.id)}
              >
                <Button danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]
      : []),
  ]

  const summaryColumns: ColumnsType<UserMonthlySummary> = [
    {
      title: 'Flatmate',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (v: string, row: UserMonthlySummary) => (
        <Flex align="center" gap={8}>
          <Avatar size={24} style={{ background: '#909ffa', color: '#fff', fontSize: 11 }} icon={<UserOutlined />} />
          <Typography.Text style={{ color: 'var(--text-strong)', fontSize: 13 }}>{v}</Typography.Text>
          {row.userId === userId && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>You</Tag>}
        </Flex>
      ),
    },
    {
      title: 'Share',
      dataIndex: 'fixedShare',
      key: 'fixedShare',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Weekend',
      dataIndex: 'weekendShare',
      key: 'weekendShare',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Total Owed',
      dataIndex: 'totalOwed',
      key: 'totalOwed',
      render: (value: number) => (
        <Typography.Text strong style={{ color: 'var(--text-strong)' }}>
          {formatCurrency(value)}
        </Typography.Text>
      ),
    },
    {
      title: 'Payment Status',
      key: 'payment',
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? []
        const totalPaid = userPayments.reduce((s, p) => s + p.amount, 0)
        const isPaid = totalPaid >= row.totalOwed - 0.01
        const isOverdue = !isPaid && dayjs().isAfter(dayjs(selectedMonth).endOf('month'))
        if (userPayments.length === 0) {
          return isOverdue
            ? <Tag color="red" icon={<ClockCircleOutlined />}>Overdue</Tag>
            : <Tag color="default">Pending</Tag>
        }
        return (
          <Flex gap={4} wrap>
            {isPaid
              ? <Tag color="green" icon={<CheckCircleOutlined />}>Paid {formatCurrency(totalPaid)}</Tag>
              : <Tag color="orange" icon={<ClockCircleOutlined />}>Partial {formatCurrency(totalPaid)}</Tag>
            }
          </Flex>
        )
      },
    },
    {
      title: 'Screenshot',
      key: 'screenshot',
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? []
        const withScreenshot = userPayments.filter((p) => p.screenshot_url)
        if (withScreenshot.length === 0) return <Typography.Text type="secondary">—</Typography.Text>
        // Payment screenshot viewing - UI implementation pending
        return <Typography.Text type="secondary">View in Contributions page</Typography.Text>
        /*
        return (
          <Flex gap={4}>
            {withScreenshot.map((p) => (
              <Button
                key={p.id}
                size="small"
                icon={<EyeOutlined />}
                onClick={() => setViewPayment(p)}
              />
            ))}
          </Flex>
        )
        */
      },
    },
    {
      title: '',
      key: 'action',
      width: 44,
      render: (_: unknown, row: UserMonthlySummary) => {
        const userPayments = paymentsByUser.get(row.userId) ?? []
        return (
          <Flex gap={4}>
            {userPayments.map((p) =>
              p.created_by === userId || isAdmin ? (
                <Popconfirm key={p.id} title="Remove this payment?" onConfirm={() => void handleDeletePayment(p.id)}>
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : null
            )}
          </Flex>
        )
      },
    },
  ]

  const isLoading =
    expensesQuery.isLoading || profilesQuery.isLoading || memberCountQuery.isLoading
  const error =
    (expensesQuery.error as Error | null) ??
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null)
  const pTh: React.CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    borderBottom: '2px solid #e8e8e8',
    fontWeight: 700,
  }

  const pTd: React.CSSProperties = {
    padding: '7px 12px',
    borderBottom: '1px solid #f0f0f0',
  }

  return (
    <PageStack>
      <PageHeader
        title="Expenses"
        subtitle="Track monthly expenses, record weekend meal splits, and calculate what each flatmate owes."
        actions={
          <Space wrap>
            <DatePicker
              picker="month"
              value={selectedMonth}
              onChange={(value) => value && setSelectedMonth(value.startOf('month'))}
            />
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                void exportExpensesToExcel(expenses, selectedMonth.format('YYYY-MM'))
              }
            >
              Download Excel
            </Button>
            {canManageExpenses ? (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setAddModalOpen(true)}
              >
                Add Expense
              </Button>
            ) : null}
          </Space>
        }
      />

      <QueryState isLoading={isLoading} error={error}>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
          <div style={{ background: 'var(--surface)', border: 'none', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Total Expenses</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.3px' }}>{formatCurrency(fixedTotal)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{formatMonthYear(selectedMonth)}</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WalletOutlined style={{ fontSize: 15, color: 'var(--primary)' }} />
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: 'none', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Per-person Share</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.3px' }}>{formatCurrency(perMemberShare)}</div>
              <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Each member owes</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserOutlined style={{ fontSize: 15, color: '#7c3aed' }} />
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: 'none', borderRadius: 12, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>Member Count</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.3px' }}>{memberCount}</div>
              <div style={{ fontSize: 10, color: 'var(--text-disabled)' }}>Active flatmates</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TeamOutlined style={{ fontSize: 15, color: '#059669' }} />
            </div>
          </div>
        </div>

        <SectionBlock>
            <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 4 }}>
              <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
                Shared Expenses
              </Typography.Title>
              <Flex wrap gap={8}>
                <Button
                  icon={<PrinterOutlined />}
                  onClick={() => void handleOpenPrint()}
                >
                  Print
                </Button>
                <Button
                  icon={<ShareAltOutlined />}
                  onClick={() => setDistributeOpen(true)}
                >
                  Distribute
                </Button>
              </Flex>
            </Flex>
            <Typography.Text style={{ color: 'var(--text-muted)' }}>
              Total amount for {formatMonthYear(selectedMonth)} divided by member count.
            </Typography.Text>

            <div style={{ marginTop: 16 }}>
              {isMobile ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {fixedExpenses.length === 0 && (
                    <Typography.Text type="secondary">No shared expenses for this month.</Typography.Text>
                  )}
                  {fixedExpenses.map((exp) => (
                    <MobileCard key={exp.id}>
                      <MobileRow>
                        <Tag color="blue" style={{ margin: 0 }}>{CATEGORY_LABELS[exp.category]}</Tag>
                        <Typography.Text strong style={{ color: 'var(--text-strong)' }}>{formatCurrency(exp.amount)}</Typography.Text>
                      </MobileRow>
                      <MobileRow>
                        <MobileLabel>{formatDate(exp.date)}</MobileLabel>
                        {(exp.description || exp.last_date) && (
                          <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', flex: 1, marginLeft: 8 }} ellipsis>
                            {[exp.description, exp.last_date ? `Last Date: ${formatDate(exp.last_date)}` : null].filter(Boolean).join(' | ')}
                          </Typography.Text>
                        )}
                      </MobileRow>
                      {isAdmin && (
                        <MobileRow>
                          <div />
                          <Flex gap={6}>
                            <Button icon={<EditOutlined />} size="small" onClick={() => setEditingExpense(exp)} />
                            <Popconfirm title="Delete?" onConfirm={() => void handleDeleteExpense(exp.id, CATEGORY_LABELS[exp.category])}>
                              <Button danger icon={<DeleteOutlined />} size="small" />
                            </Popconfirm>
                          </Flex>
                        </MobileRow>
                      )}
                    </MobileCard>
                  ))}
                  {fixedExpenses.length > 0 && (
                    <div style={{ padding: '8px 12px', background: 'var(--content-bg)', borderRadius: 7, border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between' }}>
                      <Typography.Text strong>Total</Typography.Text>
                      <Flex gap={8} align="center">
                        <Typography.Text strong>{formatCurrency(fixedTotal)}</Typography.Text>
                        <Tag color="blue">Per-person: {formatCurrency(perMemberShare)}</Tag>
                      </Flex>
                    </div>
                  )}
                </Space>
              ) : (
                <Table
                  rowKey="id"
                  columns={fixedColumns}
                  dataSource={fixedExpenses}
                  pagination={false}
                  scroll={{ x: 700 }}
                  size="small"
                  summary={() => (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Typography.Text strong>Total</Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <Typography.Text strong>{formatCurrency(fixedTotal)}</Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Tag color="blue" style={{ fontWeight: 600, fontSize: 13, padding: '2px 10px' }}>
                          Per-person: {formatCurrency(perMemberShare)}
                        </Tag>
                      </Table.Summary.Cell>
                      {isAdmin && <Table.Summary.Cell index={3} />}
                    </Table.Summary.Row>
                  )}
                />
              )}
            </div>
          </SectionBlock>

        <SectionBlock>
          <Typography.Title level={4} style={{ marginTop: 0, color: 'var(--text-strong)' }}>
            Weekend Expenses
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-muted)' }}>
            Meals recorded on Saturdays and Sundays are divided only among selected participants.
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            {isMobile ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {weekendExpenses.length === 0 && (
                  <Typography.Text type="secondary">No weekend expenses for this month.</Typography.Text>
                )}
                {weekendExpenses.map((exp) => (
                  <MobileCard key={exp.id}>
                    <MobileRow>
                      <MobileLabel>{formatDate(exp.date)}</MobileLabel>
                      <Typography.Text strong style={{ color: 'var(--text-strong)' }}>{formatCurrency(exp.amount)}</Typography.Text>
                    </MobileRow>
                    <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {exp.description || 'Weekend meal'}
                    </Typography.Text>
                    <Flex wrap gap={4}>
                      {exp.expense_participants.map((p) => (
                        <Tag key={p.user_id} color="cyan" style={{ margin: 0, fontSize: 11 }}>
                          {p.profile?.full_name ?? '?'}
                        </Tag>
                      ))}
                    </Flex>
                    <MobileRow>
                      <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Share/person: {formatCurrency(calculateWeekendExpenseShare(exp))}
                      </Typography.Text>
                      {isAdmin && (
                        <Popconfirm title="Delete?" onConfirm={() => void handleDeleteExpense(exp.id)}>
                          <Button danger icon={<DeleteOutlined />} size="small" />
                        </Popconfirm>
                      )}
                    </MobileRow>
                  </MobileCard>
                ))}
              </Space>
            ) : (
              <Table
                rowKey="id"
                columns={weekendColumns}
                dataSource={weekendExpenses}
                pagination={false}
                scroll={{ x: 800 }}
                size="small"
              />
            )}
          </div>
        </SectionBlock>

        <SectionBlock>
          <Flex justify="space-between" align="center" wrap gap={8} style={{ marginBottom: 4 }}>
            <div>
              <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 0, color: 'var(--text-strong)' }}>
                Monthly Owed Per User
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                Share plus weekend participation. Submit payment proof on Dashboard.
              </Typography.Text>
            </div>
            {/* Payment submission button - use Dashboard or Contributions page instead */}
            {/*
            {!!userId && (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setPayModalOpen(true)}
              >
                Mark as Paid
              </Button>
            )}
            */}
          </Flex>
          <div style={{ marginTop: 12 }}>
            {isMobile ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {userSummary.map((row) => {
                  const userPayments = paymentsByUser.get(row.userId) ?? []
                  const totalPaid = userPayments.reduce((s, p) => s + p.amount, 0)
                  const isPaid = totalPaid >= row.totalOwed - 0.01
                  const isOverdue = !isPaid && dayjs().isAfter(dayjs(selectedMonth).endOf('month'))
                  return (
                    <MobileCard key={row.userId}>
                      <MobileRow>
                        <Flex align="center" gap={6}>
                          <Avatar size={22} style={{ background: '#909ffa', color: '#fff', fontSize: 10 }} icon={<UserOutlined />} />
                          <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>{row.fullName}</Typography.Text>
                          {row.userId === userId && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>You</Tag>}
                        </Flex>
                        <Typography.Text strong style={{ color: '#909ffa', fontSize: 14 }}>{formatCurrency(row.totalOwed)}</Typography.Text>
                      </MobileRow>
                      <MobileRow>
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>Share: {formatCurrency(row.fixedShare)}</Typography.Text>
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekend: {formatCurrency(row.weekendShare)}</Typography.Text>
                      </MobileRow>
                      <MobileRow>
                        {userPayments.length === 0 ? (
                          isOverdue
                            ? <Tag color="red" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>Overdue</Tag>
                            : <Tag color="default" style={{ margin: 0 }}>Pending</Tag>
                        ) : isPaid ? (
                          <Tag color="green" icon={<CheckCircleOutlined />} style={{ margin: 0 }}>Paid {formatCurrency(totalPaid)}</Tag>
                        ) : (
                          <Tag color="orange" icon={<ClockCircleOutlined />} style={{ margin: 0 }}>Partial {formatCurrency(totalPaid)}</Tag>
                        )}
                        <Flex gap={4}>
                          {/* Payment screenshot viewing - use Contributions page */}
                          {userPayments.map(p =>
                            p.created_by === userId || isAdmin ? (
                              <Popconfirm key={p.id} title="Remove?" onConfirm={() => void handleDeletePayment(p.id)}>
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            ) : null
                          )}
                        </Flex>
                      </MobileRow>
                      {userPayments.length > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {userPayments.map(p => `${formatDate(p.paid_at)} — ${formatCurrency(p.amount)}`).join(' · ')}
                        </div>
                      )}
                    </MobileCard>
                  )
                })}
              </Space>
            ) : (
              <Table
                rowKey="userId"
                columns={summaryColumns}
                dataSource={userSummary}
                pagination={false}
                scroll={{ x: 700 }}
                size="small"
              />
            )}
          </div>
        </SectionBlock>
      </QueryState>

      <ExpenseFormModal
        open={addModalOpen}
        submitting={createExpense.isPending}
        profiles={profiles}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleCreateExpense}
      />

      <ExpenseFormModal
        open={editingExpense !== null}
        submitting={updateExpense.isPending}
        profiles={profiles}
        editingExpense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onSubmit={handleEditExpense}
      />

      <Modal
        open={distributeOpen}
        title="Distribute Expenses"
        onCancel={() => setDistributeOpen(false)}
        footer={null}
        width="min(480px, 95vw)"
      >
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Total Expenses">
              <Typography.Text strong>{formatCurrency(fixedTotal)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Per-person Share">
              <Typography.Text strong style={{ color: 'var(--text-strong)' }}>
                {formatCurrency(perMemberShare)}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Member Count">
              <Typography.Text strong>{memberCount}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>

          {isAdmin && (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <Typography.Text style={{ color: 'var(--text-muted)' }}>
                Update member count to recalculate the per-person share.
              </Typography.Text>
              <Flex align="center" gap={12}>
                <InputNumber
                  min={1}
                  value={effectiveDraftMemberCount}
                  onChange={(value) => setDraftMemberCount(value)}
                  style={{ width: 120 }}
                />
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={saveMemberCount.isPending}
                  onClick={() => void handleSaveMemberCount()}
                >
                  Save
                </Button>
              </Flex>
            </>
          )}
        </Space>
      </Modal>
      {/* Hidden printable content */}
      <div style={{ position: 'absolute', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div
          ref={printRef}
          style={{
            background: '#ffffff',
            width: 760,
            fontFamily: "'Segoe UI', Arial, sans-serif",
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          {/* Header banner */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--blue-700) 100%)',
            padding: '24px 28px 20px',
          }}>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              Shared Expenses
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              {selectedMonth.format('MMMM YYYY')}
            </div>
          </div>

          {/* Summary pills */}
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '16px 28px',
            background: '#f8faff',
            borderBottom: '1px solid #e8edf5',
          }}>
            {[
              { label: 'Total Expenses', value: formatCurrency(fixedTotal), color: 'var(--primary)' },
              { label: 'Per-person Share', value: formatCurrency(perMemberShare), color: 'var(--blue-700)' },
              { label: 'Members', value: String(memberCount), color: 'var(--info)' },
            ].map((pill) => (
              <div key={pill.label} style={{
                flex: 1,
                background: '#fff',
                border: `1.5px solid ${pill.color}22`,
                borderRadius: 10,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{pill.label}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: pill.color }}>{pill.value}</div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{ padding: '0 0 20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f0f5ff' }}>
                  <th style={pTh}>Date</th>
                  <th style={pTh}>Category</th>
                  <th style={pTh}>Paid Amount</th>
                  <th style={pTh}>Description</th>
                </tr>
              </thead>
              <tbody>
                {fixedExpenses.map((exp, i) => (
                  <tr key={exp.id} style={{ background: i % 2 === 0 ? '#fff' : '#f8faff' }}>
                    <td style={pTd}>{formatDate(exp.date)}</td>
                    <td style={pTd}>
                      <span style={{
                        background: 'var(--primary-soft)',
                        color: 'var(--primary)',
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontWeight: 600,
                        fontSize: 12,
                      }}>
                        {CATEGORY_LABELS[exp.category]}
                      </span>
                    </td>
                    <td style={{ ...pTd, fontWeight: 600, color: '#111' }}>{formatCurrency(exp.amount)}</td>
                    <td style={{ ...pTd, color: '#555' }}>{exp.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'linear-gradient(90deg, var(--primary-soft), var(--bg-elevated))' }}>
                  <td style={{ ...pTd, fontWeight: 700, color: 'var(--primary)' }} colSpan={2}>Total</td>
                  <td style={{ ...pTd, fontWeight: 700, color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(fixedTotal)}</td>
                  <td style={{ ...pTd, fontWeight: 700, color: 'var(--blue-700)' }}>
                    Per-person: {formatCurrency(perMemberShare)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer */}
          <div style={{
            background: '#f8faff',
            borderTop: '1px solid #e8edf5',
            padding: '10px 28px',
            fontSize: 11,
            color: 'var(--text-disabled)',
            textAlign: 'right',
          }}>
            Generated by MilBaant · {dayjs().format('DD MMM YYYY')}
          </div>
        </div>
      </div>

      <Modal
        open={printOpen}
        title="Save as Image"
        onCancel={handleClosePrint}
        footer={
          <Flex justify="flex-end" gap={8}>
            <Button onClick={handleClosePrint}>Close</Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={!printImageUrl}
              onClick={handleSavePrintImage}
            >
              Save Image
            </Button>
          </Flex>
        }
        width="min(780px, 95vw)"
      >
        {capturing || !printImageUrl ? (
          <Flex justify="center" align="center" style={{ height: 200 }}>
            <Typography.Text type="secondary">Generating image…</Typography.Text>
          </Flex>
        ) : (
          <img
            src={printImageUrl}
            alt="Fixed expenses"
            style={{ width: '100%', borderRadius: 8, border: '1px solid #f0f0f0' }}
          />
        )}
      </Modal>
    </PageStack>
  )
}
