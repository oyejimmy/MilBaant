import styled from 'styled-components'
import { Button } from 'antd'

export const SubmitBtn = styled(Button)`
  && {
    height: 50px;
    font-size: 15px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    background: linear-gradient(160deg, #2d7aff 0%, #1260e8 50%, #0a4fd4 100%);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.25) inset,
      0 -1px 0 rgba(0,0,0,0.2) inset,
      0 4px 12px rgba(18,96,232,0.4),
      0 1px 3px rgba(0,0,0,0.15);
    transition: box-shadow 0.18s ease, transform 0.12s ease;

    &:hover:not(:disabled) {
      background: linear-gradient(160deg, #3d87ff 0%, #1a6ef5 50%, #1260e8 100%) !important;
      box-shadow:
        0 1px 0 rgba(255,255,255,0.3) inset,
        0 6px 18px rgba(18,96,232,0.5),
        0 2px 6px rgba(0,0,0,0.15) !important;
      transform: translateY(-1px);
    }

    &:active:not(:disabled) {
      transform: translateY(1px);
      box-shadow: 0 2px 6px rgba(18,96,232,0.3) !important;
    }
  }
`

export const StatusCard = styled.div`
  text-align: center;
  padding: 8px 0 16px;
`

export const StatusIconWrap = styled.div<{ $variant: 'success' | 'error' | 'loading' }>`
  width: 76px;
  height: 76px;
  border-radius: 50%;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34px;

  background: ${p =>
    p.$variant === 'success' ? 'linear-gradient(145deg, #f6ffed 0%, #d9f7be 100%)' :
    p.$variant === 'error'   ? 'linear-gradient(145deg, #fff2f0 0%, #ffccc7 100%)' :
                               'linear-gradient(145deg, #e8f4fc 0%, #bae0ff 100%)'};
  color: ${p =>
    p.$variant === 'success' ? '#52c41a' :
    p.$variant === 'error'   ? '#ff4d4f' :
                               '#1677ff'};
  box-shadow:
    0 1px 0 rgba(255,255,255,0.9) inset,
    0 -1px 0 rgba(0,0,0,0.06) inset,
    0 4px 14px ${p =>
      p.$variant === 'success' ? 'rgba(82,196,26,0.2)' :
      p.$variant === 'error'   ? 'rgba(255,77,79,0.2)' :
                                 'rgba(22,119,255,0.2)'},
    0 1px 4px rgba(0,0,0,0.08);
  border: 1px solid ${p =>
    p.$variant === 'success' ? 'rgba(82,196,26,0.15)' :
    p.$variant === 'error'   ? 'rgba(255,77,79,0.15)' :
                               'rgba(22,119,255,0.15)'};
`

export const StatusTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--text-strong);
  font-family: 'Plus Jakarta Sans', sans-serif;
`

export const StatusText = styled.p`
  margin: 0;
  font-size: 13.5px;
  color: var(--text-muted);
  line-height: 1.65;
`
