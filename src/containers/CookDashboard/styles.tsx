import styled, { keyframes } from 'styled-components'

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%       { transform: scale(1.04); }
`

export const PageWrap = styled.div`
  animation: ${fadeUp} 0.3s ease;
  max-width: 600px;
  margin: 0 auto;
`

export const GreetingBanner = styled.div`
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  border-radius: 16px;
  padding: 20px 22px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 4px 20px rgba(249,115,22,0.35);
`

export const GreetingEmoji = styled.div`
  font-size: 44px;
  line-height: 1;
  flex-shrink: 0;
`

export const ActionCard = styled.button<{ $color: string; $urgent?: boolean }>`
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

export const ActionIcon = styled.div<{ $color: string }>`
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

export const ActionContent = styled.div`
  flex: 1;
  min-width: 0;
`

export const ActionTitle = styled.div`
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
  margin-bottom: 3px;
`

export const ActionSub = styled.div`
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
`

export const ActionArrow = styled.div<{ $color: string }>`
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

export const BalanceCard = styled.div<{ $status: 'good' | 'warn' | 'over' }>`
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

export const BalanceBig = styled.div`
  font-size: clamp(28px, 8vw, 40px);
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin: 8px 0 4px;
  font-family: 'Plus Jakarta Sans', sans-serif;
`

export const BalanceLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255,255,255,0.75);
`

export const BalanceStatus = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: rgba(255,255,255,0.9);
  margin-top: 6px;
`

export const DinnerCard = styled.div`
  background: linear-gradient(135deg, rgba(114,46,209,0.12) 0%, rgba(114,46,209,0.04) 100%);
  border: 2px solid rgba(114,46,209,0.2);
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
`

export const DinnerEmoji = styled.div`
  font-size: 40px;
  line-height: 1;
  flex-shrink: 0;
`

export const SectionHeader = styled.div`
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--text-muted);
  margin-bottom: 10px;
  padding-left: 2px;
`

export const UrgentDot = styled.div`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f97316;
  flex-shrink: 0;
  animation: ${pulse} 1.5s ease-in-out infinite;
`
