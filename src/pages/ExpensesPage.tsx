import React, { useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import html2canvas from 'html2canvas'
import type { ColumnsType } from 'antd/es/table'
import {
  Button,
  DatePicker,
  Descriptions,
  Divider,
  Flex,
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
import { PageStack, SectionBlock } from '@/components/Glass'
import { useAuth } from '@/hooks/useAuth'
import { useCreateExpense, useDeleteExpense, useExpenses, useUpdateExpense } from '@/hooks/useExpenses'
import { useProfiles } from '@/hooks/useProfiles'
import { useMemberCountSetting, useUpsertMemberCount } from '@/hooks/useSettings'
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
import type { Expense, UserMonthlySummary } from '@/lib/types'
import { CATEGORY_LABELS } from '@/lib/constants'
import { exportExpensesToExcel } from '@/lib/export'

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
  const expensesQuery = useExpenses(selectedMonth)
  const profilesQuery = useProfiles()
  const memberCountQuery = useMemberCountSetting()
  const createExpense = useCreateExpense()
  const deleteExpense = useDeleteExpense()
  const updateExpense = useUpdateExpense()
  const saveMemberCount = useUpsertMemberCount()

  const expenses = expensesQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const memberCount = memberCountQuery.data ?? 10
  const effectiveDraftMemberCount = draftMemberCount ?? memberCount

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
        if (!value) return '—'
        const isLong = value.length > DESCRIPTION_LIMIT
        const expanded = expandedDescriptions.has(record.id)
        return (
          <span>
            {isLong && !expanded ? `${value.slice(0, DESCRIPTION_LIMIT)}…` : value}
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
    },
    {
      title: 'Share',
      dataIndex: 'fixedShare',
      key: 'fixedShare',
      render: (value: number) => formatCurrency(value),
    },
    {
      title: 'Weekend Share',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div style={{ background: 'var(--surface)', border: '1.5px solid #e0eaff', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--icon-bg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WalletOutlined style={{ fontSize: 16, color: '#1677ff' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Total Expenses</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1677ff', letterSpacing: '-0.3px' }}>{formatCurrency(fixedTotal)}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{formatMonthYear(selectedMonth)}</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1.5px solid #ede9fe', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--icon-bg-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <UserOutlined style={{ fontSize: 16, color: '#7c3aed' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Per-person Share</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed', letterSpacing: '-0.3px' }}>{formatCurrency(perMemberShare)}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Each member owes</div>
            </div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1.5px solid #d1fae5', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--icon-bg-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <TeamOutlined style={{ fontSize: 16, color: '#059669' }} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500 }}>Member Count</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#059669', letterSpacing: '-0.3px' }}>{memberCount}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>Active flatmates</div>
            </div>
          </div>
        </div>

        <SectionBlock>
            <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
              <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
                Shared Expenses
              </Typography.Title>
              <Space>
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
              </Space>
            </Flex>
            <Typography.Text style={{ color: 'var(--text-muted)' }}>
              Total amount for {formatMonthYear(selectedMonth)} divided by member count.
            </Typography.Text>

            <div style={{ marginTop: 16 }}>
              <Table
                rowKey="id"
                columns={fixedColumns}
                dataSource={fixedExpenses}
                pagination={false}
                scroll={{ x: 900 }}
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
            <Table
              rowKey="id"
              columns={weekendColumns}
              dataSource={weekendExpenses}
              pagination={false}
              scroll={{ x: 980 }}
            />
          </div>
        </SectionBlock>

        <SectionBlock>
          <Typography.Title level={4} style={{ marginTop: 0, color: 'var(--text-strong)' }}>
            Monthly Owed Per User
          </Typography.Title>
          <Typography.Text style={{ color: 'var(--text-muted)' }}>
            share plus weekend meal participation for the selected month.
          </Typography.Text>
          <div style={{ marginTop: 16 }}>
            <Table
              rowKey="userId"
              columns={summaryColumns}
              dataSource={userSummary}
              pagination={false}
              scroll={{ x: 720 }}
            />
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
        width={480}
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
            background: 'linear-gradient(135deg, #1677ff 0%, #4f46e5 100%)',
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
              { label: 'Total Expenses', value: formatCurrency(fixedTotal), color: '#1677ff' },
              { label: 'Per-person Share', value: formatCurrency(perMemberShare), color: '#4f46e5' },
              { label: 'Members', value: String(memberCount), color: '#0ea5e9' },
            ].map((pill) => (
              <div key={pill.label} style={{
                flex: 1,
                background: '#fff',
                border: `1.5px solid ${pill.color}22`,
                borderRadius: 10,
                padding: '10px 14px',
              }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>{pill.label}</div>
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
                        background: '#e8f0fe',
                        color: '#1677ff',
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
                <tr style={{ background: 'linear-gradient(90deg, #1677ff11, #4f46e511)' }}>
                  <td style={{ ...pTd, fontWeight: 700, color: '#1677ff' }} colSpan={2}>Total</td>
                  <td style={{ ...pTd, fontWeight: 700, color: '#1677ff', fontSize: 14 }}>{formatCurrency(fixedTotal)}</td>
                  <td style={{ ...pTd, fontWeight: 700, color: '#4f46e5' }}>
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
            color: '#aaa',
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
