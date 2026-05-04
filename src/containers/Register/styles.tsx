import styled, { keyframes } from 'styled-components'
import { Button } from 'antd'

export const SubmitBtn = styled(Button)`
  && {
    height: 48px;
    font-size: 14.5px;
    font-weight: 700;
    border-radius: 11px;
    border: none;
    letter-spacing: 0.2px;
    background: linear-gradient(155deg, #1465a3 0%, #1c8ee5 55%, #2fa8f5 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.22) inset,
      0 -1px 0 rgba(0,0,0,0.18) inset,
      0 4px 14px rgba(28,142,229,0.42),
      0 1px 3px rgba(0,0,0,0.12);
    transition: box-shadow 0.16s ease, transform 0.12s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(155deg, #1a72b8 0%, #2299f0 55%, #3db5ff 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.28) inset,
        0 6px 20px rgba(28,142,229,0.52),
        0 2px 6px rgba(0,0,0,0.12) !important;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 2px 6px rgba(28,142,229,0.3) !important;
    }
  }
`

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const SuccessWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 8px 0 4px;
  animation: ${fadeUp} 0.4s ease forwards;
`

export const SuccessIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(145deg, #f6ffed, #d9f7be);
  border: 1.5px solid #95de64;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  margin-bottom: 18px;
  box-shadow: 0 4px 14px rgba(82,196,26,0.2);
`

export const SuccessTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 17px;
  font-weight: 700;
  color: var(--text-strong);
`

export const SuccessText = styled.p`
  margin: 0 0 22px;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
  max-width: 300px;
`
