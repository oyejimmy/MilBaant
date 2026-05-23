import styled, { keyframes } from "styled-components";

/* ── Animations ─────────────────────────────────────────────────────────── */
export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ══════════════════════════════════════════════════════════════════════════
   STATS STRIP
══════════════════════════════════════════════════════════════════════════ */
export const StatsStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;

  @media (max-width: 400px) {
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    > *:nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

export const StatTile = styled.div<{ $color: string }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06),
    0 1px 2px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border-light);
  transition:
    transform 0.15s,
    box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 6px 20px rgba(0, 0, 0, 0.09);
  }

  @media (max-width: 480px) {
    padding: 12px 13px;
    border-radius: 12px;
    gap: 10px;
  }
`;

export const StatIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: ${(p) => p.$color};
  background: ${(p) => p.$color}18;
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 2px 6px ${(p) => p.$color}22;

  @media (max-width: 480px) {
    width: 34px;
    height: 34px;
    font-size: 15px;
    border-radius: 9px;
  }
`;

export const StatLabel = styled.div`
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  margin-bottom: 3px;
`;

export const StatValue = styled.div`
  font-size: clamp(14px, 3vw, 18px);
  font-weight: 800;
  color: var(--text-strong);
  letter-spacing: -0.3px;
  line-height: 1.1;
`;

export const StatSub = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`;

/* ══════════════════════════════════════════════════════════════════════════
   TOOLBAR
══════════════════════════════════════════════════════════════════════════ */
export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const FilterChips = styled.div`
  display: flex;
  gap: 6px;
`;

export const FilterChip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1.5px solid
    ${(p) => (p.$active ? "var(--primary)" : "var(--border-default)")};
  background: ${(p) => (p.$active ? "var(--primary-soft)" : "var(--card-bg)")};
  color: ${(p) => (p.$active ? "var(--primary)" : "var(--text-muted)")};
  transition: all 0.15s;
  box-shadow: ${(p) =>
    p.$active
      ? "0 2px 8px rgba(64,150,255,0.2)"
      : "0 1px 3px rgba(0,0,0,0.06)"};

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   DESKTOP — member grid cards
══════════════════════════════════════════════════════════════════════════ */
export const MemberGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
`;

export const MemberCard = styled.div<{ $paid: boolean }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 16px;
  border: 1.5px solid
    ${(p) => (p.$paid ? "rgba(82,196,26,0.35)" : "rgba(229,57,53,0.25)")};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06);
  transition:
    transform 0.15s,
    box-shadow 0.15s;
  animation: ${fadeUp} 0.4s ease forwards;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      0 1px 0 rgba(255, 255, 255, 0.8) inset,
      0 6px 18px rgba(0, 0, 0, 0.1);
  }
`;

export const MemberAvatar = styled.div<{ $paid: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 10px;
  background: ${(p) =>
    p.$paid
      ? "linear-gradient(135deg, #52c41a, #389e0d)"
      : "linear-gradient(135deg, #ff7875, #e53935)"};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 3px 8px
      ${(p) => (p.$paid ? "rgba(82,196,26,0.35)" : "rgba(229,57,53,0.3)")};
`;

export const MemberName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MemberAmount = styled.div<{ $paid: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$paid ? "#52c41a" : "var(--text-muted)")};
  margin-bottom: 10px;
`;

export const MemberDate = styled.div`
  font-size: 11.5px;
  color: var(--text-muted);
  margin-bottom: 10px;
`;

export const CardActions = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

/* ══════════════════════════════════════════════════════════════════════════
   MOBILE — horizontal swipe list
══════════════════════════════════════════════════════════════════════════ */
export const MobileList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const MobileRow = styled.div<{ $paid: boolean }>`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 13px;
  border: 1.5px solid
    ${(p) => (p.$paid ? "rgba(82,196,26,0.3)" : "rgba(229,57,53,0.2)")};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 6px rgba(0, 0, 0, 0.05);
  animation: ${fadeUp} 0.35s ease forwards;
`;

export const MobileAvatar = styled.div<{ $paid: boolean }>`
  width: 46px;
  height: 46px;
  border-radius: 13px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  background: ${(p) =>
    p.$paid
      ? "linear-gradient(135deg, #52c41a, #389e0d)"
      : "linear-gradient(135deg, #ff7875, #e53935)"};
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 3px 8px
      ${(p) => (p.$paid ? "rgba(82,196,26,0.3)" : "rgba(229,57,53,0.25)")};
`;

export const MobileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MobileName = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const MobileAmountRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
`;

export const MobileAmt = styled.span<{ $paid: boolean }>`
  font-size: 13px;
  font-weight: 600;
  color: ${(p) => (p.$paid ? "#52c41a" : "var(--text-muted)")};
`;

export const MobileDate = styled.span`
  font-size: 11px;
  color: var(--text-muted);
`;

export const MobileRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  flex-shrink: 0;
`;

/* ══════════════════════════════════════════════════════════════════════════
   SECTION CARD
══════════════════════════════════════════════════════════════════════════ */
export const SectionCard = styled.div`
  background: var(--card-bg);
  border-radius: 14px;
  padding: 20px 20px 24px;
  border: 1px solid var(--border-light);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.8) inset,
    0 2px 8px rgba(0, 0, 0, 0.06);

  @media (min-width: 768px) {
    padding: 24px 28px 28px;
    border-radius: 16px;
  }
`;

/* ══════════════════════════════════════════════════════════════════════════
   PAYMENT SUBMIT MODAL STYLES
══════════════════════════════════════════════════════════════════════════ */
export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
`;

export const ModalIconBadge = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: linear-gradient(135deg, #52c41a, #389e0d);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.3) inset,
    0 4px 12px rgba(82, 196, 26, 0.35);
  .anticon {
    color: #fff;
    font-size: 18px;
  }
`;

export const ModalBody = styled.div`
  padding: 16px 24px 0;
`;

export const TwoCol = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  .anticon {
    color: var(--primary);
    font-size: 13px;
  }
`;

export const ModalDivider = styled.div`
  height: 1px;
  background: var(--border-light);
  margin: 14px 0;
`;

export const MonthBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.25);
  color: #52c41a;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 16px;
`;

export const UploadZone = styled.div<{ $hasFile: boolean }>`
  border: 1.5px dashed
    ${(p) => (p.$hasFile ? "#52c41a" : "var(--border-default)")};
  border-radius: 12px;
  padding: 14px 16px;
  background: ${(p) =>
    p.$hasFile ? "rgba(82,196,26,0.05)" : "var(--bg-elevated)"};
  cursor: pointer;
  transition: all 0.18s;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: var(--primary);
    background: var(--primary-soft);
  }
`;

export const UploadIconBox = styled.div<{ $hasFile: boolean }>`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: ${(p) =>
    p.$hasFile ? "rgba(82,196,26,0.12)" : "rgba(64,150,255,0.10)"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  .anticon {
    font-size: 16px;
    color: ${(p) => (p.$hasFile ? "#52c41a" : "var(--primary)")};
  }
`;
