import styled from "styled-components";

export const PrintWrapper = styled.div`
  position: absolute;
  left: -9999px;
  top: -9999px;
  pointer-events: none;
`;

export const PrintContent = styled.div`
  background: #ffffff;
  width: 760px;
  font-family: "Segoe UI", Arial, sans-serif;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
`;

export const PrintHeader = styled.div`
  background: linear-gradient(135deg, var(--primary) 0%, var(--blue-700) 100%);
  padding: 24px 28px 20px;
`;

export const PrintTitle = styled.div`
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
`;

export const PrintSubtitle = styled.div`
  color: rgba(255, 255, 255, 0.75);
  font-size: 13px;
`;

export const PrintSummary = styled.div`
  display: flex;
  gap: 12px;
  padding: 16px 28px;
  background: #f8faff;
  border-bottom: 1px solid #e8edf5;
`;

export const PrintSummaryCard = styled.div<{ $color: string }>`
  flex: 1;
  background: #fff;
  border: 1.5px solid ${(p) => p.$color}22;
  border-radius: 10px;
  padding: 10px 14px;
`;

export const PrintLabel = styled.div`
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 3px;
`;

export const PrintValue = styled.div<{ $color: string }>`
  font-size: 15px;
  font-weight: 700;
  color: ${(p) => p.$color};
`;

export const PrintFooter = styled.div`
  background: #f8faff;
  border-top: 1px solid #e8edf5;
  padding: 10px 28px;
  font-size: 11px;
  color: var(--text-disabled);
  text-align: right;
`;

export const CategoryBadge = styled.span<{ $color?: string }>`
  background: ${(p) => p.$color || "var(--primary-soft)"};
  color: ${(p) => p.$color || "var(--primary)"};
  border-radius: 6px;
  padding: 2px 8px;
  font-weight: 600;
  font-size: 12px;
`;

export const PaymentHistoryText = styled.div`
  font-size: 11px;
  color: var(--text-muted);
`;

export const BillDistributionCard = styled.div`
  background: var(--content-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 16px;
`;

export const MemberCountPreview = styled.div`
  background: var(--primary-soft);
  border: 1px solid var(--primary);
  border-radius: 10px;
  padding: 12px 16px;
  min-width: 160px;
  flex-shrink: 0;
`;
