import dayjs from 'dayjs'
import { Button, Col, Flex, Progress, Row, Space, Tag, Typography } from 'antd'
import {
  ArrowRightOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  FundOutlined,
  InboxOutlined,
  MoonOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { PageStack, ResponsiveGrid, SectionBlock } from '@/components/Glass'
import { QueryState } from '@/components/QueryState'
import { SummaryStat } from '@/components/SummaryStat'
import { useCookAdvances, useCookPurchases } from '@/hooks/useCook'
import { useCookRequests } from '@/hooks/useCookRequests'
import { useFlatFundAllocations, useFlatFundExpenses } from '@/hooks/useFlatFund'
import { useExpenses } from '@/hooks/useExpenses'
import { splitExpensesByType } from '@/lib/expense-helpers'
import { PURCHASE_CATEGORY_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/formatters'

/* ─── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const PageWrap = styled.div`
  animation: ${fadeUp} 0.25s ease;
`

const WelcomeBanner = styled.div`
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.1) 0%, rgba(249, 115, 22, 0.03) 100%);
  border: 1.5px solid rgba(249, 115, 22, 0.2);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    padding: 12px 14px;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
`

const BalanceBar = styled.div<{ $status: 'surplus' | 'deficit' | 'zero' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  border-left: 4px solid ${({ $status }) =>
    $status === 'surplus' ? '#52c41a' : $status === 'deficit' ? '#ff4d4f' : '#909ffa'};
  flex-wrap: wrap;

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;

    > div:last-child {
      width: 100%;
    }
  }
`

const BalanceAmount = styled.div<{ $status: 'surplus' | 'deficit' | 'zero' }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ $status }) =>
    $status === 'surplus' ? '#52c41a' : $status === 'deficit' ? '#ff4d4f' : '#909ffa'};
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1;

  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`

const QuickLinkCard = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
    border-color: rgba(249, 115, 22, 0.3);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    padding: 12px 14px;
  }
`

const QuickLinkIcon = styled.div<{ $color: string }>`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: ${({ $color }) => $color}18;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  color: ${({ $color }) => $color};
  flex-shrink: 0;

  @media (max-width: 480px) {
    width: 34px;
    height: 34px;
    font-size: 15px;
  }
`

const RecentItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  background: var(--content-bg);
  border: 1px solid var(--card-border);
`

const TonightBox = styled.div`
  padding: 16px 18px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(114, 46, 209, 0.08) 0%, rgba(114, 46, 209, 0.02) 100%);
  border: 2px solid rgba(114, 46, 209, 0.15);
  position: relative;
  overflow: hidden;
  min-height: 90px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 480px) {
    padding: 14px;
    min-height: 80px;
  }
`

const MiniStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (max-width: 360px) {
    grid-template-columns: 1fr 1fr;
  }
`

const MiniStat = styled.div`
  text-align: center;
  padding: 10px 8px;
  background: var(--content-bg);
  border-radius: 8px;
  border: 1px solid var(--card-border);
`

/* ─── Weekly dinner schedule ─────────────────────────────────────────────── */

const WEEKLY_DINNER: Record<number, string> = {
  1: 'Chicken Karahi + Roti',
  2: 'Daal Chawal + Salad',
  3: 'Chicken Biryani',
  4: 'Aloo Keema + Roti',
  5: 'Chicken Qorma + Roti',
  6: 'Pulao + Raita',
  0: 'Nihari + Naan',
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function CookDashboardPage() {
  const navigate = useNavigate()
  const currentMonth = dayjs().startOf('month')

  const advancesQuery  = useCookAdvances()
  const purchasesQuery = useCookPurchases()
  const flatAllocQuery = useFlatFundAllocations()
  const flatExpQuery   = useFlatFundExpenses()
  const expensesQuery  = useExpenses(currentMonth)
  const requestsQuery  = useCookRequests()

  const advances  = advancesQuery.data  ?? []
  const purchases = purchasesQuery.data ?? []
  const flatAlloc = flatAllocQuery.data ?? []
  const flatExp   = flatExpQuery.data   ?? []
  const expenses  = expensesQuery.data  ?? []
  const requests  = requestsQuery.data  ?? []

  /* ── Cook Ledger summary ── */
  const totalAdvanced = advances.reduce((s, a) => s + a.amount, 0)
  const totalSpent    = purchases.reduce((s, p) => s + p.amount, 0)
  const balance       = totalAdvanced - totalSpent
  const balanceStatus = balance > 0.01 ? 'surplus' : balance < -0.01 ? 'deficit' : 'zero'
  const usedPercent   = totalAdvanced > 0 ? Math.min(100, (totalSpent / totalAdvanced) * 100) : 0

  /* ── Flat Fund summary ── */
  const flatTotalAllocated = flatAlloc.reduce((s, a) => s + a.amount, 0)
  const flatTotalSpent     = flatExp.reduce((s, e) => s + e.amount, 0)
  const flatBalance        = flatTotalAllocated - flatTotalSpent

  /* ── Weekend meals this month ── */
  const { weekendExpenses } = splitExpensesByType(expenses)
  const weekendTotal        = weekendExpenses.reduce((s, e) => s + e.amount, 0)

  /* ── Tonight's dinner ── */
  const todayDinner = WEEKLY_DINNER[dayjs().day()]

  /* ── Recent purchases (last 4) ── */
  const recentPurchases = purchases.slice(0, 4)

  /* ── Recent flat fund expenses (last 3) ── */
  const recentFlatExp = flatExp.slice(0, 3)

  /* ── Requests ── */
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const recentRequests  = requests.filter((r) => r.status === 'pending' || r.status === 'acknowledged').slice(0, 4)

  const isLoading =
    advancesQuery.isLoading  ||
    purchasesQuery.isLoading ||
    flatAllocQuery.isLoading ||
    flatExpQuery.isLoading   ||
    requestsQuery.isLoading

  const error =
    (advancesQuery.error  as Error | null) ??
    (purchasesQuery.error as Error | null) ??
    (flatAllocQuery.error as Error | null) ??
    (flatExpQuery.error   as Error | null) ??
    (requestsQuery.error  as Error | null)

  /* ── Quick links ── */
  const quickLinks = [
    {
      label: 'Cook Ledger',
      subtitle: `${purchases.length} purchases logged`,
      icon: <CoffeeOutlined />,
      color: '#f97316',
      path: '/cook-portal/cook',
    },
    {
      label: 'Daily Menu',
      subtitle: `Tonight: ${todayDinner.split('+')[0].trim()}`,
      icon: <CalendarOutlined />,
      color: '#722ed1',
      path: '/cook-portal/daily-menu',
    },
    {
      label: 'Weekend Meals',
      subtitle: formatCurrency(weekendTotal) + ' this month',
      icon: <ShoppingCartOutlined />,
      color: '#1890ff',
      path: '/cook-portal/weekend-expenses',
    },
    {
      label: 'Flat Fund',
      subtitle: `Balance: ${formatCurrency(flatBalance)}`,
      icon: <FundOutlined />,
      color: '#909ffa',
      path: '/cook-portal/flat-expenses',
    },
    {
      label: 'Requests',
      subtitle: `${pendingRequests.length} pending`,
      icon: <InboxOutlined />,
      color: pendingRequests.length > 0 ? '#f9a825' : '#52c41a',
      path: '/cook-portal/cook-requests',
    },
  ]

  return (
    <PageWrap>
      <PageStack>

        {/* ── Welcome banner ── */}
        <WelcomeBanner>
          <div>
            <Typography.Title
              level={4}
              style={{ margin: 0, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <CoffeeOutlined style={{ color: '#f97316' }} />
              Cook Dashboard
            </Typography.Title>
            <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              {dayjs().format('dddd, DD MMMM YYYY')}
            </Typography.Text>
          </div>
          <Tag
            style={{
              background: 'rgba(249,115,22,0.1)',
              border: '1px solid rgba(249,115,22,0.25)',
              color: '#f97316',
              fontWeight: 700,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 20,
              flexShrink: 0,
            }}
          >
            Cook Portal
          </Tag>
        </WelcomeBanner>

        <QueryState isLoading={isLoading} error={error}>

          {/* ── Summary stats ── */}
          <ResponsiveGrid>
            <SummaryStat
              title="Total Advanced"
              value={formatCurrency(totalAdvanced)}
              subtitle="Money given to cook"
              icon={<WalletOutlined />}
              color="#52c41a"
            />
            <SummaryStat
              title="Total Spent"
              value={formatCurrency(totalSpent)}
              subtitle="Items purchased"
              icon={<ShopOutlined />}
              color="#ff4d4f"
            />
            <SummaryStat
              title="Weekend Meals"
              value={formatCurrency(weekendTotal)}
              subtitle={`${weekendExpenses.length} entries this month`}
              icon={<ShoppingCartOutlined />}
              color="#1890ff"
            />
            <SummaryStat
              title="Flat Fund Balance"
              value={formatCurrency(flatBalance)}
              subtitle={`${formatCurrency(flatTotalAllocated)} allocated`}
              icon={<FundOutlined />}
              color={flatBalance >= 0 ? '#909ffa' : '#ff4d4f'}
            />
          </ResponsiveGrid>

          {/* ── Cook Ledger balance ── */}
          <SectionBlock>
            <Flex align="center" justify="space-between" wrap gap={8} style={{ marginBottom: 14 }}>
              <Flex align="center" gap={8}>
                <CoffeeOutlined style={{ color: '#f97316', fontSize: 15 }} />
                <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                  Cook Ledger Balance
                </Typography.Title>
              </Flex>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, color: '#f97316', height: 'auto' }}
                onClick={() => navigate('/cook-portal/cook')}
              >
                Full ledger <ArrowRightOutlined />
              </Button>
            </Flex>

            <BalanceBar $status={balanceStatus}>
              <div>
                <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Current Balance
                </Typography.Text>
                <BalanceAmount $status={balanceStatus}>
                  {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
                </BalanceAmount>
                <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4, display: 'block' }}>
                  {balanceStatus === 'surplus'
                    ? `${formatCurrency(balance)} remaining to spend`
                    : balanceStatus === 'deficit'
                    ? `Overspent by ${formatCurrency(Math.abs(balance))}`
                    : 'Advance fully used — perfectly balanced'}
                </Typography.Text>
              </div>
              <div style={{ minWidth: 140, width: '100%', maxWidth: 220 }}>
                <Flex justify="space-between" style={{ marginBottom: 6 }}>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Used {usedPercent.toFixed(0)}%
                  </Typography.Text>
                  <Typography.Text style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {formatCurrency(totalSpent)} / {formatCurrency(totalAdvanced)}
                  </Typography.Text>
                </Flex>
                <Progress
                  percent={usedPercent}
                  showInfo={false}
                  strokeColor={balanceStatus === 'deficit' ? '#ff4d4f' : '#52c41a'}
                  railColor="var(--card-border)"
                  size="small"
                />
              </div>
            </BalanceBar>

            {recentPurchases.length > 0 && (
              <div style={{ marginTop: 14 }}>
                <Typography.Text style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
                  Recent purchases:
                </Typography.Text>
                <Space direction="vertical" size={6} style={{ width: '100%' }}>
                  {recentPurchases.map((p) => (
                    <RecentItem key={p.id}>
                      <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                        <Tag
                          color={PURCHASE_CATEGORY_COLORS[p.category] ?? 'default'}
                          style={{ margin: 0, fontSize: 10, textTransform: 'capitalize', flexShrink: 0 }}
                        >
                          {p.category}
                        </Tag>
                        <Typography.Text
                          style={{ fontSize: 12, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {p.item}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, display: 'none' }}
                          className="hide-xs"
                        >
                          {formatDate(p.date)}
                        </Typography.Text>
                      </Flex>
                      <Typography.Text strong style={{ fontSize: 12, color: '#ff4d4f', flexShrink: 0 }}>
                        -{formatCurrency(p.amount)}
                      </Typography.Text>
                    </RecentItem>
                  ))}
                </Space>
              </div>
            )}
          </SectionBlock>

          {/* ── Tonight's dinner + Flat Fund ── */}
          <Row gutter={[16, 16]} align="stretch">
            <Col xs={24} lg={12} style={{ display: 'flex' }}>
              <SectionBlock style={{ flex: 1 }}>
                <Flex align="center" justify="space-between" style={{ marginBottom: 12 }} wrap gap={8}>
                  <Flex align="center" gap={8}>
                    <MoonOutlined style={{ color: '#722ed1', fontSize: 15 }} />
                    <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                      Tonight's Dinner
                    </Typography.Title>
                  </Flex>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, color: '#722ed1', height: 'auto' }}
                    onClick={() => navigate('/cook-portal/daily-menu')}
                  >
                    Full menu <ArrowRightOutlined />
                  </Button>
                </Flex>

                <TonightBox>
                  <div style={{
                    position: 'absolute', top: -20, right: -20,
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(114, 46, 209, 0.05)',
                    pointerEvents: 'none',
                  }} />
                  <Typography.Text style={{
                    fontSize: 'clamp(16px, 4vw, 20px)',
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
                    fontSize: 13,
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
                </TonightBox>

                <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 10 }}>
                  {dayjs().format('dddd, DD MMMM YYYY')}
                </Typography.Text>
              </SectionBlock>
            </Col>

            <Col xs={24} lg={12} style={{ display: 'flex' }}>
              <SectionBlock style={{ flex: 1 }}>
                <Flex align="center" justify="space-between" style={{ marginBottom: 14 }} wrap gap={8}>
                  <Flex align="center" gap={8}>
                    <FundOutlined style={{ color: '#909ffa', fontSize: 15 }} />
                    <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                      Flat Fund
                    </Typography.Title>
                  </Flex>
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, color: '#909ffa', height: 'auto' }}
                    onClick={() => navigate('/cook-portal/flat-expenses')}
                  >
                    View details <ArrowRightOutlined />
                  </Button>
                </Flex>

                <MiniStatGrid style={{ marginBottom: 14 }}>
                  <MiniStat>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Allocated</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>
                      {formatCurrency(flatTotalAllocated)}
                    </div>
                  </MiniStat>
                  <MiniStat>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Spent</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#ff4d4f' }}>
                      {formatCurrency(flatTotalSpent)}
                    </div>
                  </MiniStat>
                  <MiniStat>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Balance</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: flatBalance >= 0 ? '#52c41a' : '#ff4d4f' }}>
                      {flatBalance >= 0 ? '+' : ''}{formatCurrency(flatBalance)}
                    </div>
                  </MiniStat>
                </MiniStatGrid>

                {recentFlatExp.length > 0 && (
                  <Space direction="vertical" size={6} style={{ width: '100%' }}>
                    {recentFlatExp.map((e) => (
                      <RecentItem key={e.id}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {e.description}
                          </Typography.Text>
                          <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {e.member?.full_name ?? '—'}
                          </Typography.Text>
                        </div>
                        <Typography.Text strong style={{ fontSize: 12, color: '#ff4d4f', flexShrink: 0 }}>
                          -{formatCurrency(e.amount)}
                        </Typography.Text>
                      </RecentItem>
                    ))}
                  </Space>
                )}
              </SectionBlock>
            </Col>
          </Row>

          {/* ── Weekend Meals summary ── */}
          <SectionBlock>
            <Flex align="center" justify="space-between" style={{ marginBottom: 14 }} wrap gap={8}>
              <Flex align="center" gap={8}>
                <ShoppingCartOutlined style={{ color: '#1890ff', fontSize: 15 }} />
                <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                  Weekend Meals
                </Typography.Title>
                <Tag color="blue" style={{ marginLeft: 4 }}>
                  {dayjs().format('MMM YYYY')}
                </Tag>
              </Flex>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, color: '#1890ff', height: 'auto' }}
                onClick={() => navigate('/cook-portal/weekend-expenses')}
              >
                View all <ArrowRightOutlined />
              </Button>
            </Flex>

            <Row gutter={[10, 10]} style={{ marginBottom: weekendExpenses.length > 0 ? 12 : 0 }}>
              <Col xs={8}>
                <MiniStat>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Spend</div>
                  <div style={{ fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 800, color: '#1890ff' }}>
                    {formatCurrency(weekendTotal)}
                  </div>
                </MiniStat>
              </Col>
              <Col xs={8}>
                <MiniStat>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Entries</div>
                  <div style={{ fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 800, color: 'var(--text-strong)' }}>
                    {weekendExpenses.length}
                  </div>
                </MiniStat>
              </Col>
              <Col xs={8}>
                <MiniStat>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Avg / Entry</div>
                  <div style={{ fontSize: 'clamp(13px, 3vw, 16px)', fontWeight: 800, color: 'var(--text-strong)' }}>
                    {weekendExpenses.length > 0
                      ? formatCurrency(weekendTotal / weekendExpenses.length)
                      : '—'}
                  </div>
                </MiniStat>
              </Col>
            </Row>

            {weekendExpenses.slice(0, 3).length > 0 && (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {weekendExpenses.slice(0, 3).map((e) => (
                  <RecentItem key={e.id}>
                    <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                        {dayjs(e.date).format('DD MMM')}
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 12, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.description || 'Weekend meal'}
                      </Typography.Text>
                      <Tag color="purple" style={{ margin: 0, fontSize: 10, flexShrink: 0 }}>
                        {e.creator?.full_name?.split(' ')[0] ?? '—'}
                      </Tag>
                    </Flex>
                    <Typography.Text strong style={{ fontSize: 12, color: 'var(--text-strong)', flexShrink: 0 }}>
                      {formatCurrency(e.amount)}
                    </Typography.Text>
                  </RecentItem>
                ))}
              </Space>
            )}
          </SectionBlock>

          {/* ── Pending Requests ── */}
          <SectionBlock>
            <Flex align="center" justify="space-between" style={{ marginBottom: 14 }} wrap gap={8}>
              <Flex align="center" gap={8}>
                <InboxOutlined style={{ color: '#f9a825', fontSize: 15 }} />
                <Typography.Title level={5} style={{ margin: 0, color: 'var(--text-strong)' }}>
                  Item Requests
                </Typography.Title>
                {pendingRequests.length > 0 && (
                  <Tag color="warning" style={{ marginLeft: 4 }}>
                    {pendingRequests.length} pending
                  </Tag>
                )}
              </Flex>
              <Button
                type="link"
                size="small"
                style={{ padding: 0, color: '#f9a825', height: 'auto' }}
                onClick={() => navigate('/cook-portal/cook-requests')}
              >
                View all <ArrowRightOutlined />
              </Button>
            </Flex>

            {recentRequests.length === 0 ? (
              <Flex align="center" gap={10} style={{ padding: '16px 0', color: 'var(--text-muted)' }}>
                <CheckCircleOutlined style={{ fontSize: 18, color: '#52c41a' }} />
                <Typography.Text style={{ color: 'var(--text-muted)' }}>
                  No pending requests — all clear!
                </Typography.Text>
              </Flex>
            ) : (
              <Space direction="vertical" size={6} style={{ width: '100%' }}>
                {recentRequests.map((r) => (
                  <RecentItem key={r.id}>
                    <Flex align="center" gap={8} style={{ flex: 1, minWidth: 0 }}>
                      <Tag
                        color={r.status === 'pending' ? 'warning' : 'processing'}
                        style={{ margin: 0, fontSize: 10, flexShrink: 0 }}
                      >
                        {r.status === 'pending' ? 'Pending' : 'Acknowledged'}
                      </Tag>
                      <Typography.Text
                        strong
                        style={{ fontSize: 12, color: 'var(--text-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {r.item}
                      </Typography.Text>
                      {r.quantity && (
                        <Typography.Text style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                          {r.quantity}
                        </Typography.Text>
                      )}
                    </Flex>
                    <Tag color="blue" style={{ margin: 0, fontSize: 10, flexShrink: 0 }}>
                      {r.requester?.full_name?.split(' ')[0] ?? '—'}
                    </Tag>
                  </RecentItem>
                ))}
              </Space>
            )}
          </SectionBlock>

          {/* ── Quick navigation ── */}
          <SectionBlock>
            <Typography.Title level={5} style={{ margin: '0 0 14px', color: 'var(--text-strong)' }}>
              Quick Navigation
            </Typography.Title>
            <Row gutter={[10, 10]}>
              {quickLinks.map((link) => (
                <Col xs={24} sm={12} key={link.path}>
                  <QuickLinkCard onClick={() => navigate(link.path)}>
                    <Flex align="center" gap={12} style={{ flex: 1, minWidth: 0 }}>
                      <QuickLinkIcon $color={link.color}>
                        {link.icon}
                      </QuickLinkIcon>
                      <div style={{ minWidth: 0 }}>
                        <Typography.Text strong style={{ color: 'var(--text-strong)', display: 'block', fontSize: 13 }}>
                          {link.label}
                        </Typography.Text>
                        <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                          {link.subtitle}
                        </Typography.Text>
                      </div>
                    </Flex>
                    <ArrowRightOutlined style={{ color: 'var(--text-muted)', fontSize: 12, flexShrink: 0 }} />
                  </QuickLinkCard>
                </Col>
              ))}
            </Row>
          </SectionBlock>

        </QueryState>
      </PageStack>
    </PageWrap>
  )
}
