import styled from 'styled-components'
import { Typography } from 'antd'

const { Text } = Typography

export const SectionCard = styled.div`
  background: var(--card-bg);
  border-radius: 14px;
  border: 1px solid var(--border-light);
  overflow: hidden;
  box-shadow: 0 1px 6px rgba(0,0,0,0.05);
`

export const SectionHead = styled.div`
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;

  @media (min-width: 768px) { padding: 16px 22px; }
`

export const SectionTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
`

export const SectionBody = styled.div`
  padding: 16px 18px;
  @media (min-width: 768px) { padding: 18px 22px; }
`

export const DinnerDisplay = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`

export const DinnerMeal = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
  letter-spacing: -0.3px;

  @media (max-width: 480px) { font-size: 16px; }
`

export const DinnerMeta = styled.div`
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 3px;
`

export const BreakfastGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
`

export const PersonCard = styled.div<{ $isMe?: boolean }>`
  border-radius: 10px;
  border: 1.5px solid ${p => p.$isMe ? 'var(--primary)' : 'var(--border-light)'};
  background: ${p => p.$isMe ? 'var(--primary-soft)' : 'var(--bg-elevated)'};
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 7px;
`

export const PersonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
`

export const PersonName = styled.div`
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

export const PrefTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`

export const DinnerInfo = styled.div`
  flex: 1;
  min-width: 0;
`

export const DinnerDescText = styled(Text)`
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
  line-height: 1.5;
  display: block;
`

export const DinnerMetaOverride = styled.span`
  margin-left: 8px;
  color: #722ed1;
`

export const WeeklyRow = styled.div`
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`

export const DayLabel = styled.span`
  font-weight: 600;
`

export const SectionActions = styled.div`
  display: flex;
  gap: 6px;
`

export const AvatarRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
`

export const SuggestionContent = styled.div`
  flex: 1;
  min-width: 0;
`

export const SuggestionActions = styled.div`
  display: flex;
  gap: 4px;
  flex-shrink: 0;
`

export const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`

export const ModalTitle = styled.span`
  font-size: 14px;
  font-weight: 700;
`

export const SwitchRow = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
`

export const EmptySuggestion = styled(Text)`
  font-size: 13px;
  color: var(--text-muted);
  font-style: italic;
  display: block;
  margin-bottom: 14px;
`

export const HintText = styled(Text)`
  font-size: 12px;
  color: var(--text-muted);
`

export const FixedMenuHint = styled(Text)`
  font-size: 12px;
  color: var(--text-muted);
  display: block;
  margin-bottom: 12px;
`

export const CharCount = styled(Text)`
  font-size: 11px;
  color: var(--text-muted);
`

export const SuggestionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
`

export const SuggestionItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-light);
`

export const SuggestionText = styled.div`
  flex: 1;
  font-size: 13.5px;
  color: var(--text-strong);
  line-height: 1.45;
`

export const SuggestionMeta = styled.div`
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
`

export const AddSuggestionRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
`
