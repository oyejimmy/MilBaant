import styled, { keyframes } from 'styled-components'

export const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`

export const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-10px); }
`

export const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--app-bg);
  padding: 24px;
`

export const Card = styled.div`
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  max-width: 440px;
  width: 100%;
  animation: ${fadeUp} 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);

  @media (max-width: 480px) {
    padding: 36px 24px;
    border-radius: 12px;
  }
`

export const BigNumber = styled.div`
  font-size: clamp(80px, 20vw, 120px);
  font-weight: 800;
  font-family: 'Plus Jakarta Sans', sans-serif;
  line-height: 1;
  color: var(--primary);
  opacity: 0.15;
  letter-spacing: -4px;
  margin-bottom: -16px;
  animation: ${float} 4s ease-in-out infinite;
  user-select: none;
`

export const IconWrap = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 20px;
  background: var(--primary-soft);
  border: 1.5px solid rgba(64, 150, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 32px;
`
