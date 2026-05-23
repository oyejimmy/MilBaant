import dayjs from 'dayjs'
import { Button, Progress, Tag } from 'antd'
import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CoffeeOutlined,
  EditOutlined,
  InboxOutlined,
  LockOutlined,
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
import { useMenuByDate } from '@/hooks/useDailyMenu'
import { splitExpensesByType } from '@/lib/expense-helpers'
import { formatCurrency } from '@/lib/formatters'
import {
  PageWrap,
  DashGrid,
  GreetingBanner,
  GreetingEmoji,
  GreetingBody,
  GreetingTitle,
  GreetingDate,
  GreetingStatsRow,
  GreetingStatItem,
  GreetingStatValue,
  GreetingStatLabel,
  DinnerCard,
  DinnerTopRow,
  DinnerSectionLabel,
  DinnerMealName,
  DinnerDescription,
  DinnerMetaRow,
  BalanceCard,
  BalanceBig,
  BalanceLabel,
  BalanceStatus,
  BalanceProgressSection,
  BalanceProgressLabels,
  BalanceProgressLabel,
  StatsRow,
  StatChip,
  StatChipValue,
  StatChipLabel,
  SectionHeader,
  ActionsGrid,
  ActionCard,
  ActionIcon,
  ActionContent,
  ActionTitle,
  ActionSub,
  ActionArrow,
  UrgentDot,
  AlertBox,
  AlertIcon,
  AlertTitle,
  AlertBody,
} from './styles'

/* ─── Fixed weekly dinner schedule (fallback when no API override) ─────────── */

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
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

/* ─── Component ─────────────────────────────────────────────────────────────── */

export function CookDashboardPage() {
  const navigate     = useNavigate()
  const today        = dayjs()
  const todayStr     = today.format('YYYY-MM-DD')
  const todayDay     = today.day()
  const currentMonth = today.startOf('month')
  const hour         = today.hour()

  /* ── Data hooks ── */
  const menuQuery      = useMenuByDate(todayStr)
  const advancesQuery  = useCookAdvances()
  const purchasesQuery = useCookPurchases()
  const flatAllocQuery = useFlatFundAllocations()
  const flatExpQuery   = useFlatFundExpenses()
  const expensesQuery  = useExpenses(currentMonth)
  const requestsQuery  = useCookRequests()

  const todayMenu  = menuQuery.data      ?? null
  const advances   = advancesQuery.data  ?? []
  const purchases  = purchasesQuery.data ?? []
  const flatAlloc  = flatAllocQuery.data ?? []
  const flatExp    = flatExpQuery.data   ?? []
  const expenses   = expensesQuery.data  ?? []
  const requests   = requestsQuery.data  ?? []

  /* ── Cook ledger ── */
  const totalAdvanced = advances.reduce((s, a) => s + a.amount, 0)
  const totalSpent    = purchases.reduce((s, p) => s + p.amount, 0)
  const balance       = totalAdvanced - totalSpent
  const usedPercent   = totalAdvanced > 0
    ? Math.min(100, (totalSpent / totalAdvanced) * 100)
    : 0
  const balanceStatus: 'good' | 'warn' | 'over' =
    balance < 0                   ? 'over' :
    balance < totalAdvanced * 0.2 ? 'warn' : 'good'

  /* ── Flat fund ── */
  const flatTotalAlloc = flatAlloc.reduce((s, a) => s + a.amount, 0)
  const flatTotalSpent = flatExp.reduce((s, e) => s + e.amount, 0)
  const flatBalance    = flatTotalAlloc - flatTotalSpent

  /* ── Weekend meals ── */
  const { weekendExpenses } = splitExpensesByType(expenses)
  const weekendTotal        = weekendExpenses.reduce((s, e) => s + e.amount, 0)

  /* ── Requests ── */
  const pendingRequests = requests.filter(r => r.status === 'pending')
  const hasPending      = pendingRequests.length > 0

  /* ── Tonight's dinner — API first, fallback to fixed schedule ── */
  const fixedDinner  = WEEKLY_DINNER[todayDay] ?? 'Not scheduled'
  const actualDinner = todayMenu?.dinner?.trim() || fixedDinner
  const dinnerDesc   = todayMenu?.dinner_description?.trim() ?? null
  const isOverridden = Boolean(
    todayMenu?.dinner?.trim() && todayMenu.dinner.trim() !== fixedDinner
  )

  /* ── Loading / error ── */
  const isLoading =
    menuQuery.isLoading      ||
    advancesQuery.isLoading  ||
    purchasesQuery.isLoading ||
    flatAllocQuery.isLoading ||
    flatExpQuery.isLoading   ||
    requestsQuery.isLoading

  const error =
    (menuQuery.error      as Error | null) ??
    (advancesQuery.error  as Error | null) ??
    (purchasesQuery.error as Error | null) ??
    (flatAllocQuery.error as Error | null) ??
    (flatExpQuery.error   as Error | null) ??
    (requestsQuery.error  as Error | null)

  /* ── Time-based greeting ── */
  const greeting =
    hour < 12 ? 'Good Morning!' :
    hour < 17 ? 'Good Afternoon!' : 'Good Evening!'
  const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'

  return (
    <PageWrap>
      <PageStack>

        {/* ─── Greeting banner ─────────────────────────────────────────── */}
        <GreetingBanner>
          <GreetingEmoji>👨‍🍳</GreetingEmoji>
          <GreetingBody>
            <GreetingTitle>{greeting} {greetingEmoji}</GreetingTitle>
            <GreetingDate>
              {DAY_NAMES[todayDay]}, {today.format('DD MMMM YYYY')}
            </GreetingDate>

            {/* Inline stats visible only on desktop via CSS */}
            <GreetingStatsRow>
              <GreetingStatItem>
                <GreetingStatValue>{advances.length}</GreetingStatValue>
                <GreetingStatLabel>Advances</GreetingStatLabel>
              </GreetingStatItem>
              <GreetingStatItem>
                <GreetingStatValue>{purchases.length}</GreetingStatValue>
                <GreetingStatLabel>Purchases</GreetingStatLabel>
              </GreetingStatItem>
              <GreetingStatItem>
                <GreetingStatValue>{requests.length}</GreetingStatValue>
                <GreetingStatLabel>Requests</GreetingStatLabel>
              </GreetingStatItem>
            </GreetingStatsRow>
          </GreetingBody>
        </GreetingBanner>

        <QueryState isLoading={isLoading} error={error}>

          {/* ─── Two-column grid: Dinner + Balance ───────────────────────── */}
          <DashGrid>

            {/* Tonight's Dinner — loaded from daily_menu API */}
            <DinnerCard>
              <DinnerTopRow>
                <MoonOutlined style={{ color: '#722ed1', fontSize: 14 }} />
                <DinnerSectionLabel>Tonight&apos;s Dinner</DinnerSectionLabel>
                {isOverridden ? (
                  <Tag
                    color="purple"
                    style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}
                  >
                    Overridden
                  </Tag>
                ) : (
                  <Tag
                    color="default"
                    style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}
                  >
                    <LockOutlined style={{ marginRight: 3 }} />
                    Fixed menu
                  </Tag>
                )}
              </DinnerTopRow>

              <DinnerMealName>{actualDinner}</DinnerMealName>

              {dinnerDesc && (
                <DinnerDescription>{dinnerDesc}</DinnerDescription>
              )}

              <DinnerMetaRow>
                <ClockCircleOutlined style={{ color: '#722ed1' }} />
                Serving at 9:00 PM
              </DinnerMetaRow>

              <Button
                size="small"
                icon={<EditOutlined />}
                style={{
                  background: 'rgba(114,46,209,0.12)',
                  borderColor: 'rgba(114,46,209,0.3)',
                  color: '#722ed1',
                  borderRadius: 8,
                  fontWeight: 600,
                }}
                onClick={() => navigate('/cook-portal/daily-menu')}
              >
                Change Dinner
              </Button>
            </DinnerCard>

            {/* Money Balance */}
            <BalanceCard $status={balanceStatus}>
              <BalanceLabel>
                {balanceStatus === 'good'
                  ? '✅ Paisa Bacha Hua Hai'
                  : balanceStatus === 'over'
                    ? '❌ Zyada Kharch Ho Gaya'
                    : '⚠️ Thora Paisa Bacha Hai'}
              </BalanceLabel>

              <BalanceBig>
                {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
              </BalanceBig>

              <BalanceStatus>
                {balanceStatus === 'good'
                  ? `${formatCurrency(balance)} remaining from advances`
                  : balanceStatus === 'over'
                    ? `${formatCurrency(Math.abs(balance))} over budget — ask admin`
                    : `Only ${formatCurrency(balance)} left — spend carefully`}
              </BalanceStatus>

              <BalanceProgressSection>
                <BalanceProgressLabels>
                  <BalanceProgressLabel>
                    Spent: {formatCurrency(totalSpent)}
                  </BalanceProgressLabel>
                  <BalanceProgressLabel>
                    Received: {formatCurrency(totalAdvanced)}
                  </BalanceProgressLabel>
                </BalanceProgressLabels>
                <Progress
                  percent={usedPercent}
                  showInfo={false}
                  strokeColor={balanceStatus === 'over' ? '#fca5a5' : '#bbf7d0'}
                  trailColor="rgba(255,255,255,0.2)"
                  size={['100%', 8]}
                />
              </BalanceProgressSection>
            </BalanceCard>
          </DashGrid>

          {/* ─── Quick stats strip ────────────────────────────────────────── */}
          <StatsRow>
            <StatChip $color="#f97316">
              <StatChipValue $color="#f97316">{purchases.length}</StatChipValue>
              <StatChipLabel>Purchases</StatChipLabel>
            </StatChip>

            <StatChip $color={hasPending ? '#f97316' : '#52c41a'}>
              <StatChipValue $color={hasPending ? '#f97316' : '#52c41a'}>
                {pendingRequests.length}
              </StatChipValue>
              <StatChipLabel>Pending</StatChipLabel>
            </StatChip>

            <StatChip $color={flatBalance >= 0 ? '#16a34a' : '#dc2626'}>
              <StatChipValue $color={flatBalance >= 0 ? '#16a34a' : '#dc2626'}>
                {formatCurrency(Math.abs(flatBalance))}
              </StatChipValue>
              <StatChipLabel>Flat Fund</StatChipLabel>
            </StatChip>
          </StatsRow>

          {/* ─── Pending requests urgent alert ───────────────────────────── */}
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

          {/* ─── Main action cards (2-col on desktop) ────────────────────── */}
          <div>
            <SectionHeader>📋 Quick Actions</SectionHeader>
            <ActionsGrid>

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
                    Purchases log
                    {purchases.length > 0 && ` · ${purchases.length} items`}
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
                  <ActionSub>Aaj ka khana dekho ya badlo</ActionSub>
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
                    ) : (
                      '✅ Requests'
                    )}
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
                    Weekend meals
                    {weekendExpenses.length > 0 &&
                      ` · ${formatCurrency(weekendTotal)} this month`}
                  </ActionSub>
                </ActionContent>
                <ActionArrow $color="#1890ff">
                  <ArrowRightOutlined />
                </ActionArrow>
              </ActionCard>

            </ActionsGrid>
          </div>

          {/* ─── Flat fund card (full-width) ──────────────────────────────── */}
          <ActionCard
            $color="#7c3aed"
            onClick={() => navigate('/cook-portal/flat-expenses')}
          >
            <ActionIcon $color="#7c3aed">
              <WalletOutlined />
            </ActionIcon>
            <ActionContent>
              <ActionTitle>🏠 Flat Fund Status</ActionTitle>
              <ActionSub>
                {flatBalance >= 0
                  ? `${formatCurrency(flatBalance)} available in flat fund`
                  : `${formatCurrency(Math.abs(flatBalance))} overspent from flat fund`}
              </ActionSub>
            </ActionContent>
            <ActionArrow $color="#7c3aed">
              <ArrowRightOutlined />
            </ActionArrow>
          </ActionCard>

          {/* ─── Balance alerts ───────────────────────────────────────────── */}
          {balanceStatus === 'over' && (
            <AlertBox $variant="error">
              <AlertIcon $variant="error">
                <WarningOutlined />
              </AlertIcon>
              <div>
                <AlertTitle $variant="error">Paisa Khatam Ho Gaya!</AlertTitle>
                <AlertBody>
                  Aap ne {formatCurrency(Math.abs(balance))} zyada kharch kar liya hai.
                  Admin se naya advance maangein.
                </AlertBody>
              </div>
            </AlertBox>
          )}

          {balanceStatus === 'warn' && (
            <AlertBox $variant="warn">
              <AlertIcon $variant="warn">
                <WarningOutlined />
              </AlertIcon>
              <div>
                <AlertTitle $variant="warn">Thora Paisa Bacha Hai</AlertTitle>
                <AlertBody>
                  Sirf {formatCurrency(balance)} bacha hai.
                  Sambhal ke kharchein ya admin se baat karein.
                </AlertBody>
              </div>
            </AlertBox>
          )}

        </QueryState>
      </PageStack>
    </PageWrap>
  )
}
