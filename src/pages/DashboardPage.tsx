import { useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { App, Button, Col, Flex, Grid, Input, InputNumber, Row, Space, Table, Tag, Typography } from 'antd'
import { EditOutlined, FundOutlined, HistoryOutlined, SaveOutlined, WalletOutlined, CalendarOutlined, CoffeeOutlined, TeamOutlined, CheckCircleOutlined, DollarOutlined, MoonOutlined, ClockCircleOutlined, ArrowRightOutlined, HomeOutlined } from '@ant-design/icons'
import styled from 'styled-components'
import { PageStack, ResponsiveGrid, SectionBlock } from '@/components/Glass'
import { QueryState } from '@/components/QueryState'
import { SummaryStat } from '@/components/SummaryStat'
import { PaymentProofModal } from '@/components/PaymentProofModal'
import { PageHeader } from '@/components/PageHeader'
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
import { formatCurrency } from '@/lib/formatters'
import type { UserMonthlySummary } from '@/lib/types'
import { useNavigate } from 'react-router-dom'

const { useBreakpoint } = Grid

/* ─── Animations ──────────────────────────────────────────────────────────── */

/* ─── Premium Payment Card ────────────────────────────────────────────────── */
const PremiumCard = styled.div`
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 200px;
  background: linear-gradient(135deg, #0a2540 0%, #1a3a5c 35%, #0d4f3c 70%, #0a3d2e 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: clamp(18px, 4%, 28px) clamp(20px, 5%, 32px);
  cursor: default;
  user-select: none;
  border-radius: 14px;

  /* Shimmer on hover */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    pointer-events: none;
  }
  &:hover::after {
    transform: translateX(100%);
  }
`

const EditCardBtn = styled.button`
  position: absolute;
  top: 14px;
  right: 14px;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 13px;
  z-index: 10;
  backdrop-filter: blur(8px);
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: rgba(255,255,255,0.22);
    color: #fff;
  }
`

const PremiumCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`

const PremiumChip = styled.div`
  width: clamp(38px, 7vw, 52px);
  height: clamp(28px, 5vw, 38px);
  border-radius: 6px;
  background: linear-gradient(145deg, #f5c518 0%, #e8a800 40%, #ffe066 70%, #d4a017 100%);
  box-shadow: 0 3px 10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3);
  position: relative;
  overflow: hidden;
  margin: clamp(14px, 3%, 22px) 0 clamp(10px, 2%, 16px);
  z-index: 1;
`

const PremiumNumber = styled.div`
  color: #fff;
  font-size: clamp(16px, 3.5vw, 22px);
  font-weight: 600;
  letter-spacing: 0.22em;
  font-family: 'Courier New', 'Lucida Console', monospace;
  text-shadow: 0 1px 8px rgba(0,0,0,0.5);
  position: relative;
  z-index: 1;
  margin-bottom: clamp(12px, 2.5%, 20px);
`

const PremiumCardBottom = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  position: relative;
  z-index: 1;
  gap: 12px;
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

/* ─── Polygon decoration (reused in premium card) ─────────────────────────── */

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
  max-width: 400px;
  margin: 0 auto;
`

const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 8px;
`

const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-strong);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--text-muted);
  }
`

/* ─── Role Welcome Banner — removed (now plain text, no styled component needed) ─── */


export function DashboardPage() {
  const { isAdmin } = useAuth()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const screens = useBreakpoint()
  const isMobile = !screens.md
  const currentMonth = dayjs().startOf('month')
  const currentMonthStr = currentMonth.format('YYYY-MM')
  const expensesQuery = useExpenses(currentMonth)
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
    profilesQuery.isLoading ||
    memberCountQuery.isLoading

  const error =
    (expensesQuery.error as Error | null) ??
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
      {/* ── Breadcrumb + Page Header ── */}
      <PageHeader
        title="Dashboard"
        subtitle={`${dayjs().format('MMMM YYYY')} · Flat expense overview`}
        breadcrumbs={[
          { title: 'Home', path: '/', icon: <HomeOutlined /> },
          { title: 'Dashboard' },
        ]}
      />


      <QueryState isLoading={isLoading} error={error}>

        {/* ── Stat Cards ── */}
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

          {/* Remainder stat card */}
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

        {/* ── Row 1: Tonight's Dinner + Contribute ── */}
        <Row gutter={[20, 20]} align="stretch">
          {/* Tonight's Dinner */}
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <SectionBlock style={{ flex: 1 }}>
              <SectionTitle>
                <SectionLabel>
                  <MoonOutlined style={{ color: '#722ed1', fontSize: 18 }} />
                  <div>
                    <h4>Tonight's Dinner</h4>
                    <p>{dayjs().format('dddd, DD MMMM YYYY')}</p>
                  </div>
                </SectionLabel>
                <Button type="link" size="small" icon={<ArrowRightOutlined />} onClick={() => navigate('/daily-menu')} style={{ padding: 0 }}>
                  View Menu
                </Button>
              </SectionTitle>
              <div style={{
                padding: '20px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.02) 100%)',
                border: '2px solid rgba(114, 46, 209, 0.15)',
                position: 'relative',
                overflow: 'hidden',
                minHeight: 110,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(114, 46, 209, 0.05)', pointerEvents: 'none' }} />
                <Typography.Text style={{ fontSize: 'clamp(18px, 3.5vw, 24px)', fontWeight: 700, color: '#722ed1', display: 'block', lineHeight: 1.3, position: 'relative', zIndex: 1, marginBottom: 8 }}>
                  {todayDinner}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                  <ClockCircleOutlined />
                  Serving at 9:00 PM
                </Typography.Text>
              </div>
            </SectionBlock>
          </Col>

          {/* Contribute */}
          <Col xs={24} lg={12} style={{ display: 'flex' }}>
            <SectionBlock style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              {editing ? (
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <Typography.Text strong style={{ fontSize: 15, color: 'var(--text-strong)' }}>Edit Payment Details</Typography.Text>
                    <Space>
                      <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
                      <Button size="small" type="primary" icon={<SaveOutlined />} loading={upsertContribute.isPending} onClick={() => void saveContribute()}>Save</Button>
                    </Space>
                  </div>
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
                </div>
              ) : (
                <PremiumCard>
                  {/* Edit button — floating top-right, admin only */}
                  {isAdmin && (
                    <EditCardBtn onClick={startEdit} title="Edit payment details">
                      <EditOutlined />
                    </EditCardBtn>
                  )}

                  {/* Card background decorations */}
                  <CardPoly $w={320} $h={320} $top="-120px" $right="-90px" $rotate={15} $opacity={0.06} />
                  <CardPoly $w={200} $h={200} $top="-30px" $right="80px" $rotate={40} $opacity={0.04} />
                  <CardPoly $w={160} $h={160} $bottom="-60px" $left="-40px" $rotate={8} $opacity={0.04} />
                  <CardPoly $w={100} $h={100} $bottom="20px" $right="40px" $rotate={25} $opacity={0.03} />

                  {/* Card top: network + debit label */}
                  <PremiumCardTop>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Contactless symbol */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.8 }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.15)" />
                        <path d="M8.5 8.5C9.9 7.1 11.9 6.5 14 7l1-1.7C12.2 4.4 9.4 5.2 7.1 7.5L8.5 8.5z" fill="white" />
                        <path d="M6.1 10.9C7 8.8 8.8 7.2 11 6.6l-.8-1.8C7.8 5.6 5.6 7.6 4.5 10.2L6.1 10.9z" fill="white" opacity="0.7" />
                        <path d="M10.9 10.1C11.9 9.4 13.2 9.3 14.3 9.9l.9-1.6C13.5 7.5 11.5 7.5 9.9 8.6L10.9 10.1z" fill="white" opacity="0.9" />
                        <circle cx="12" cy="13" r="2" fill="white" />
                      </svg>
                      <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        {contributeInfo?.paymentMethod ?? 'Easypaisa'}
                      </span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                      Debit
                    </span>
                  </PremiumCardTop>

                  {/* EMV Chip */}
                  <PremiumChip>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.12) 1px, transparent 1px)`, backgroundSize: '33% 33%' }} />
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '52%', height: '52%', borderRadius: 2, border: '1px solid rgba(0,0,0,0.18)', background: 'rgba(255,255,255,0.15)' }} />
                  </PremiumChip>

                  {/* Account number */}
                  <PremiumNumber>
                    {contributeInfo?.accountNumber
                      ? contributeInfo.accountNumber.replace(/(\d{4})(?=\d)/g, '$1  ')
                      : '•••• •••• •••• ••••'}
                  </PremiumNumber>

                  {/* Card bottom: name + logo */}
                  <PremiumCardBottom>
                    <div>
                      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                        Account Holder
                      </div>
                      <div style={{ color: '#fff', fontSize: 'clamp(12px, 2.5vw, 15px)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {contributeInfo?.accountName ?? '— — —'}
                      </div>
                    </div>

                    {/* Easypaisa logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 8, padding: '5px 10px', backdropFilter: 'blur(8px)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid #00e676', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ color: '#00e676', fontWeight: 900, fontSize: 10, lineHeight: 1 }}>e</span>
                      </div>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                        easypaisa
                      </span>
                    </div>
                  </PremiumCardBottom>
                </PremiumCard>
              )}
            </SectionBlock>
          </Col>
        </Row>

        {/* ── Row 2: Flat Fund Overview ── */}
        <Row gutter={[20, 20]}>
          <Col xs={24}>
            <SectionBlock>
              <SectionTitle>
                <SectionLabel>
                  <FundOutlined style={{ color: '#909ffa', fontSize: 18 }} />
                  <div>
                    <h4>Flat Fund Overview</h4>
                    <p>Shared flat money for daily expenses</p>
                  </div>
                </SectionLabel>
                <Button type="link" size="small" icon={<ArrowRightOutlined />} onClick={() => navigate('/flat-expenses')} style={{ padding: 0 }}>
                  View Details
                </Button>
              </SectionTitle>
              <Row gutter={[12, 12]} style={{ marginBottom: flatExpenses.slice(0, 3).length > 0 ? 16 : 0 }}>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--content-bg)', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Allocated</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(flatTotalAllocated)}</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--content-bg)', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Spent</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#ff4d4f' }}>{formatCurrency(flatTotalSpent)}</div>
                  </div>
                </Col>
                <Col xs={8}>
                  <div style={{ textAlign: 'center', padding: '12px 8px', background: 'var(--content-bg)', borderRadius: 10, border: '1px solid var(--card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Balance</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: flatBalance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {flatBalance >= 0 ? '+' : ''}{formatCurrency(flatBalance)}
                    </div>
                  </div>
                </Col>
              </Row>
              {flatExpenses.slice(0, 3).length > 0 && (
                <div>
                  <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8, fontWeight: 600 }}>Recent expenses</Typography.Text>
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {flatExpenses.slice(0, 3).map((e) => (
                      <Flex key={e.id} justify="space-between" align="center" style={{ padding: '8px 12px', background: 'var(--content-bg)', borderRadius: 8, border: '1px solid var(--card-border)' }}>
                        <div>
                          <Typography.Text style={{ fontSize: 13, color: 'var(--text-strong)', fontWeight: 500 }}>{e.description}</Typography.Text>
                          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{e.member?.full_name ?? '—'}</Typography.Text>
                        </div>
                        <Typography.Text strong style={{ fontSize: 13, color: '#ff4d4f' }}>-{formatCurrency(e.amount)}</Typography.Text>
                      </Flex>
                    ))}
                  </Space>
                </div>
              )}
            </SectionBlock>
          </Col>
        </Row>

        {/* ── Monthly Balances Table ── */}
        <SectionBlock>
          <SectionTitle>
            <SectionLabel>
              <TeamOutlined style={{ color: 'var(--primary)', fontSize: 18 }} />
              <div>
                <h4>Monthly Balances</h4>
                <p>What each flatmate owes this month · {dayjs().format('MMMM YYYY')}</p>
              </div>
            </SectionLabel>
            <Button type="link" size="small" icon={<ArrowRightOutlined />} onClick={() => navigate('/contributions')} style={{ padding: 0 }}>
              Contributions
            </Button>
          </SectionTitle>

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
                          <Tag color="error" style={{ margin: 0 }}>{status.daysOverdue}d overdue</Tag>
                        ) : (
                          <Tag color="warning" style={{ margin: 0 }}>Pending</Tag>
                        )}
                      </Flex>
                      <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>Share: {formatCurrency(row.fixedShare)}</Typography.Text>
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weekend: {formatCurrency(row.weekendShare)}</Typography.Text>
                      </div>
                      <Flex justify="space-between" align="center" style={{ marginTop: 6 }}>
                        <Typography.Text strong style={{ color: '#909ffa', fontSize: 14 }}>{formatCurrency(row.totalOwed)}</Typography.Text>
                        {status?.paid ? (
                          <Typography.Text style={{ fontSize: 10, color: 'var(--text-muted)' }}>Paid on {dayjs(status.date).format('MMM DD')}</Typography.Text>
                        ) : (
                          <Button size="small" type="primary" icon={<DollarOutlined />} onClick={() => { setSelectedUser({ id: row.userId, name: row.fullName, amount: row.totalOwed }); setPaymentModalOpen(true) }}>Pay</Button>
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
        </SectionBlock>
      </QueryState>

      {/* Payment Proof Modal */}
      {selectedUser && (
        <PaymentProofModal
          open={paymentModalOpen}
          onClose={() => { setPaymentModalOpen(false); setSelectedUser(null) }}
          userId={selectedUser.id}
          userName={selectedUser.name}
          amountOwed={selectedUser.amount}
          month={currentMonthStr}
        />
      )}
    </PageStack>
  )
}
