import { Tag, Typography } from "antd";
import styled from "styled-components";

// ============================================
// Section Card Components
// ============================================

export const SectionCard = styled.div`
  background: var(--bg-card, #fff);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light, #e8e8e8);
`;

export const SectionHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
`;

export const SectionTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const SectionBody = styled.div``;

export const SectionActions = styled.div`
  display: flex;
  gap: 8px;
`;

// ============================================
// Dinner Components
// ============================================

export const DinnerDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
`;

export const DinnerMeal = styled(Tag)`
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 10px;
`;

export const DinnerMeta = styled.div`
  font-size: 12px;
  color: var(--text-secondary, #666);
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

export const DinnerInfo = styled.div`
  flex: 1;
`;

export const DinnerDescText = styled(Typography.Text)`
  font-size: 13px;
  color: var(--text-secondary, #666);
  margin-bottom: 4px;
`;

export const DinnerMetaOverride = styled.span`
  color: var(--primary, #722ed1);
  font-style: italic;
`;

// ============================================
// Weekly Row Components
// ============================================

export const WeeklyRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light, #e8e8e8);
`;

export const DayLabel = styled.span`
  font-weight: 800;
`;

// ============================================
// Breakfast Components
// ============================================

export const BreakfastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
`;

export const PersonCard = styled.div<{ $isMe?: boolean }>`
  background: ${(props) =>
    props.$isMe ? "var(--bg-highlight, #f0f5ff)" : "var(--bg-card, #fff)"};
  border: 1px solid
    ${(props) =>
      props.$isMe ? "var(--primary, #722ed1)" : "var(--border-light, #e8e8e8)"};
  border-radius: 8px;
  padding: 10px;
  transition: all 0.2s;
`;

export const PersonRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const PersonName = styled.span`
  font-weight: 500;
  font-size: 13px;
`;

export const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const PrefTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

// ============================================
// Suggestion Components
// ============================================

export const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

export const SuggestionItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 10px;
  background: var(--bg-card, #fff);
  border-radius: 8px;
  border: 1px solid var(--border-light, #e8e8e8);
`;

export const SuggestionText = styled.div`
  font-size: 14px;
  color: var(--text-primary, #1a1a1a);
  margin-bottom: 4px;
`;

export const SuggestionMeta = styled.div`
  font-size: 11px;
  color: var(--text-secondary, #666);
`;

export const SuggestionContent = styled.div`
  flex: 1;
`;

export const SuggestionActions = styled.div`
  display: flex;
  gap: 4px;
  align-items: flex-start;
`;

export const AddSuggestionRow = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

export const EmptySuggestion = styled.div`
  text-align: center;
  padding: 32px;
  color: var(--text-secondary, #666);
  font-size: 13px;
`;

// ============================================
// Helper/Utility Components
// ============================================

export const HintText = styled.div`
  font-size: 11px;
  color: var(--text-muted, #999);
  margin-top: 4px;
`;

export const CharCount = styled.span`
  font-size: 11px;
  color: var(--text-muted, #999);
`;

// ============================================
// Modal Components (Shared)
// ============================================

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

export const ModalTitle = styled.span`
  font-size: 16px;
  font-weight: 600;
`;

export const FixedMenuHint = styled.div`
  background: var(--bg-elevated, #f5f5f5);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  color: var(--text-secondary, #666);
`;

export const SwitchRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;

  .ant-form-item {
    margin-bottom: 0;
  }
`;
