import styled, { keyframes } from "styled-components";

// ── Animations ────────────────────────────────────────────────────────────────

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.04); }
`;

// ── Page wrapper ──────────────────────────────────────────────────────────────

export const PageWrap = styled.div`
  animation: ${fadeUp} 0.3s ease;
  width: 100%;
`;

// ── Greeting banner ───────────────────────────────────────────────────────────

export const GreetingBanner = styled.div`
  background: linear-gradient(
    135deg,
    #1a0cea99 0%,
    #f91666b8 55%,
    #fb3c3c8a 100%
  );
  border-radius: 20px;
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 6px 28px rgba(249, 115, 22, 0.42);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -50%;
    right: -5%;
    width: 220px;
    height: 220px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.07);
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -60%;
    right: 20%;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    pointer-events: none;
  }

  @media (min-width: 992px) {
    padding: 28px 36px;
    border-radius: 24px;
    align-items: flex-start;
  }
`;

export const GreetingEmoji = styled.div`
  font-size: 48px;
  line-height: 1;
  flex-shrink: 0;

  @media (min-width: 992px) {
    font-size: 60px;
  }
`;

export const GreetingBody = styled.div`
  flex: 1;
  min-width: 0;
`;

export const GreetingTitle = styled.div`
  font-size: clamp(18px, 4vw, 26px);
  font-weight: 800;
  color: #fff;
  line-height: 1.2;
`;

export const GreetingDate = styled.div`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 4px;

  @media (min-width: 992px) {
    font-size: 15px;
    margin-top: 6px;
  }
`;

export const GreetingStatsRow = styled.div`
  display: none;

  @media (min-width: 992px) {
    display: flex;
    gap: 28px;
    margin-top: 18px;
  }
`;

export const GreetingStatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const GreetingStatValue = styled.div`
  font-size: 22px;
  font-weight: 900;
  color: #fff;
  line-height: 1;
`;

export const GreetingStatLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.6px;
`;

// ── Two-column grid (desktop) ─────────────────────────────────────────────────

export const DashGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
  }
`;

// ── Dinner card ───────────────────────────────────────────────────────────────

export const DinnerCard = styled.div`
  background: linear-gradient(
    135deg,
    rgba(114, 46, 209, 0.1) 0%,
    rgba(139, 92, 246, 0.04) 100%
  );
  border: 2px solid rgba(114, 46, 209, 0.22);
  border-radius: 20px;
  padding: 20px 22px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "🍛";
    position: absolute;
    right: 14px;
    bottom: 6px;
    font-size: 60px;
    opacity: 0.1;
    line-height: 1;
    pointer-events: none;
  }

  @media (min-width: 992px) {
    padding: 24px 26px;
  }
`;

export const DinnerTopRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
`;

export const DinnerSectionLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  color: #722ed1;
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

export const DinnerMealName = styled.div`
  font-size: clamp(18px, 4vw, 24px);
  font-weight: 800;
  color: var(--text-strong);
  line-height: 1.25;
  margin-bottom: 6px;
`;

export const DinnerDescription = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 8px;
`;

export const DinnerMetaRow = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 14px;
`;

// ── Balance card ──────────────────────────────────────────────────────────────

export const BalanceCard = styled.div<{ $status: "good" | "warn" | "over" }>`
  background: ${({ $status }) =>
    $status === "good"
      ? "linear-gradient(135deg, #14532d 0%, #166534 55%, #16a34a 100%)"
      : $status === "over"
        ? "linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #dc2626 100%)"
        : "linear-gradient(135deg, #78350f 0%, #92400e 55%, #d97706 100%)"};
  border-radius: 20px;
  padding: 20px 22px;
  color: #fff;
  box-shadow: ${({ $status }) =>
    $status === "good"
      ? "0 6px 26px rgba(22,163,74,0.45)"
      : $status === "over"
        ? "0 6px 26px rgba(220,38,38,0.45)"
        : "0 6px 26px rgba(217,119,6,0.45)"};
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: -30%;
    right: -10%;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    pointer-events: none;
  }

  @media (min-width: 992px) {
    padding: 24px 26px;
  }
`;

export const BalanceLabel = styled.div`
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 6px;
`;

export const BalanceBig = styled.div`
  font-size: clamp(30px, 8vw, 44px);
  font-weight: 900;
  color: #fff;
  line-height: 1;
  margin: 4px 0 6px;
  font-family: "Plus Jakarta Sans", sans-serif;
  letter-spacing: -1.5px;
`;

export const BalanceStatus = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.4;
`;

export const BalanceProgressSection = styled.div`
  margin-top: 16px;
`;

export const BalanceProgressLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
`;

export const BalanceProgressLabel = styled.span`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.72);
`;

// ── Quick stats strip ─────────────────────────────────────────────────────────

export const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  @media (min-width: 992px) {
    gap: 16px;
  }
`;

export const StatChip = styled.div<{ $color: string }>`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-top: 3px solid ${({ $color }) => $color};
  border-radius: 16px;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }

  @media (min-width: 992px) {
    padding: 18px 14px;
  }
`;

export const StatChipValue = styled.div<{ $color: string }>`
  font-size: clamp(16px, 4vw, 22px);
  font-weight: 900;
  color: ${({ $color }) => $color};
  line-height: 1;
`;

export const StatChipLabel = styled.div`
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// ── Section header ────────────────────────────────────────────────────────────

export const SectionHeader = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-left: 2px;
`;

// ── Action cards grid ─────────────────────────────────────────────────────────

export const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;

  @media (min-width: 992px) {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
`;

export const ActionCard = styled.button<{ $color: string; $urgent?: boolean }>`
  width: 100%;
  background: var(--card-bg);
  border: 2px solid
    ${({ $urgent, $color }) => ($urgent ? $color : "var(--card-border)")};
  border-radius: 18px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
  box-shadow: ${({ $urgent, $color }) =>
    $urgent ? `0 4px 18px ${$color}32` : "0 2px 8px rgba(0,0,0,0.05)"};
  animation: ${({ $urgent }) => ($urgent ? pulse : "none")} 2s ease-in-out
    infinite;

  &:active {
    transform: scale(0.97);
  }

  &:hover {
    border-color: ${({ $color }) => $color};
    box-shadow: 0 8px 24px ${({ $color }) => $color}28;
    transform: translateY(-3px);
  }

  @media (min-width: 992px) {
    padding: 20px 22px;
    gap: 16px;
  }
`;

export const ActionIcon = styled.div<{ $color: string }>`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: ${({ $color }) => $color}1a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  color: ${({ $color }) => $color};

  @media (min-width: 992px) {
    width: 58px;
    height: 58px;
    font-size: 26px;
    border-radius: 16px;
  }
`;

export const ActionContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ActionTitle = styled.div`
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 3px;

  @media (min-width: 992px) {
    font-size: 16px;
  }
`;

export const ActionSub = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.4;

  @media (min-width: 992px) {
    font-size: 13px;
  }
`;

export const ActionArrow = styled.div<{ $color: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: ${({ $color }) => $color}18;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  font-size: 12px;
  flex-shrink: 0;
`;

// ── Urgent pulse dot ──────────────────────────────────────────────────────────

export const UrgentDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f97316;
  flex-shrink: 0;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

// ── Alert banners ─────────────────────────────────────────────────────────────

export const AlertBox = styled.div<{ $variant: "error" | "warn" }>`
  background: ${({ $variant }) =>
    $variant === "error" ? "rgba(220,38,38,0.08)" : "rgba(217,119,6,0.08)"};
  border: 2px solid
    ${({ $variant }) =>
      $variant === "error" ? "rgba(220,38,38,0.25)" : "rgba(217,119,6,0.22)"};
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
`;

export const AlertIcon = styled.div<{ $variant: "error" | "warn" }>`
  color: ${({ $variant }) => ($variant === "error" ? "#dc2626" : "#d97706")};
  font-size: 22px;
  flex-shrink: 0;
  margin-top: 1px;
`;

export const AlertTitle = styled.div<{ $variant: "error" | "warn" }>`
  font-size: 15px;
  font-weight: 700;
  color: ${({ $variant }) => ($variant === "error" ? "#dc2626" : "#d97706")};
  margin-bottom: 3px;
`;

export const AlertBody = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
`;
