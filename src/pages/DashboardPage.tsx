import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { Alert, Button, Col, Flex, Grid, Input, InputNumber, Row, Space, Table, Tag, Typography, message } from 'antd'
import { EditOutlined, FundOutlined, HistoryOutlined, SaveOutlined, WalletOutlined, CalendarOutlined, CoffeeOutlined, TeamOutlined, CheckCircleOutlined, DollarOutlined, MoonOutlined, ClockCircleOutlined } from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { PageStack, ResponsiveGrid, SectionBlock } from '@/components/Glass'
import { QueryState } from '@/components/QueryState'
import { SummaryStat } from '@/components/SummaryStat'
import { PaymentProofModal } from '@/components/PaymentProofModal'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useFlatFundAllocations, useFlatFundExpenses } from '@/hooks/useFlatFund'
import { useProfiles } from '@/hooks/useProfiles'
import { useMemberCountSetting, useContributeInfo, useUpsertContributeInfo, usePrevMonthRemainder, useUpsertPrevMonthRemainder } from '@/hooks/useSettings'
import { useContributionPayments } from '@/hooks/useContributions'
import {
  buildMonthlyUserSummary,
  calculateFixedTotal,
  calculatePerMemberShare,
  splitExpensesByType,
} from '@/lib/expense-helpers'
import { formatCurrency, formatDateTime } from '@/lib/formatters'
import type { UserMonthlySummary } from '@/lib/types'

const { useBreakpoint } = Grid

/* ─── Animations ──────────────────────────────────────────────────────────── */
const shimmer = keyframes`
  0%   { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(250%) skewX(-15deg); }
`

/* ─── Credit Card ─────────────────────────────────────────────────────────── */
const CardWrap = styled.div`
  position: relative;
  width: 100%;
  max-width: 420px;
  /* Standard credit card ratio 85.6mm × 53.98mm = 1.586 */
  aspect-ratio: 1.586 / 1;
  border-radius: 14px;
  background: linear-gradient(140deg, #1e8c4a 0%, #00a651 30%, #009944 55%, #007a38 80%, #005a28 100%);
  overflow: hidden;
  box-shadow:
    0 24px 64px rgba(0, 120, 50, 0.5),
    0 6px 20px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255,255,255,0.18);
  user-select: none;
  cursor: default;
  display: flex;
  flex-direction: column;

  /* Shimmer sweep on hover */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(255,255,255,0.07) 50%,
      transparent 100%
    );
    transform: translateX(-100%) skewX(-15deg);
    pointer-events: none;
  }
  &:hover::after {
    animation: ${shimmer} 0.75s ease forwards;
  }
`

/* Green body — takes up ~80% of card height */
const CardBody = styled.div`
  flex: 1;
  position: relative;
  padding: clamp(10px, 3.5%, 18px) clamp(14px, 4.5%, 22px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
`

/* White footer strip — ~20% of card height */
const CardFooter = styled.div`
  background: #fff;
  padding: clamp(5px, 1.8%, 9px) clamp(14px, 4.5%, 22px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`

/* Polygon decorations mimicking the real card's geometric shapes */
const CardPoly = styled.div<{
  $w: number; $h: number;
  $top?: string; $bottom?: string; $left?: string; $right?: string;
  $rotate?: number; $opacity: number;
}>`
  position: absolute;
  width: ${p => p.$w}px;
  height: ${p => p.$h}px;
  background: rgba(255,255,255,${p => p.$opacity});
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  top: ${p => p.$top ?? 'auto'};
  bottom: ${p => p.$bottom ?? 'auto'};
  left: ${p => p.$left ?? 'auto'};
  right: ${p => p.$right ?? 'auto'};
  transform: rotate(${p => p.$rotate ?? 0}deg);
  pointer-events: none;
`

const AccountNumber = styled.div`
  color: #fff;
  font-size: clamp(15px, 3vw, 20px);
  font-weight: 700;
  letter-spacing: 0.18em;
  font-family: 'Courier New', 'Lucida Console', monospace;
  text-shadow: 0 1px 6px rgba(0,0,0,0.4);
`

const AccountName = styled.div`
  color: #fff;
  font-size: clamp(12px, 2.2vw, 15px);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
  margin-top: 4px;
`

/* ─── Mobile balance card ─────────────────────────────────────────────────── */
const BalanceRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--content-bg);
  gap: 8px;
`


export function DashboardPage() {
  const { isAdmin } = useAuth()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const currentMonth = dayjs().startOf('month')
  const currentMonthStr = currentMonth.format('YYYY-MM')
  const expensesQuery = useExpenses(currentMonth)
  const announcementsQuery = useAnnouncements()
  const profilesQuery = useProfiles()
  const memberCountQuery = useMemberCountSetting()
  const contributeQuery = useContributeInfo()
  const upsertContribute = useUpsertContributeInfo()
  const prevRemainderQuery = usePrevMonthRemainder()
  const upsertPrevRemainder = useUpsertPrevMonthRemainder()
  const flatAllocationsQuery = useFlatFundAllocations()
  const flatExpensesQuery = useFlatFundExpenses()
  const contributionPaymentsQuery = useContributionPayments(currentMonthStr)

  const [editing, setEditing] = useState(false)
  const [draftAccount, setDraftAccount] = useState('')
  const [draftMethod, setDraftMethod] = useState('')
  const [draftName, setDraftName] = useState('')
  const [editingRemainder, setEditingRemainder] = useState(false)
  const [draftRemainder, setDraftRemainder] = useState<number | null>(null)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; amount: number } | null>(null)

  const expenses = expensesQuery.data ?? []
  const announcements = announcementsQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const contributeInfo = contributeQuery.data
  const prevRemainder = prevRemainderQuery.data ?? 0
  const contributionPayments = contributionPaymentsQuery.data ?? []

  const { fixedExpenses, weekendExpenses } = splitExpensesByType(expenses)
  const fixedTotal = calculateFixedTotal(fixedExpenses)
  const weekendTotal = calculateFixedTotal(weekendExpenses)
  const totalRecorded = fixedTotal + weekendTotal
  const perMemberShare = calculatePerMemberShare(fixedTotal, memberCountQuery.data)
  const monthlySummary = buildMonthlyUserSummary(profiles, perMemberShare, weekendExpenses)
    .sort((l, r) => r.totalOwed - l.totalOwed)

  // Build payment status map
  const paymentStatusMap = new Map<string, { paid: boolean; amount: number; date: string; daysOverdue: number }>()
  contributionPayments.forEach((payment) => {
    paymentStatusMap.set(payment.user_id, {
      paid: true,
      amount: payment.amount,
      date: payment.paid_at,
      daysOverdue: 0,
    })
  })

  // Calculate overdue days for users who haven't paid
  const today = dayjs()
  const dueDate = currentMonth.add(5, 'day') // Assuming due date is 5th of the month
  monthlySummary.forEach((user) => {
    if (!paymentStatusMap.has(user.userId)) {
      const daysOverdue = today.isAfter(dueDate) ? today.diff(dueDate, 'day') : 0
      paymentStatusMap.set(user.userId, {
        paid: false,
        amount: 0,
        date: '',
        daysOverdue,
      })
    }
  })

  // Flat fund summary
  const flatAllocations = flatAllocationsQuery.data ?? []
  const flatExpenses = flatExpensesQuery.data ?? []
  const flatTotalAllocated = flatAllocations.reduce((s, a) => s + a.amount, 0)
  const flatTotalSpent = flatExpenses.reduce((s, e) => s + e.amount, 0)
  const flatBalance = flatTotalAllocated - flatTotalSpent

  // Fixed weekly dinner schedule
  const WEEKLY_DINNER_SCHEDULE: Record<number, string> = {
    1: 'Chicken Karahi + Roti', // Monday
    2: 'Daal Chawal + Salad',   // Tuesday
    3: 'Chicken Biryani',        // Wednesday
    4: 'Aloo Keema + Roti',      // Thursday
    5: 'Chicken Qorma + Roti',   // Friday
    6: 'Pulao + Raita',          // Saturday
    0: 'Nihari + Naan',          // Sunday
  }
  
  const todayDayOfWeek = dayjs().day() // 0 = Sunday, 1 = Monday, etc.
  const todayDinner = WEEKLY_DINNER_SCHEDULE[todayDayOfWeek]
  function startEdit() {
    setDraftAccount(contributeInfo?.accountNumber ?? '')
    setDraftMethod(contributeInfo?.paymentMethod ?? '')
    setDraftName(contributeInfo?.accountName ?? '')
    setEditing(true)
  }

  async function saveContribute() {
    try {
      await upsertContribute.mutateAsync({
        accountNumber: draftAccount.trim(),
        paymentMethod: draftMethod.trim(),
        accountName: draftName.trim(),
      })
      message.success('Contribute info updated.')
      setEditing(false)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  async function saveRemainder() {
    try {
      await upsertPrevRemainder.mutateAsync(draftRemainder ?? 0)
      message.success('Remainder updated.')
      setEditingRemainder(false)
      setDraftRemainder(null)
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to save.')
    }
  }

  const isLoading =
    expensesQuery.isLoading ||
    announcementsQuery.isLoading ||
    profilesQuery.isLoading ||
    memberCountQuery.isLoading

  const error =
    (expensesQuery.error as Error | null) ??
    (announcementsQuery.error as Error | null) ??
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null)

  const balanceColumns: ColumnsType<UserMonthlySummary> = [
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
    {
      title: 'Payment Status',
      key: 'paymentStatus',
      render: (_: unknown, record: UserMonthlySummary) => {
        const status = paymentStatusMap.get(record.userId)
        if (!status) return <Tag color="default">Unknown</Tag>
        
        if (status.paid) {
          return (
            <Space direction="vertical" size={0}>
              <Tag color="success">Paid</Tag>
              <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {formatCurrency(status.amount)} on {dayjs(status.date).format('MMM DD')}
              </Typography.Text>
            </Space>
          )
        }
        
        if (status.daysOverdue > 0) {
          return (
            <Space direction="vertical" size={0}>
              <Tag color="error">Overdue</Tag>
              <Typography.Text style={{ fontSize: 11, color: '#ff4d4f' }}>
                {status.daysOverdue} {status.daysOverdue === 1 ? 'day' : 'days'} late
              </Typography.Text>
            </Space>
          )
        }
        
        return <Tag color="warning">Pending</Tag>
      },
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: unknown, record: UserMonthlySummary) => {
        const status = paymentStatusMap.get(record.userId)
        if (status?.paid) {
          return (
            <Button
              size="small"
              icon={<CheckCircleOutlined />}
              disabled
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              Submitted
            </Button>
          )
        }
        
        return (
          <Button
            size="small"
            type="primary"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedUser({
                id: record.userId,
                name: record.fullName,
                amount: record.totalOwed,
              })
              setPaymentModalOpen(true)
            }}
          >
            Submit Payment
          </Button>
        )
      },
    },
  ]

  return (
    <PageStack>
      <QueryState isLoading={isLoading} error={error}>
        <ResponsiveGrid>
          <SummaryStat
            title="Total Recorded"
            value={formatCurrency(totalRecorded)}
            subtitle="All expenses this month."
            icon={<WalletOutlined />}
            color="var(--primary)"
          />
          <SummaryStat
            title="Shared Total"
            value={formatCurrency(fixedTotal)}
            subtitle="Split equally among members."
            icon={<CalendarOutlined />}
            color="#7c3aed"
          />
          <SummaryStat
            title="Weekend Total"
            value={formatCurrency(weekendTotal)}
            subtitle="Split among participants only."
            icon={<CoffeeOutlined />}
            color="var(--info)"
          />
          <SummaryStat
            title="Per Member Share"
            value={formatCurrency(perMemberShare)}
            subtitle={`${memberCountQuery.data ?? 0} members`}
            icon={<TeamOutlined />}
            color="#059669"
          />

          {/* Remainder — inline stat card with edit */}
          <div style={{
            background: 'var(--surface)',
            border: `1.5px solid ${prevRemainder > 0 ? 'rgba(217,119,6,0.25)' : 'var(--card-border)'}`,
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 2 }}>Prev. Remainder</div>
              {editingRemainder ? (
                <div>
                  <InputNumber
                    min={0}
                    precision={2}
                    prefix="PKR"
                    value={draftRemainder ?? prevRemainder}
                    onChange={(v) => setDraftRemainder(v)}
                    style={{ width: '100%' }}
                    size="small"
                    autoFocus
                  />
                  <Flex gap={6} style={{ marginTop: 6 }}>
                    <Button size="small" type="primary" icon={<SaveOutlined />} loading={upsertPrevRemainder.isPending} onClick={() => void saveRemainder()}>Save</Button>
                    <Button size="small" onClick={() => { setEditingRemainder(false); setDraftRemainder(null) }}>Cancel</Button>
                  </Flex>
                </div>
              ) : (
                <div style={{ fontSize: 'clamp(14px, 3.5vw, 18px)', fontWeight: 700, color: prevRemainder > 0 ? '#d97706' : '#9ca3af', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  {formatCurrency(prevRemainder)}
                </div>
              )}
              <div style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2 }}>
                {prevRemainder > 0 ? 'Carried over from last month.' : 'All settled last month.'}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {isAdmin && !editingRemainder && (
                <Button
                  size="small"
                  icon={<EditOutlined />}
                  type="text"
                  style={{ width: 24, height: 24, padding: 0, minWidth: 0 }}
                  onClick={() => { setDraftRemainder(prevRemainder); setEditingRemainder(true) }}
                />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: prevRemainder > 0 ? 'rgba(217,119,6,0.1)' : '#f3f4f618',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: prevRemainder > 0 ? '#d97706' : '#9ca3af',
              }}>
                <HistoryOutlined />
              </div>
            </div>
          </div>
        </ResponsiveGrid>

        {/* Tonight's Dinner & Flat Fund Overview - Side by Side */}
        <Row gutter={[20, 20]} align="stretch">
          {/* Tonight's Dinner */}
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <SectionBlock style={{ flex: 1 }}>
              <Flex align="center" justify="space-between" style={{ marginBottom: 12 }} wrap gap={8}>
                <div>
                  <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MoonOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                    Tonight's Dinner
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    {dayjs().format('dddd, DD MMMM YYYY')}
                  </Typography.Text>
                </div>
                <Button
                  type="link"
                  href="/daily-menu"
                  style={{ padding: 0 }}
                >
                  View Menu →
                </Button>
              </Flex>
              <div style={{
                padding: '20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.02) 100%)',
                border: '2px solid rgba(114, 46, 209, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 120,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(114, 46, 209, 0.05)',
                  pointerEvents: 'none',
                }} />
                <Typography.Text style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: '#722ed1',
                  display: 'block',
                  lineHeight: 1.3,
                  position: 'relative',
                  zIndex: 1,
                  marginBottom: 8,
                }}>
                  {todayDinner}
                </Typography.Text>
                <Typography.Text style={{
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  position: 'relative',
                  zIndex: 1,
                }}>
                  <ClockCircleOutlined />
                  Serving at 9:00 PM
                </Typography.Text>
              </div>
            </SectionBlock>
          </Col>

          {/* Flat Fund Overview */}
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <SectionBlock style={{ flex: 1 }}>
              <Flex align="center" gap={8} style={{ marginBottom: 14 }}>
                <FundOutlined style={{ color: '#909ffa', fontSize: 16 }} />
                <div>
                  <Typography.Title level={4} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    Flat Fund Overview
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Shared flat money for daily expenses
                  </Typography.Text>
                </div>
              </Flex>
              <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Allocated</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--primary)' }}>{formatCurrency(flatTotalAllocated)}</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Spent</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#ff4d4f' }}>{formatCurrency(flatTotalSpent)}</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '10px 8px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Balance</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: flatBalance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {flatBalance >= 0 ? '+' : ''}{formatCurrency(flatBalance)}
                    </div>
                  </div>
                </Col>
              </Row>
              {flatExpenses.slice(0, 3).length > 0 && (
                <div>
                  <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>Recent expenses:</Typography.Text>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {flatExpenses.slice(0, 3).map((e) => (
                      <Flex key={e.id} justify="space-between" align="center" style={{ padding: '6px 10px', background: 'var(--content-bg)', borderRadius: 6, border: '1px solid var(--card-border)' }}>
                        <div>
                          <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)' }}>{e.description}</Typography.Text>
                          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{e.member?.full_name ?? '—'}</Typography.Text>
                        </div>
                        <Typography.Text strong style={{ fontSize: 12, color: '#ff4d4f' }}>-{formatCurrency(e.amount)}</Typography.Text>
                      </Flex>
                    ))}
                  </Space>
                </div>
              )}
            </SectionBlock>
          </Col>
        </Row>

        <Row gutter={[20, 20]} align="stretch">
          <Col xs={24} xl={14} style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionBlock style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: 16 }}>
                <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-strong)' }}>
                  Recent Announcements
                </Typography.Title>
                <Typography.Text style={{ color: 'var(--text-muted)' }}>
                  Important updates from the admin team.
                </Typography.Text>
              </div>

              <div style={{ flex: 1 }}>
                {announcements.length ? (
                  <AnnouncementTicker announcements={announcements} />
                ) : (
                  <Alert
                    type="info"
                    showIcon
                    message="No announcements yet."
                    description="Admins can post updates from the Announcements page or Admin Panel."
                  />
                )}
              </div>
            </SectionBlock>
          </Col>

          <Col xs={24} xl={10} style={{ display: 'flex', flexDirection: 'column' }}>
            <SectionBlock style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
                <div>
                  <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    Contribute
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    Send your monthly share to this account.
                  </Typography.Text>
                </div>
                {isAdmin && !editing && (
                  <Button size="small" icon={<EditOutlined />} onClick={startEdit}>Edit</Button>
                )}
                {isAdmin && editing && (
                  <Space>
                    <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
                    <Button size="small" type="primary" icon={<SaveOutlined />} loading={upsertContribute.isPending} onClick={() => void saveContribute()}>Save</Button>
                  </Space>
                )}
              </Flex>

              {editing ? (
                /* ── Edit form ── */
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Number</div>
                    <Input value={draftAccount} onChange={(e) => setDraftAccount(e.target.value)} placeholder="e.g. 03001234567" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Name</div>
                    <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Yasir Momand" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Payment Method</div>
                    <Input value={draftMethod} onChange={(e) => setDraftMethod(e.target.value)} placeholder="e.g. Easypaisa" />
                  </div>
                </Space>
              ) : (
                /* ── Realistic Easypaisa Debit Card ── */
                <CardWrap>
                  {/* ── Green body ── */}
                  <CardBody>
                    {/* Geometric polygon decorations (mimic real card's faceted shapes) */}
                    <CardPoly $w={260} $h={260} $top="-100px" $right="-80px" $rotate={20} $opacity={0.07} />
                    <CardPoly $w={180} $h={180} $top="-40px" $right="60px" $rotate={45} $opacity={0.05} />
                    <CardPoly $w={140} $h={140} $bottom="-50px" $left="-30px" $rotate={10} $opacity={0.05} />
                    <CardPoly $w={90} $h={90} $bottom="10px" $right="30px" $rotate={30} $opacity={0.04} />

                    {/* ── Top row: "Debit" label top-right ── */}
                    <Flex justify="flex-end" align="flex-start">
                      <div style={{
                        color: 'rgba(255,255,255,0.75)',
                        fontSize: 'clamp(8px,1.3vw,11px)',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}>
                        Debit
                      </div>
                    </Flex>

                    {/* ── Middle row: Chip + Account Number + Name ── */}
                    <div>
                      {/* EMV Chip — left side, like the real card */}
                      <div style={{
                        width: 'clamp(34px,6vw,46px)',
                        height: 'clamp(26px,4.5vw,34px)',
                        borderRadius: 5,
                        background: 'linear-gradient(145deg, #f5c518 0%, #e8a800 40%, #ffe066 70%, #d4a017 100%)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
                        position: 'relative',
                        overflow: 'hidden',
                        marginBottom: 'clamp(8px,2%,14px)',
                      }}>
                        {/* Chip grid lines */}
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: `
                            linear-gradient(rgba(0,0,0,0.13) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.13) 1px, transparent 1px)
                          `,
                          backgroundSize: '33% 33%',
                        }} />
                        {/* Center contact pad */}
                        <div style={{
                          position: 'absolute',
                          top: '50%', left: '50%',
                          transform: 'translate(-50%,-50%)',
                          width: '52%', height: '52%',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.2)',
                          background: 'rgba(255,255,255,0.18)',
                        }} />
                      </div>

                      {/* Thin separator line (like the real card) */}
                      <div style={{
                        height: 1,
                        background: 'rgba(255,255,255,0.2)',
                        marginBottom: 'clamp(8px,2%,14px)',
                      }} />

                      {/* Account number */}
                      <AccountNumber>
                        {contributeInfo?.accountNumber
                          ? contributeInfo.accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ')
                          : '•••• •••• ••••'}
                      </AccountNumber>

                      {/* Account holder name */}
                      <AccountName>
                        {contributeInfo?.accountName ?? '— — —'}
                      </AccountName>
                    </div>
                  </CardBody>

                  {/* ── White footer strip ── */}
                  <CardFooter>
                    {/* easypaisa wordmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {/* Green "e" circle */}
                      <div style={{
                        width: 'clamp(16px,2.8vw,22px)',
                        height: 'clamp(16px,2.8vw,22px)',
                        borderRadius: '50%',
                        border: '2.5px solid #00a651',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <span style={{ color: '#00a651', fontWeight: 900, fontSize: 'clamp(9px,1.6vw,13px)', lineHeight: 1 }}>e</span>
                      </div>
                      <span style={{
                        color: '#1a1a1a',
                        fontWeight: 800,
                        fontSize: 'clamp(11px,2vw,16px)',
                        letterSpacing: '-0.01em',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        easypaisa
                      </span>
                    </div>

                    {/* UnionPay logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexShrink: 0 }}>
                      {/* Red stripe */}
                      <div style={{
                        width: 'clamp(18px,3.2vw,26px)',
                        height: 'clamp(26px,4.5vw,36px)',
                        borderRadius: '4px 0 0 4px',
                        background: 'linear-gradient(180deg, #e8192c 0%, #c0001a 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: 'clamp(6px,1vw,8px)', fontWeight: 900, writingMode: 'vertical-rl', letterSpacing: '0.05em' }}>银</span>
                      </div>
                      {/* Blue stripe */}
                      <div style={{
                        width: 'clamp(18px,3.2vw,26px)',
                        height: 'clamp(26px,4.5vw,36px)',
                        background: 'linear-gradient(180deg, #1a3a8f 0%, #0d2266 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: 'clamp(6px,1vw,8px)', fontWeight: 900, writingMode: 'vertical-rl', letterSpacing: '0.05em' }}>联</span>
                      </div>
                      {/* Teal stripe */}
                      <div style={{
                        width: 'clamp(18px,3.2vw,26px)',
                        height: 'clamp(26px,4.5vw,36px)',
                        borderRadius: '0 4px 4px 0',
                        background: 'linear-gradient(180deg, #009a8e 0%, #007a70 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{ color: '#fff', fontSize: 'clamp(5px,0.9vw,7px)', fontWeight: 700 }}>UP</span>
                      </div>
                    </div>
                  </CardFooter>
                </CardWrap>
              )}
            </SectionBlock>
          </Col>
        </Row>

        <SectionBlock>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div>
              <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-strong)' }}>
                Monthly Balances Table
              </Typography.Title>
              <Typography.Text style={{ color: 'var(--text-muted)' }}>
                A clear summary of what each flatmate owes this month.
              </Typography.Text>
            </div>

            {isMobile ? (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {monthlySummary.map((row) => {
                  const status = paymentStatusMap.get(row.userId)
                  return (
                    <BalanceRow key={row.userId}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Flex justify="space-between" align="center" style={{ marginBottom: 4 }}>
                          <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 13 }}>
                            {row.fullName}
                          </Typography.Text>
                          {status?.paid ? (
                            <Tag color="success" style={{ margin: 0 }}>Paid</Tag>
                          ) : status && status.daysOverdue > 0 ? (
                            <Tag color="error" style={{ margin: 0 }}>
                              {status.daysOverdue}d overdue
                            </Tag>
                          ) : (
                            <Tag color="warning" style={{ margin: 0 }}>Pending</Tag>
                          )}
                        </Flex>
                        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Share: {formatCurrency(row.fixedShare)}
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Weekend: {formatCurrency(row.weekendShare)}
                          </Typography.Text>
                        </div>
                        <Flex justify="space-between" align="center" style={{ marginTop: 6 }}>
                          <Typography.Text strong style={{ color: '#909ffa', fontSize: 14 }}>
                            {formatCurrency(row.totalOwed)}
                          </Typography.Text>
                          {status?.paid ? (
                            <Typography.Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              Paid on {dayjs(status.date).format('MMM DD')}
                            </Typography.Text>
                          ) : (
                            <Button
                              size="small"
                              type="primary"
                              icon={<DollarOutlined />}
                              onClick={() => {
                                setSelectedUser({
                                  id: row.userId,
                                  name: row.fullName,
                                  amount: row.totalOwed,
                                })
                                setPaymentModalOpen(true)
                              }}
                            >
                              Pay
                            </Button>
                          )}
                        </Flex>
                      </div>
                    </BalanceRow>
                  )
                })}
              </Space>
            ) : (
              <Table
                rowKey="userId"
                columns={balanceColumns}
                dataSource={monthlySummary}
                pagination={false}
                scroll={{ x: 500 }}
                size="small"
              />
            )}
          </Space>
        </SectionBlock>
      </QueryState>

      {/* Payment Proof Modal */}
      {selectedUser && (
        <PaymentProofModal
          open={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false)
            setSelectedUser(null)
          }}
          userId={selectedUser.id}
          userName={selectedUser.name}
          amountOwed={selectedUser.amount}
          month={currentMonthStr}
        />
      )}
    </PageStack>
  )
}

/* ─── Announcement Ticker ─────────────────────────────────────────────────── */

import type { Announcement } from '@/lib/types'

const ITEM_HEIGHT = 90 // px per announcement card
const INTERVAL = 3500  // ms between scrolls

function AnnouncementTicker({ announcements }: { announcements: Announcement[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const list = [...announcements].reverse() // newest last → scroll up to newest

  useEffect(() => {
    if (list.length <= 1) return

    function tick() {
      setExiting(true)
      timerRef.current = setTimeout(() => {
        setActiveIndex((i) => (i + 1) % list.length)
        setExiting(false)
        timerRef.current = setTimeout(tick, INTERVAL)
      }, 500) // exit animation duration
    }

    timerRef.current = setTimeout(tick, INTERVAL)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [list.length])

  const item = list[activeIndex]
  if (!item) return null

  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes slideInUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes slideOutUp {
          from { transform: translateY(0);    opacity: 1; }
          to   { transform: translateY(-40px); opacity: 0; }
        }
        .ticker-enter { animation: slideInUp 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .ticker-exit  { animation: slideOutUp 0.45s cubic-bezier(0.55,0,0.45,1) forwards; }
      `}</style>

      <div
        key={activeIndex}
        className={exiting ? 'ticker-exit' : 'ticker-enter'}
        style={{
          border: '1.5px solid var(--border-light)',
          borderLeft: '4px solid var(--primary)',
          borderRadius: 10,
          padding: '14px 16px',
          background: 'var(--card-bg)',
          minHeight: ITEM_HEIGHT,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
          <Typography.Text strong style={{ color: 'var(--text-strong)', fontSize: 14 }}>
            {item.title}
          </Typography.Text>
          <Tag color="cyan" style={{ flexShrink: 0 }}>
            {item.creator?.full_name ?? 'Admin'}
          </Tag>
        </div>
        <Typography.Paragraph style={{ margin: '0 0 8px', color: 'var(--text-base)', fontSize: 13 }}>
          {item.content}
        </Typography.Paragraph>
        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 11 }}>
          {formatDateTime(item.created_at)}
        </Typography.Text>
      </div>

      {/* Dot indicators */}
      {list.length > 1 && (
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center', marginTop: 10 }}>
          {list.map((_, i) => (
            <div
              key={i}
              onClick={() => { setExiting(false); setActiveIndex(i) }}
              style={{
                width: i === activeIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                background: i === activeIndex ? 'var(--primary)' : 'var(--border-default)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}


