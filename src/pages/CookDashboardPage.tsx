import dayjs from 'dayjs'
import { Button, Progress } from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  InboxOutlined,
  MoonOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import styled, { keyframes } from 'styled-components'
import { useNavigate } from 'react-router-dom'
import { PageStack } from '@/components/Glass'
import { QueryState } from '@/components/QueryState'
import { useCookAdvances, useCookPurchases } from '@/hooks/useCook'
import { useCookRequests } from '@/hooks/useCookRequests'
import { useFlatFundAllocations, useFlatFundExpenses } from '@/hooks/useFlatFund'
import { useExpenses } from '@/hooks/useExpenses'
import { splitExpensesByType } from '@/lib/expense-helpers'
import { formatCurrency } from '@/lib/formatters'

/* ─── Animations ──────────────────────────────────────────────────────────── */

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.04); }
`

/* ─── Styled ──────────────────────────────────────────────────────────────── */

const PageWrap = styled.div`
  animation: ${fadeUp} 0.3s ease;
  max-width: 600px;
  margin: 0 auto;
`

/* ── Greeting banner ── */
const GreetingBanner = styled.div`
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 20px rgba(249,115,22,0.35);
`

const GreetingEmoji = styled.div`
  font-size: 44px;
  line-height: 1;
  flex-shrink: 0;
`

/* ── Big action card ── */
const ActionCard = styled.button<{ $color: string; $urgent?: boolean }>`
  width: 100%;
  background: var(--card-bg);
  border: 2px solid ${p => p.$urgent ? p.$color : 'var(--card-border)'};
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  text-align: left;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  box-shadow: ${p => p.$urgent
    ? `0 4px 16px ${p.$color}30`
    : '0 2px 8px rgba(0,0,0,0.06)'};
  animation: ${p => p.$urgent ? pulse : 'none'} 2s ease-in-out infinite;

  &:active {
    transform: scale(0.97);
  }

  &:hover {
    border-color: ${p => p.$color};
    box-shadow: 0 6px 20px ${p => p.$color}25;
    transform: translateY(-2px);
  }
`

const ActionIcon = styled.div<{ $color: string }>`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: ${p => p.$color}18;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
  color: ${p => p.$color};
`

const ActionContent = styled.div`
  flex: 1;
  min-width: 0;
`

const ActionTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 3px;
`

const ActionSub = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
`

const ActionArrow = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${p => p.$color}15;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${p => p.$color};
  font-size: 13px;
  flex-shrink: 0;
`

/* ── Balance card ── */
const BalanceCard = styled.div<{ $status: 'good' | 'warn' | 'over' }>`
  background: ${p =>
    p.$status === 'good' ? 'linear-gradient(135deg, #166534 0%, #16a34a 100%)' :
    p.$status === 'over' ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)' :
                           'linear-gradient(135deg, #92400e 0%, #d97706 100%)'};
  border-radius: 16px;
  padding: 20px 22px;
  color: #fff;
  box-shadow: ${p =>
    p.$status === 'good' ? '0 4px 20px rgba(22,163,74,0.4)' :
    p.$status === 'over' ? '0 4px 20px rgba(220,38,38,0.4)' :
                           '0 4px 20px rgba(217,119,6,0.4)'};
`

const BalanceBig = styled.div`
  font-size: clamp(28px, 8vw, 40px);
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin: 8px 0 4px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`

const BalanceLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255,255,255,0.75);
`

const BalanceStatus = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-top: 6px;
`

/* ── Dinner card ── */
const DinnerCard = styled.div`
  background: linear-gradient(135deg, rgba(114,46,209,0.12) 0%, rgba(114,46,209,0.04) 100%);
  border: 2px solid rgba(114,46,209,0.2);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`

const DinnerEmoji = styled.div`
  font-size: 40px;
  line-height: 1;
  flex-shrink: 0;
`

/* ── Section header ── */
const SectionHeader = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-left: 2px;
`

/* ── Urgent badge ── */
const UrgentDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f97316;
  flex-shrink: 0;
  animation: ${pulse} 1.5s ease-in-out infinite;
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

const DAY_NAMES: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function CookDashboardPage() {
  const navigate = useNavigate()
  const currentMonth = dayjs().startOf('month')
  const todayDay = dayjs().day()

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

  /* ── Cook Ledger ── */
  const totalAdvanced = advances.reduce((s, a) => s + a.amount, 0)
  const totalSpent    = purchases.reduce((s, p) => s + p.amount, 0)
  const balance       = totalAdvanced - totalSpent
  const usedPercent   = totalAdvanced > 0 ? Math.min(100, (totalSpent / totalAdvanced) * 100) : 0
  const balanceStatus: 'good' | 'warn' | 'over' =
    balance > totalAdvanced * 0.2 ? 'good' :
    balance < 0 ? 'over' : 'warn'

  /* ── Flat Fund ── */
  const flatTotalAllocated = flatAlloc.reduce((s, a) => s + a.amount, 0)
  const flatTotalSpent     = flatExp.reduce((s, e) => s + e.amount, 0)
  const flatBalance        = flatTotalAllocated - flatTotalSpent

  /* ── Weekend meals ── */
  const { weekendExpenses } = splitExpensesByType(expenses)
  const weekendTotal        = weekendExpenses.reduce((s, e) => s + e.amount, 0)

  /* ── Requests ── */
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const hasPending      = pendingRequests.length > 0

  /* ── Tonight's dinner ── */
  const todayDinner = WEEKLY_DINNER[todayDay]

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

  /* ── Greeting based on time ── */
  const hour = dayjs().hour()
  const greeting =
    hour < 12 ? 'Good Morning! 🌅' :
    hour < 17 ? 'Good Afternoon! ☀️' :
                'Good Evening! 🌙'

  return (
    <PageWrap>
      <PageStack>

        {/* ── Greeting ── */}
        <GreetingBanner>
          <GreetingEmoji>👨‍🍳</GreetingEmoji>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
              {greeting}
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
              {DAY_NAMES[todayDay]}, {dayjs().format('DD MMMM YYYY')}
            </div>
          </div>
        </GreetingBanner>

        <QueryState isLoading={isLoading} error={error}>

          {/* ── Tonight's Dinner ── */}
          <DinnerCard>
            <DinnerEmoji>🍽️</DinnerEmoji>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#722ed1', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 4 }}>
                Tonight's Dinner
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-strong)', lineHeight: 1.2 }}>
                {todayDinner}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClockCircleOutlined />
                Serving at 9:00 PM
              </div>
            </div>
            <Button
              type="text"
              size="small"
              style={{ color: '#722ed1', padding: '4px 8px', flexShrink: 0 }}
              onClick={() => navigate('/cook-portal/daily-menu')}
            >
              Change <ArrowRightOutlined />
            </Button>
          </DinnerCard>

          {/* ── Money Balance ── */}
          <div>
            <SectionHeader>💰 Paisa / Money</SectionHeader>
            <BalanceCard $status={balanceStatus}>
              <BalanceLabel>
                {balanceStatus === 'good' ? '✅ Paisa Bacha Hua Hai' :
                 balanceStatus === 'over' ? '❌ Zyada Kharch Ho Gaya' :
                                            '⚠️ Thora Paisa Bacha Hai'}
              </BalanceLabel>
              <BalanceBig>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </BalanceBig>
              <BalanceStatus>
                {balanceStatus === 'good'
                  ? `Aap ke paas ${formatCurrency(balance)} bacha hua hai`
                  : balanceStatus === 'over'
                  ? `${formatCurrency(Math.abs(balance))} zyada kharch ho gaya`
                  : `Sirf ${formatCurrency(balance)} bacha hai — sambhal ke kharchein`}
              </BalanceStatus>

              {/* Progress bar */}
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    Kharch: {formatCurrency(totalSpent)}
                  </span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
                    Mila: {formatCurrency(totalAdvanced)}
                  </span>
                </div>
                <Progress
                  percent={usedPercent}
                  showInfo={false}
                  strokeColor={balanceStatus === 'over' ? '#fca5a5' : '#bbf7d0'}
                  trailColor="rgba(255,255,255,0.2)"
                  size={['100%', 8]}
                />
              </div>
            </BalanceCard>
          </div>

          {/* ── Pending Requests alert ── */}
          {hasPending && (
            <ActionCard
              $color="#f97316"
              $urgent
              onClick={() => navigate('/cook-portal/cook-requests')}
            >
              <ActionIcon $color="#f97316">
                <InboxOutlined />
              </ActionIcon>
              <ActionContent>
                <ActionTitle>
                  {pendingRequests.length} Naya Request! 📬
                </ActionTitle>
                <ActionSub>
                  Flatmates ne kuch mangwaya hai — dekho aur jawab do
                </ActionSub>
              </ActionContent>
              <ActionArrow $color="#f97316">
                <ArrowRightOutlined />
              </ActionArrow>
            </ActionCard>
          )}

          {/* ── Main Actions ── */}
          <div>
            <SectionHeader>📋 Kya Karna Hai?</SectionHeader>

            {/* Log Purchase */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <ActionCard
                $color="#f97316"
                onClick={() => navigate('/cook-portal/cook')}
              >
                <ActionIcon $color="#f97316">
                  <ShoppingCartOutlined />
                </ActionIcon>
                <ActionContent>
                  <ActionTitle>🛒 Khareedari Likhein</ActionTitle>
                  <ActionSub>
                    Jo cheez kharidi — woh yahan likhein
                    {purchases.length > 0 && ` · ${purchases.length} items logged`}
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color="#f97316">
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>

              <ActionCard
                $color="#722ed1"
                onClick={() => navigate('/cook-portal/daily-menu')}
              >
                <ActionIcon $color="#722ed1">
                  <MoonOutlined />
                </ActionIcon>
                <ActionContent>
                  <ActionTitle>🍛 Khana Menu</ActionTitle>
                  <ActionSub>
                    Aaj ka khana dekho ya badlo
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color="#722ed1">
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>

              <ActionCard
                $color={hasPending ? '#f9a825' : '#52c41a'}
                $urgent={hasPending}
                onClick={() => navigate('/cook-portal/cook-requests')}
              >
                <ActionIcon $color={hasPending ? '#f9a825' : '#52c41a'}>
                  {hasPending ? <InboxOutlined /> : <CheckCircleOutlined />}
                </ActionIcon>
                <ActionContent>
                  <ActionTitle>
                    {hasPending ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        📬 Requests
                        <UrgentDot />
                      </span>
                    ) : '✅ Requests'}
                  </ActionTitle>
                  <ActionSub>
                    {hasPending
                      ? `${pendingRequests.length} pending — jawab dena hai`
                      : 'Sab requests complete hain'}
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color={hasPending ? '#f9a825' : '#52c41a'}>
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>

              <ActionCard
                $color="#1890ff"
                onClick={() => navigate('/cook-portal/weekend-expenses')}
              >
                <ActionIcon $color="#1890ff">
                  <CoffeeOutlined />
                </ActionIcon>
                <ActionContent>
                  <ActionTitle>🍽️ Weekend Khana</ActionTitle>
                  <ActionSub>
                    Weekend ka khana likhein
                    {weekendExpenses.length > 0 && ` · ${formatCurrency(weekendTotal)} this month`}
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color="#1890ff">
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>

              <ActionCard
                $color="#909ffa"
                onClick={() => navigate('/cook-portal/flat-expenses')}
              >
                <ActionIcon $color="#909ffa">
                  <WalletOutlined />
                </ActionIcon>
                <ActionContent>
                  <ActionTitle>🏠 Ghar Ka Paisa</ActionTitle>
                  <ActionSub>
                    Flat fund — {flatBalance >= 0
                      ? `${formatCurrency(flatBalance)} bacha hua`
                      : `${formatCurrency(Math.abs(flatBalance))} zyada kharch`}
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color="#909ffa">
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>
            </div>
          </div>

          {/* ── Low balance warning ── */}
          {balanceStatus === 'over' && (
            <div style={{
              background: 'rgba(220,38,38,0.1)',
              border: '2px solid rgba(220,38,38,0.3)',
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <WarningOutlined style={{ color: '#dc2626', fontSize: 22, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                  Paisa Khatam Ho Gaya!
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Aap ne {formatCurrency(Math.abs(balance))} zyada kharch kar liya hai.
                  Admin se naya advance maangein.
                </div>
              </div>
            </div>
          )}

          {balanceStatus === 'warn' && (
            <div style={{
              background: 'rgba(217,119,6,0.1)',
              border: '2px solid rgba(217,119,6,0.25)',
              borderRadius: 14,
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
            }}>
              <WarningOutlined style={{ color: '#d97706', fontSize: 22, flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#d97706', marginBottom: 4 }}>
                  Thora Paisa Bacha Hai
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Sirf {formatCurrency(balance)} bacha hai. Sambhal ke kharchein
                  ya admin se baat karein.
                </div>
              </div>
            </div>
          )}

        </QueryState>
      </PageStack>
    </PageWrap>
  )
}
