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
import { useNavigate } from 'react-router-dom'
import { PageStack } from '@/components/Glass/index'
import { QueryState } from '@/components/QueryState'
import { useCookAdvances, useCookPurchases } from '@/hooks/useCook'
import { useCookRequests } from '@/hooks/useCookRequests'
import { useFlatFundAllocations, useFlatFundExpenses } from '@/hooks/useFlatFund'
import { useExpenses } from '@/hooks/useExpenses'
import { splitExpensesByType } from '@/lib/expense-helpers'
import { formatCurrency } from '@/lib/formatters'
import {
  PageWrap, GreetingBanner, GreetingEmoji, ActionCard, ActionIcon, ActionContent,
  ActionTitle, ActionSub, ActionArrow, BalanceCard, BalanceBig, BalanceLabel,
  BalanceStatus, DinnerCard, DinnerEmoji, SectionHeader, UrgentDot,
} from './styles'

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
