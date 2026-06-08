import { useState } from "react";
import dayjs from "dayjs";
import { App, InputNumber, Modal } from "antd";
import { Grid } from "antd";
import {
  ArrowRightOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  CreditCardOutlined,
  EditOutlined,
  HomeOutlined,
  PieChartOutlined,
  RiseOutlined,
  TeamOutlined,
  UserOutlined,
  WalletOutlined,
  FireOutlined,
  FundOutlined,
  HistoryOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { PageStack } from "@/components/Glass/index";
import { QueryState } from "@/components/QueryState";
import { useAuth } from "@/hooks/useAuth";
import { useExpenses } from "@/hooks/useExpenses";
import {
  useFlatFundAllocations,
  useFlatFundExpenses,
} from "@/hooks/useFlatFund";
import { useProfiles } from "@/hooks/useProfiles";
import {
  useMemberCountSetting,
  useContributeInfo,
  usePrevMonthRemainder,
  useUpsertPrevMonthRemainder,
} from "@/hooks/useSettings";
import { useContributionPayments } from "@/hooks/useContributions";
import { useAdvanceContribution } from "@/hooks/useAdvanceContributions";
import { useCookRequests } from "@/hooks/useCookRequests";
import { useMenuByDate } from "@/hooks/useDailyMenu";
import {
  buildMonthlyUserSummary,
  calculateFixedTotal,
  calculatePerMemberShare,
  splitExpensesByType,
} from "@/lib/expense-helpers";
import { formatCurrency } from "@/lib/formatters";

const { useBreakpoint } = Grid;

/* ─── Animations ─────────────────────────────────────────────────────────── */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ─── Time-of-day gradients ───────────────────────────────────────────────── */
// Light mode: colorful gradients based on time of day
// Dark mode: neutral card background
const GREETING_GRADIENTS_LIGHT = {
  morning: "linear-gradient(135deg, #1465a3 0%, #1c8ee5 55%, #49a5ea 100%)",
  afternoon: "linear-gradient(135deg, #1c8ee5 0%, #4096ff 55%, #49a5ea 100%)",
  evening: "linear-gradient(135deg, #0f4e7e 0%, #1465a3 50%, #1c8ee5 100%)",
} as const;

type GreetingPeriod = keyof typeof GREETING_GRADIENTS_LIGHT;

/* ─── Hero Banner ─────────────────────────────────────────────────────────── */
const HeroBanner = styled.div<{ $period: GreetingPeriod }>`
  /* Dark mode: neutral background */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px 24px;
  position: relative;
  overflow: hidden;
  animation: ${fadeUp} 0.3s ease;
  transition: background 0.6s ease;

  /* Light mode: colorful gradient */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: ${(p) => GREETING_GRADIENTS_LIGHT[p.$period]};
    border: none;
  }

  &::before {
    content: "";
    position: absolute;
    top: -50px;
    right: -50px;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.05);
    pointer-events: none;

    /* Light mode: white decorative circles */
    [data-theme="light"] &,
    :root:not([data-theme="dark"]) & {
      background: rgba(255, 255, 255, 0.07);
    }
  }
  &::after {
    content: "";
    position: absolute;
    bottom: -40px;
    left: 20px;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(128, 128, 128, 0.03);
    pointer-events: none;

    /* Light mode: white decorative circles */
    [data-theme="light"] &,
    :root:not([data-theme="dark"]) & {
      background: rgba(255, 255, 255, 0.04);
    }
  }
`;

const HeroBannerTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

const HeroBannerBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--card-border);

  /* Light mode: white border */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    border-top: 1px solid rgba(255, 255, 255, 0.12);
  }
`;

/* ─── Hero text that adapts to light/dark mode ─────────────────────────── */
const HeroDateText = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 5px;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.65);
  }
`;

const HeroGreetingText = styled.div<{ $mobile: boolean }>`
  font-size: ${(p) => (p.$mobile ? "19px" : "24px")};
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
  letter-spacing: -0.3px;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: #fff;
  }
`;

const HeroLabelText = styled.div`
  font-size: 10px;
  color: var(--text-muted);
  margin-bottom: 3px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const HeroAmountText = styled.div<{ $mobile: boolean }>`
  font-size: ${(p) => (p.$mobile ? "20px" : "28px")};
  font-weight: 800;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: #fff;
  }
`;

const HeroPillText = styled.span<{ $bold?: boolean }>`
  font-size: 11px;
  font-weight: ${(p) => (p.$bold ? 700 : 400)};
  color: ${(p) => (p.$bold ? "var(--text-primary)" : "var(--text-secondary)")};

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: ${(p) => (p.$bold ? "#fff" : "rgba(255,255,255,0.7)")};
  }
`;

const HeroMonthText = styled.span`
  font-size: 11px;
  color: var(--text-muted);

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.55);
  }
`;

const HeroPercentText = styled.span`
  font-size: 10px;
  color: var(--text-muted);
  font-weight: 600;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.6);
  }
`;

const HeroPill = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 3px 10px;

  /* Light mode: translucent white */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(4px);
  }
`;

const HeroProgressBar = styled.div`
  background: var(--border-light);

  /* Light mode: translucent white */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const HeroProgressFill = styled.div<{ $width: number; $complete: boolean }>`
  height: 100%;
  width: ${(p) => p.$width}%;
  background: ${(p) => (p.$complete ? "#86efac" : "var(--primary)")};
  border-radius: 4px;
  transition: width 0.4s ease;

  /* Light mode: white fill */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: ${(p) => (p.$complete ? "#86efac" : "#fff")};
  }
`;

/* ─── Section card ────────────────────────────────────────────────────────── */
const Card = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  gap: 8px;
`;

const CardTitle = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 7px;
`;

const LinkBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  white-space: nowrap;
  flex-shrink: 0;
  &:hover {
    opacity: 0.75;
  }
`;

/* ─── Premium Payment Card ────────────────────────────────────────────────── */
const PremiumCard = styled.div`
  position: relative;
  width: 100%;
  min-height: 190px;
  /* Dark mode: neutral background */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 24px;
  cursor: default;
  user-select: none;
  border-radius: 14px;

  /* Light mode: colorful gradient */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: linear-gradient(135deg, #0a2540 0%, #1a3a5c 40%, #0d4f3c 100%);
    border: none;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 40%,
      rgba(128, 128, 128, 0.05) 50%,
      transparent 60%
    );
    transform: translateX(-100%);
    transition: transform 0.6s ease;
    pointer-events: none;

    /* Light mode: white shimmer */
    [data-theme="light"] &,
    :root:not([data-theme="dark"]) & {
      background: linear-gradient(
        105deg,
        transparent 40%,
        rgba(255, 255, 255, 0.05) 50%,
        transparent 60%
      );
    }
  }
  &:hover::after {
    transform: translateX(100%);
  }
`;

const EditCardBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  border: 1px solid var(--card-border);
  background: var(--bg-elevated);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12px;
  z-index: 10;
  transition: background 0.15s;
  &:hover {
    background: var(--menu-hover-bg);
    color: var(--text-primary);
  }
`;

const PremiumChip = styled.div`
  width: 44px;
  height: 32px;
  border-radius: 5px;
  background: linear-gradient(
    145deg,
    #f5c518 0%,
    #e8a800 40%,
    #ffe066 70%,
    #d4a017 100%
  );
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  position: relative;
  overflow: hidden;
  margin: 12px 0 10px;
`;

const CardPoly = styled.div<{
  $w: number;
  $h: number;
  $top?: string;
  $bottom?: string;
  $left?: string;
  $right?: string;
  $rotate?: number;
  $opacity: number;
}>`
  position: absolute;
  width: ${(p) => p.$w}px;
  height: ${(p) => p.$h}px;
  background: var(--border-light);
  opacity: ${(p) => p.$opacity};
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  top: ${(p) => p.$top ?? "auto"};
  bottom: ${(p) => p.$bottom ?? "auto"};
  left: ${(p) => p.$left ?? "auto"};
  right: ${(p) => p.$right ?? "auto"};
  transform: rotate(${(p) => p.$rotate ?? 0}deg);
  pointer-events: none;
`;

/* ─── Stat cards grid ────────────────────────────────────────────────────── */
const StatCardsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StatCard = styled.div<{ $accent: string }>`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 9px 11px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${(p) => p.$accent};
    border-radius: 10px 0 0 10px;
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 14px rgba(0, 0, 0, 0.08);
  }
`;

/* ─── Dinner card ─────────────────────────────────────────────────────────── */
const DinnerCard = styled.div`
  position: relative;
  /* Dark mode: neutral background */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  overflow: hidden;
  min-height: 160px;
  cursor: default;

  /* Light mode: colorful gradient */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: linear-gradient(135deg, #0f2027 0%, #1a3a4a 50%, #1e4d3a 100%);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  /* shimmer sweep on hover */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 35%,
      rgba(128, 128, 128, 0.05) 50%,
      transparent 65%
    );
    transform: translateX(-100%);
    transition: transform 0.55s ease;
    pointer-events: none;

    /* Light mode: white shimmer */
    [data-theme="light"] &,
    :root:not([data-theme="dark"]) & {
      background: linear-gradient(
        105deg,
        transparent 35%,
        rgba(255, 255, 255, 0.05) 50%,
        transparent 65%
      );
    }
  }
  &:hover::before {
    transform: translateX(100%);
  }

  /* large decorative emoji blob */
  &::after {
    content: "🍽️";
    position: absolute;
    right: -8px;
    bottom: -12px;
    font-size: 90px;
    opacity: 0.08;
    line-height: 1;
    pointer-events: none;
    user-select: none;

    /* Light mode: slightly more visible */
    [data-theme="light"] &,
    :root:not([data-theme="dark"]) & {
      opacity: 0.1;
    }
  }
`;

const DinnerBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--bg-elevated);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.7px;
  width: fit-content;
  backdrop-filter: blur(4px);

  /* Light mode: translucent white */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.14);
    color: rgba(255, 255, 255, 0.7);
  }
`;

/* ─── Card text components for light/dark adaptation ──────────────────────── */
const CardPrimaryText = styled.div<{ $size?: number }>`
  font-size: ${(p) => p.$size ?? 24}px;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
  letter-spacing: -0.3px;

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: #fff;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`;

const CardSecondaryText = styled.div<{ $size?: number }>`
  font-size: ${(p) => p.$size ?? 12}px;
  color: var(--text-secondary);

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.65);
  }
`;

const CardMutedText = styled.div<{ $size?: number }>`
  font-size: ${(p) => p.$size ?? 11}px;
  color: var(--text-muted);

  /* Light mode: white text */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    color: rgba(255, 255, 255, 0.55);
  }
`;

const CardButton = styled.button`
  background: var(--bg-elevated);
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-primary);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;

  /* Light mode: translucent white */
  [data-theme="light"] &,
  :root:not([data-theme="dark"]) & {
    background: rgba(255, 255, 255, 0.15);
    border: 1px solid rgba(255, 255, 255, 0.22);
    color: #fff;
    backdrop-filter: blur(4px);
  }
`;

/* ─── Balance table (desktop) ────────────────────────────────────────────── */
const BalanceTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead tr th {
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--card-border);
    background: var(--card-bg);
  }
  thead tr th:last-child {
    text-align: right;
  }

  tbody tr {
    transition: background 0.12s;
    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }
  tbody tr td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--card-border);
    color: var(--text-strong);
    vertical-align: middle;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr td:last-child {
    text-align: right;
  }
`;

/* ─── Balance list (mobile) ──────────────────────────────────────────────── */
const BalanceListItem = styled.div<{ $isMe: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 0;
  border-bottom: 1px solid var(--card-border);
  background: ${(p) => (p.$isMe ? "rgba(22,119,255,0.04)" : "transparent")};
  border-radius: ${(p) => (p.$isMe ? "8px" : "0")};
  padding-left: ${(p) => (p.$isMe ? "8px" : "0")};
  padding-right: ${(p) => (p.$isMe ? "8px" : "0")};
  &:last-child {
    border-bottom: none;
  }
`;

/* ─── Flat Fund Overview ─────────────────────────────────────────────────── */
const FlatFundGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--card-border);
  border-radius: 12px;
  overflow: hidden;
  margin-top: 4px;
`;

const FlatFundCell = styled.div`
  background: var(--card-bg);
  padding: 16px 18px;
  text-align: center;
`;

const FlatFundBar = styled.div`
  margin-top: 14px;
  height: 6px;
  border-radius: 6px;
  background: var(--card-border);
  overflow: hidden;
`;

const FlatFundFill = styled.div<{ $pct: number; $over: boolean }>`
  height: 100%;
  width: ${(p) => Math.min(p.$pct, 100)}%;
  background: ${(p) =>
    p.$over ? "#ff4d4f" : "linear-gradient(90deg, #52c41a, #73d13d)"};
  border-radius: 6px;
  transition: width 0.4s ease;
`;

/* ─── Weekly dinner schedule ─────────────────────────────────────────────── */
const WEEKLY_DINNER: Record<number, string> = {
  1: "Chicken Karahi + Roti",
  2: "Daal Chawal + Salad",
  3: "Chicken Biryani",
  4: "Aloo Keema + Roti",
  5: "Chicken Qorma + Roti",
  6: "Pulao + Raita",
  0: "Nihari + Naan",
};

/* ─── Dashboard Page ──────────────────────────────────────────────────────── */

export function DashboardPage() {
  const navigate = useNavigate();
  const { userId, isAdmin, profile } = useAuth();
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [isRemainderModalOpen, setIsRemainderModalOpen] = useState(false);
  const [remainderInput, setRemainderInput] = useState<number>(0);

  const today = dayjs();
  const currentMonth = today.startOf("month");
  const monthStr = currentMonth.format("YYYY-MM");
  const todayStr = today.format("YYYY-MM-DD");
  const weekday = today.day();

  // Data queries
  const expensesQuery = useExpenses(currentMonth);
  const profilesQuery = useProfiles();
  const memberCountQuery = useMemberCountSetting();
  const paymentsQuery = useContributionPayments(monthStr);
  const cookRequestsQuery = useCookRequests();
  const flatFundAllocationsQuery = useFlatFundAllocations();
  const flatFundExpensesQuery = useFlatFundExpenses();
  const menuQuery = useMenuByDate(todayStr);
  const contributeInfoQuery = useContributeInfo();
  const prevRemainderQuery = usePrevMonthRemainder();
  const upsertPrevRemainder = useUpsertPrevMonthRemainder();
  const budgetContribution = useAdvanceContribution(monthStr);

  const expenses = expensesQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const memberCount = memberCountQuery.data ?? 6;
  const payments = paymentsQuery.data ?? [];
  const cookRequests = cookRequestsQuery.data ?? [];
  const allocations = flatFundAllocationsQuery.data ?? [];
  const flatExpenses = flatFundExpensesQuery.data ?? [];
  const todayMenu = menuQuery.data ?? null;
  const contributeInfo = contributeInfoQuery.data;
  const prevRemainder = prevRemainderQuery.data ?? 0;

  // Finance calculations
  const { fixedExpenses, weekendExpenses } = splitExpensesByType(expenses);
  const fixedTotal = calculateFixedTotal(fixedExpenses);
  const weekendTotal = calculateFixedTotal(weekendExpenses);
  const totalRecorded = fixedTotal + prevRemainder;
  const perMemberShare = calculatePerMemberShare(fixedTotal, memberCount);
  const totalContributions = payments.reduce((s, p) => s + p.amount, 0);
  const totalBudget = budgetContribution.totalBudget;
  const remainingAmount = totalBudget - fixedTotal;

  // Per-person amount: use actual contribution payment amount (all pay same),
  // falling back to the calculated share if no payments recorded yet
  const perPersonAmount =
    payments.length > 0 ? payments[0].amount : perMemberShare;
  const flatmates = profiles.filter((p) => p.role !== "cook");
  const userSummary = buildMonthlyUserSummary(
    flatmates,
    perMemberShare,
    weekendExpenses,
  );

  // Payment map — sum of amounts per user (for display)
  const paymentsByUser = new Map<string, number>();
  // Payment existence map — mirrors ContributionsPage logic (any record = paid)
  const paymentExistsByUser = new Map<string, boolean>();
  for (const p of payments) {
    paymentsByUser.set(
      p.user_id,
      (paymentsByUser.get(p.user_id) ?? 0) + p.amount,
    );
    paymentExistsByUser.set(p.user_id, true);
  }

  // A member is "paid" if any contribution payment record exists for them this month
  const paidCount = flatmates.filter(
    (m) => paymentExistsByUser.get(m.id) === true,
  ).length;

  // Cook requests
  const pendingCookRequests = cookRequests.filter(
    (r) => r.status === "pending",
  ).length;
  void pendingCookRequests; // available for future use

  // Flat fund balance
  const totalAllocated = allocations.reduce((s, a) => s + a.amount, 0);
  const totalFlatSpent = flatExpenses.reduce((s, e) => s + e.amount, 0);
  const flatFundBalance = totalAllocated - totalFlatSpent;

  // Tonight's dinner
  const tonightDinner =
    todayMenu?.dinner?.trim() || WEEKLY_DINNER[weekday] || "Not set";
  const hasDinnerFromMenu = !!todayMenu?.dinner?.trim();
  const dinnerDescription = todayMenu?.dinner_description?.trim() || null;

  // My balance
  const myBalance = userId
    ? (userSummary.find((s) => s.userId === userId)?.totalOwed ?? 0)
    : 0;
  const myPaid = userId ? (paymentsByUser.get(userId) ?? 0) : 0;
  const myOwed = Math.max(0, myBalance - myPaid);
  const iAmPaid = userId ? paymentExistsByUser.get(userId) === true : false;

  const isLoading =
    expensesQuery.isLoading ||
    profilesQuery.isLoading ||
    memberCountQuery.isLoading ||
    paymentsQuery.isLoading;

  const error =
    (expensesQuery.error as Error | null) ??
    (profilesQuery.error as Error | null) ??
    (memberCountQuery.error as Error | null);

  const greetingPeriod: GreetingPeriod = (() => {
    const h = today.hour();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  })();

  const greetingText = (() => {
    const h = today.hour();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const firstName = profile?.full_name?.split(" ")[0] ?? "Flatmate";

  async function handleSavePrevRemainder() {
    try {
      await upsertPrevRemainder.mutateAsync(Number(remainderInput) || 0);
      message.success("Previous remainder updated.");
      setIsRemainderModalOpen(false);
    } catch (err) {
      message.error(
        err instanceof Error ? err.message : "Unable to update remainder.",
      );
    }
  }

  async function handleCopyAccountNumber() {
    if (!contributeInfo?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(contributeInfo.accountNumber);
      message.success("Account number copied.");
    } catch {
      message.error("Unable to copy account number.");
    }
  }

  return (
    <PageStack>
      {/* ── Hero Banner ── */}
      <HeroBanner $period={greetingPeriod}>
        {/* Top row: greeting left, share amount right */}
        <HeroBannerTop>
          <div style={{ minWidth: 0 }}>
            <HeroDateText>{today.format("ddd, DD MMM YYYY")}</HeroDateText>
            <HeroGreetingText $mobile={isMobile}>
              {greetingText}, {firstName} 👋
            </HeroGreetingText>
          </div>

          {/* Share amount — top-right on all sizes */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <HeroLabelText>Your share</HeroLabelText>
            <HeroAmountText $mobile={isMobile}>
              {formatCurrency(myBalance)}
            </HeroAmountText>
            {iAmPaid ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#86efac",
                  fontWeight: 700,
                  marginTop: 3,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  gap: 3,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#86efac",
                    display: "inline-block",
                  }}
                />
                Paid
              </div>
            ) : myOwed > 0 ? (
              <div
                style={{
                  fontSize: 11,
                  color: "#fca5a5",
                  fontWeight: 600,
                  marginTop: 3,
                }}
              >
                {formatCurrency(myOwed)} due
              </div>
            ) : null}
          </div>
        </HeroBannerTop>

        {/* Bottom row: paid status pill + month */}
        <HeroBannerBottom>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <HeroPill>
              <HeroPillText $bold>
                {paidCount}/{flatmates.length}
              </HeroPillText>
              <HeroPillText>paid</HeroPillText>
            </HeroPill>
            <HeroMonthText>{today.format("MMMM YYYY")}</HeroMonthText>
          </div>

          {/* Progress bar */}
          {flatmates.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <HeroProgressBar
                style={{
                  width: isMobile ? 60 : 80,
                  height: 4,
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <HeroProgressFill
                  $width={(paidCount / flatmates.length) * 100}
                  $complete={paidCount === flatmates.length}
                />
              </HeroProgressBar>
              <HeroPercentText>
                {Math.round((paidCount / flatmates.length) * 100)}%
              </HeroPercentText>
            </div>
          )}
        </HeroBannerBottom>
      </HeroBanner>

      <QueryState isLoading={isLoading} error={error}>
        {/* ── Stat Cards ── */}
        <StatCardsGrid>
          {(
            [
              {
                label: "Total Recorded",
                value: formatCurrency(totalRecorded),
                sub: `${formatCurrency(fixedTotal)} shared + ${formatCurrency(prevRemainder)} remainder`,
                accent: "#1677ff",
                icon: <FundOutlined />,
              },
              {
                label: "Prev. Remainder",
                value: formatCurrency(prevRemainder),
                sub: "Carried over from last month",
                accent: "#1677ff",
                icon: <HistoryOutlined />,
              },
              {
                label: "Total Budget",
                value: formatCurrency(totalBudget),
                sub: "Estimated monthly budget",
                accent: "#faad14",
                icon: <WalletOutlined />,
              },
              {
                label: "Remaining",
                value: formatCurrency(remainingAmount),
                sub: remainingAmount > 0 ? "From budget" : "Over budget",
                accent: remainingAmount >= 0 ? "#52c41a" : "#ff4d4f",
                icon: <RiseOutlined />,
              },
              {
                label: "Contributions",
                value: formatCurrency(totalContributions),
                sub: `${paidCount} of ${flatmates.length} paid`,
                accent: "#52c41a",
                icon: <CheckCircleOutlined />,
              },
              {
                label: "Shared Total",
                value: formatCurrency(fixedTotal),
                sub: "Split equally among members",
                accent: "#7c3aed",
                icon: <TeamOutlined />,
              },
              {
                label: "Weekend Total",
                value: formatCurrency(weekendTotal),
                sub: "Split among participants only",
                accent: "#f59e0b",
                icon: <CalendarOutlined />,
              },
              {
                label: "Per Member Share",
                value: formatCurrency(perPersonAmount),
                sub: payments.length > 0 ? "From contribution payments" : `${memberCount} members`,
                accent: "#06b6d4",
                icon: <UserOutlined />,
              },
            ] as const
          ).map((item) => (
            <StatCard key={item.label} $accent={item.accent}>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    paddingTop: 2,
                    lineHeight: 1.3,
                  }}
                >
                  {item.label}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {isAdmin && item.label === "Prev. Remainder" && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemainderInput(prevRemainder);
                        setIsRemainderModalOpen(true);
                      }}
                      style={{
                        border: "1px solid var(--card-border)",
                        background: "transparent",
                        borderRadius: 5,
                        width: 20,
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--text-muted)",
                      }}
                      title="Edit previous remainder"
                    >
                      <EditOutlined style={{ fontSize: 10 }} />
                    </button>
                  )}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      flexShrink: 0,
                      background: `${item.accent}18`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: item.accent,
                    }}
                  >
                    {item.icon}
                  </div>
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--text-strong)",
                  letterSpacing: "-0.2px",
                  lineHeight: 1.2,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color: "var(--text-muted)",
                  marginTop: 2,
                  lineHeight: 1.3,
                }}
              >
                {item.sub}
              </div>
            </StatCard>
          ))}
        </StatCardsGrid>
        {/* ── Tonight's Dinner + Pay Your Share (side by side) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: contributeInfo
              ? isMobile
                ? "1fr"
                : "1fr 0.65fr"
              : "1fr",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <DinnerCard>
            {/* top: badge */}
            <DinnerBadge>
              <FireOutlined style={{ fontSize: 10 }} /> Tonight's Dinner
            </DinnerBadge>

            {/* middle: dish name + description */}
            <div>
              <CardPrimaryText $size={isMobile ? 20 : 24}>
                {tonightDinner}
              </CardPrimaryText>
              {dinnerDescription && (
                <CardSecondaryText style={{ marginTop: 5, lineHeight: 1.5 }}>
                  {dinnerDescription}
                </CardSecondaryText>
              )}
            </div>

            {/* bottom: source label / cta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              {hasDinnerFromMenu ? (
                <CardMutedText
                  style={{ display: "flex", alignItems: "center", gap: 4 }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#86efac",
                      display: "inline-block",
                    }}
                  />
                  Set from menu
                </CardMutedText>
              ) : (
                <CardMutedText>Default schedule</CardMutedText>
              )}
              <CardButton onClick={() => navigate("/daily-menu")}>
                {hasDinnerFromMenu ? "Edit menu" : "Set today's menu"}
              </CardButton>
            </div>
          </DinnerCard>

          {contributeInfo && (
            <PremiumCard>
              <CardPoly
                $w={120}
                $h={120}
                $top="-30px"
                $right="-20px"
                $opacity={0.04}
              />
              <CardPoly
                $w={80}
                $h={80}
                $bottom="-20px"
                $left="30px"
                $rotate={45}
                $opacity={0.03}
              />
              <div>
                <CardMutedText
                  $size={10}
                  style={{
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <CreditCardOutlined style={{ fontSize: 11 }} /> Pay Your Share
                </CardMutedText>
                <PremiumChip />
                <CardPrimaryText $size={13} style={{ letterSpacing: "0.5px" }}>
                  {contributeInfo.accountName}
                </CardPrimaryText>
                <CardSecondaryText style={{ marginTop: 2 }}>
                  {contributeInfo.paymentMethod} ·{" "}
                  {contributeInfo.accountNumber}
                  <button
                    type="button"
                    onClick={() => void handleCopyAccountNumber()}
                    style={{
                      marginLeft: 8,
                      background: "transparent",
                      border: "none",
                      color: "var(--text-secondary)",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                    }}
                    title="Copy account number"
                    aria-label="Copy account number"
                  >
                    <CopyOutlined />
                  </button>
                </CardSecondaryText>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                <div>
                  <CardMutedText $size={10} style={{ marginBottom: 2 }}>
                    Your share this month
                  </CardMutedText>
                  <CardPrimaryText
                    $size={22}
                    style={{ letterSpacing: "-0.5px" }}
                  >
                    {formatCurrency(perPersonAmount)}
                  </CardPrimaryText>
                </div>
                {isAdmin && (
                  <EditCardBtn
                    onClick={() => navigate("/admin")}
                    title="Edit payment info"
                  >
                    <EditOutlined />
                  </EditCardBtn>
                )}
              </div>
            </PremiumCard>
          )}
        </div>

        {/* ── Flat Fund Overview ── */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <HomeOutlined style={{ color: "#52c41a" }} />
                Flat Fund Overview
              </CardTitle>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                Shared flat money for daily expenses
              </div>
            </div>
            <LinkBtn onClick={() => navigate("/flat-expenses")}>
              View all <ArrowRightOutlined />
            </LinkBtn>
          </CardHeader>

          <FlatFundGrid>
            <FlatFundCell>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <BankOutlined /> Allocated
              </div>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 800,
                  color: "var(--text-strong)",
                }}
              >
                {formatCurrency(totalAllocated)}
              </div>
            </FlatFundCell>
            <FlatFundCell>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <WalletOutlined /> Spent
              </div>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 800,
                  color: "#ff7a45",
                }}
              >
                {formatCurrency(totalFlatSpent)}
              </div>
            </FlatFundCell>
            <FlatFundCell>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
                <RiseOutlined /> Balance
              </div>
              <div
                style={{
                  fontSize: isMobile ? 16 : 20,
                  fontWeight: 800,
                  color: flatFundBalance >= 0 ? "#52c41a" : "#ff4d4f",
                }}
              >
                {flatFundBalance >= 0 ? "+" : ""}
                {formatCurrency(flatFundBalance)}
              </div>
            </FlatFundCell>
          </FlatFundGrid>

          {/* spend progress bar */}
          {totalAllocated > 0 && (
            <div style={{ marginTop: 14 }}>
              <FlatFundBar>
                <FlatFundFill
                  $pct={(totalFlatSpent / totalAllocated) * 100}
                  $over={totalFlatSpent > totalAllocated}
                />
              </FlatFundBar>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 5,
                }}
              >
                <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                  {((totalFlatSpent / totalAllocated) * 100).toFixed(0)}% spent
                </span>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                  {formatCurrency(Math.max(0, flatFundBalance))} remaining
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* ── Monthly Balances ── */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <PieChartOutlined style={{ color: "#1677ff" }} />
                Monthly Balances
              </CardTitle>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                What each flatmate owes this month · {today.format("MMMM YYYY")}
              </div>
            </div>
            <LinkBtn onClick={() => navigate("/contributions")}>
              Manage <ArrowRightOutlined />
            </LinkBtn>
          </CardHeader>

          {isMobile ? (
            /* ── Mobile list ── */
            <div>
              {flatmates.map((member) => {
                const summary = userSummary.find((s) => s.userId === member.id);
                const paid = paymentsByUser.get(member.id) ?? 0;
                const owed = summary
                  ? Math.max(0, summary.totalOwed - paid)
                  : 0;
                const isPaid = paymentExistsByUser.get(member.id) === true;
                const isMe = member.id === userId;
                const initials = member.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <BalanceListItem key={member.id} $isMe={isMe}>
                    {/* avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        flexShrink: 0,
                        background: isPaid
                          ? "linear-gradient(135deg, #52c41a, #389e0d)"
                          : "linear-gradient(135deg, #1677ff, #0958d9)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {initials}
                    </div>
                    {/* name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "var(--text-strong)",
                          display: "flex",
                          alignItems: "center",
                          gap: 5,
                        }}
                      >
                        {member.full_name.split(" ")[0]}
                        {isMe && (
                          <span
                            style={{
                              fontSize: 10,
                              color: "#1677ff",
                              fontWeight: 700,
                            }}
                          >
                            you
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        Paid: {formatCurrency(paid)}
                      </div>
                    </div>
                    {/* status */}
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      {isPaid ? (
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: "#52c41a",
                          }}
                        >
                          ✓ Paid
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "#ff4d4f",
                          }}
                        >
                          {formatCurrency(owed)}
                        </span>
                      )}
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          marginTop: 1,
                        }}
                      >
                        of {formatCurrency(summary?.totalOwed ?? 0)}
                      </div>
                    </div>
                  </BalanceListItem>
                );
              })}
            </div>
          ) : (
            /* ── Desktop table ── */
            <BalanceTable>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Total Owed</th>
                  <th>Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {flatmates.map((member) => {
                  const summary = userSummary.find(
                    (s) => s.userId === member.id,
                  );
                  const paid = paymentsByUser.get(member.id) ?? 0;
                  const owed = summary
                    ? Math.max(0, summary.totalOwed - paid)
                    : 0;
                  const isPaid = paymentExistsByUser.get(member.id) === true;
                  const isMe = member.id === userId;
                  const initials = member.full_name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={member.id}
                      style={{
                        background: isMe ? "rgba(22,119,255,0.04)" : undefined,
                      }}
                    >
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 9,
                              flexShrink: 0,
                              background: isPaid
                                ? "linear-gradient(135deg, #52c41a, #389e0d)"
                                : "linear-gradient(135deg, #1677ff, #0958d9)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              fontWeight: 700,
                              color: "#fff",
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600 }}>
                              {member.full_name}
                            </span>
                            {isMe && (
                              <span
                                style={{
                                  fontSize: 10,
                                  color: "#1677ff",
                                  fontWeight: 700,
                                  marginLeft: 6,
                                }}
                              >
                                you
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>
                        {formatCurrency(summary?.totalOwed ?? 0)}
                      </td>
                      <td style={{ color: "#52c41a", fontWeight: 600 }}>
                        {formatCurrency(paid)}
                      </td>
                      <td
                        style={{
                          fontWeight: 700,
                          color: isPaid ? "#52c41a" : "#ff4d4f",
                        }}
                      >
                        {isPaid ? "—" : formatCurrency(owed)}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 10px",
                            borderRadius: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            background: isPaid
                              ? "rgba(82,196,26,0.1)"
                              : "rgba(255,77,79,0.08)",
                            color: isPaid ? "#52c41a" : "#ff4d4f",
                            border: `1px solid ${isPaid ? "rgba(82,196,26,0.25)" : "rgba(255,77,79,0.2)"}`,
                          }}
                        >
                          {isPaid ? "✓ Paid" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </BalanceTable>
          )}
        </Card>

        {/* ── Contribution Payments ── */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>
                <CheckCircleOutlined style={{ color: "#52c41a" }} />
                Contribution Payments
              </CardTitle>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
                {today.format("MMMM YYYY")} · per person:{" "}
                <strong style={{ color: "var(--text-strong)" }}>
                  {formatCurrency(perPersonAmount)}
                </strong>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              {/* Collected stat */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Collected
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#52c41a", letterSpacing: "-0.3px" }}>
                  {formatCurrency(totalContributions)}
                </div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                  {paidCount} of {flatmates.length} paid
                </div>
              </div>
              <LinkBtn onClick={() => navigate("/contributions")}>
                View all <ArrowRightOutlined />
              </LinkBtn>
            </div>
          </CardHeader>

          {/* Member payment rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {flatmates.map((member) => {
              const paid = paymentsByUser.get(member.id) ?? 0;
              const isPaid = paymentExistsByUser.get(member.id) === true;
              const isMe = member.id === userId;
              const initials = member.full_name
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const perPerson = perPersonAmount;

              return (
                <div
                  key={member.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: isMe
                      ? "var(--primary-soft, rgba(22,119,255,0.06))"
                      : "var(--hover-bg, rgba(0,0,0,0.02))",
                    border: `1px solid ${isPaid ? "rgba(82,196,26,0.18)" : "var(--card-border)"}`,
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      flexShrink: 0,
                      background: isPaid
                        ? "linear-gradient(135deg,#52c41a,#389e0d)"
                        : "linear-gradient(135deg,#8c8c8c,#595959)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {initials}
                  </div>

                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-strong)", display: "flex", alignItems: "center", gap: 5 }}>
                      {member.full_name.split(" ")[0]}
                      {isMe && (
                        <span style={{ fontSize: 10, color: "#1677ff", fontWeight: 700 }}>
                          you
                        </span>
                      )}
                    </div>
                    {isPaid && paid > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                        Paid {formatCurrency(paid)}
                      </div>
                    )}
                  </div>

                  {/* Amount / status */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {isPaid ? (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#52c41a", display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircleOutlined style={{ fontSize: 13 }} />
                        Paid
                      </span>
                    ) : (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ff4d4f" }}>
                          {formatCurrency(perPerson)}
                        </div>
                        <div style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          pending
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          {flatmates.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                  {paidCount} of {flatmates.length} paid
                </span>
                <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 600 }}>
                  {formatCurrency(totalContributions)} collected
                </span>
              </div>
              <div style={{ height: 5, borderRadius: 4, background: "var(--card-border)", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: 4,
                    background: paidCount === flatmates.length ? "#52c41a" : "#1677ff",
                    width: `${(paidCount / flatmates.length) * 100}%`,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          )}
        </Card>

      </QueryState>
      <Modal
        centered
        title="Prev. Remainder Carried Over"
        open={isRemainderModalOpen}
        onCancel={() => setIsRemainderModalOpen(false)}
        onOk={() => void handleSavePrevRemainder()}
        confirmLoading={upsertPrevRemainder.isPending}
        okText="Save"
      >
        <div
          style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}
        >
          Add any remaining amount from the previous month.
        </div>
        <InputNumber
          value={remainderInput}
          onChange={(value) =>
            setRemainderInput(typeof value === "number" ? value : 0)
          }
          min={0}
          precision={2}
          style={{ width: "100%" }}
          placeholder="Enter previous remainder"
        />
      </Modal>
    </PageStack>
  );
}
/* ─── end of DashboardPage ────────────────────────────────────────────────── */
