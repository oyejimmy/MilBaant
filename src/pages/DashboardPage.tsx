import { useEffect, useRef, useState } from 'react'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'
import { Alert, Button, Card, Col, Flex, Input, InputNumber, Row, Space, Table, Tag, Typography, message } from 'antd'
import { EditOutlined, HistoryOutlined, MobileOutlined, SaveOutlined, UserOutlined, WalletOutlined, CalendarOutlined, CoffeeOutlined, TeamOutlined } from '@ant-design/icons'
import { PageHeader } from '@/components/PageHeader'
import { QueryState } from '@/components/QueryState'
import { PageStack, ResponsiveGrid, SectionBlock } from '@/components/Glass'
import { SummaryStat } from '@/components/SummaryStat'
import { useAnnouncements } from '@/hooks/useAnnouncements'
import { useAuth } from '@/hooks/useAuth'
import { useExpenses } from '@/hooks/useExpenses'
import { useProfiles } from '@/hooks/useProfiles'
import { useMemberCountSetting, useContributeInfo, useUpsertContributeInfo, usePrevMonthRemainder, useUpsertPrevMonthRemainder } from '@/hooks/useSettings'
import {
  buildMonthlyUserSummary,
  calculateFixedTotal,
  calculatePerMemberShare,
  splitExpensesByType,
} from '@/lib/expense-helpers'
import { formatCurrency, formatDateTime, formatMonthYear } from '@/lib/formatters'
import type { UserMonthlySummary } from '@/lib/types'

export function DashboardPage() {
  const { isAdmin } = useAuth()
  const currentMonth = dayjs().startOf('month')
  const expensesQuery = useExpenses(currentMonth)
  const announcementsQuery = useAnnouncements()
  const profilesQuery = useProfiles()
  const memberCountQuery = useMemberCountSetting()
  const contributeQuery = useContributeInfo()
  const upsertContribute = useUpsertContributeInfo()
  const prevRemainderQuery = usePrevMonthRemainder()
  const upsertPrevRemainder = useUpsertPrevMonthRemainder()

  const [editing, setEditing] = useState(false)
  const [draftAccount, setDraftAccount] = useState('')
  const [draftMethod, setDraftMethod] = useState('')
  const [draftName, setDraftName] = useState('')
  const [editingRemainder, setEditingRemainder] = useState(false)
  const [draftRemainder, setDraftRemainder] = useState<number | null>(null)

  const expenses = expensesQuery.data ?? []
  const announcements = announcementsQuery.data ?? []
  const profiles = profilesQuery.data ?? []
  const contributeInfo = contributeQuery.data
  const prevRemainder = prevRemainderQuery.data ?? 0

  const { fixedExpenses, weekendExpenses } = splitExpensesByType(expenses)
  const fixedTotal = calculateFixedTotal(fixedExpenses)
  const weekendTotal = calculateFixedTotal(weekendExpenses)
  const totalRecorded = fixedTotal + weekendTotal
  const perMemberShare = calculatePerMemberShare(fixedTotal, memberCountQuery.data)
  const monthlySummary = buildMonthlyUserSummary(profiles, perMemberShare, weekendExpenses)
    .sort((l, r) => r.totalOwed - l.totalOwed)

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
  ]

  return (
    <PageStack>
      <QueryState isLoading={isLoading} error={error}>
        <ResponsiveGrid>
          <SummaryStat
            title="Total Recorded"
            value={formatCurrency(totalRecorded)}
            subtitle="All expenses entered for the current month."
            icon={<WalletOutlined />}
            color="#1677ff"
          />
          <SummaryStat
            title="Shared Total"
            value={formatCurrency(fixedTotal)}
            subtitle="Split equally using the member count setting."
            icon={<CalendarOutlined />}
            color="#7c3aed"
          />
          <SummaryStat
            title="Weekend Total"
            value={formatCurrency(weekendTotal)}
            subtitle="Weekend meals are split only among selected participants."
            icon={<CoffeeOutlined />}
            color="#0ea5e9"
          />
          <SummaryStat
            title="Per Member Share"
            value={formatCurrency(perMemberShare)}
            subtitle={`Using member count: ${memberCountQuery.data ?? 0}`}
            icon={<TeamOutlined />}
            color="#059669"
          />
          {/* Previous month remainder card */}
          <div style={{
            background: 'var(--surface)',
            border: `1.5px solid ${prevRemainder > 0 ? '#d9770622' : 'var(--card-border)'}`,
            borderRadius: 14,
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#888', fontWeight: 500, marginBottom: 2 }}>Remainder from Previous Month</div>
              {editingRemainder ? (
                <div>
                  <InputNumber
                    min={0}
                    precision={2}
                    prefix="Rs"
                    value={draftRemainder ?? prevRemainder}
                    onChange={(v) => setDraftRemainder(v)}
                    style={{ width: '100%' }}
                    autoFocus
                  />
                  <Flex gap={8} style={{ marginTop: 8 }}>
                    <Button size="small" type="primary" icon={<SaveOutlined />} loading={upsertPrevRemainder.isPending} onClick={() => void saveRemainder()}>Save</Button>
                    <Button size="small" onClick={() => { setEditingRemainder(false); setDraftRemainder(null) }}>Cancel</Button>
                  </Flex>
                </div>
              ) : (
                <div style={{ fontSize: 18, fontWeight: 700, color: prevRemainder > 0 ? '#d97706' : '#9ca3af', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
                  {formatCurrency(prevRemainder)}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>Carried over from last month.</div>
            </div>
            <Flex align="center" gap={6}>
              {isAdmin && !editingRemainder && (
                <Button size="small" icon={<EditOutlined />} type="text" onClick={() => { setDraftRemainder(prevRemainder); setEditingRemainder(true) }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: prevRemainder > 0 ? 'var(--icon-bg-amber)' : 'var(--soft-accent)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, color: prevRemainder > 0 ? '#d97706' : '#9ca3af',
              }}>
                <HistoryOutlined />
              </div>
            </Flex>
          </div>
        </ResponsiveGrid>

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
              <Flex justify="space-between" align="flex-start" style={{ marginBottom: 18 }}>
                <div>
                  <Typography.Title level={3} style={{ margin: 0, color: 'var(--text-strong)' }}>
                    Contribute
                  </Typography.Title>
                  <Typography.Text style={{ color: 'var(--text-muted)' }}>
                    Send your monthly share to the account below.
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

              {/* Easypaisa / Telenor brand banner */}
              <div style={{
                background: 'linear-gradient(135deg, #00a651 0%, #007a3d 100%)',
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: 500, marginBottom: 2 }}>Powered by</div>
                  <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1 }}>
                    easy<span style={{ color: '#ffe066' }}>paisa</span>
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>Telenor Microfinance Bank</div>
                </div>
                {/* Telenor T logo */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '2px solid rgba(255,255,255,0.3)',
                  flexShrink: 0,
                }}>
                  <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'sans-serif' }}>T</span>
                </div>
              </div>

              {/* Info rows */}
              <Space direction="vertical" size={10} style={{ width: '100%', flex: 1 }}>
                {/* Account Number */}
                <div style={{ background: 'var(--content-bg)', border: '1.5px solid #e0eaff', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--icon-bg-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MobileOutlined style={{ fontSize: 14, color: '#1677ff' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Number</div>
                    {editing ? (
                      <Input value={draftAccount} onChange={(e) => setDraftAccount(e.target.value)} size="small" style={{ marginTop: 2 }} />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#1677ff', letterSpacing: 1.5, marginTop: 1 }}>{contributeInfo?.accountNumber ?? '—'}</div>
                    )}
                  </div>
                </div>

                {/* Account Name */}
                <div style={{ background: 'var(--content-bg)', border: '1.5px solid #ede9fe', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--icon-bg-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <UserOutlined style={{ fontSize: 14, color: '#7c3aed' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Account Name</div>
                    {editing ? (
                      <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} size="small" style={{ marginTop: 2 }} />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#7c3aed', marginTop: 1 }}>{contributeInfo?.accountName ?? '—'}</div>
                    )}
                  </div>
                </div>

                {/* Payment Method */}
                <div style={{ background: 'var(--content-bg)', border: '1.5px solid #d1fae5', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--icon-bg-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#00a651' }}>EP</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Payment Method</div>
                    {editing ? (
                      <Input value={draftMethod} onChange={(e) => setDraftMethod(e.target.value)} size="small" style={{ marginTop: 2 }} />
                    ) : (
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#00a651', marginTop: 1 }}>{contributeInfo?.paymentMethod ?? '—'}</div>
                    )}
                  </div>
                </div>
              </Space>
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

            <Table
              rowKey="userId"
              columns={balanceColumns}
              dataSource={monthlySummary}
              pagination={false}
              scroll={{ x: 760 }}
            />
          </Space>
        </SectionBlock>
      </QueryState>
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
          border: '1.5px solid #e0eaff',
          borderLeft: '4px solid #1677ff',
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
                background: i === activeIndex ? '#1677ff' : '#d1d5db',
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
