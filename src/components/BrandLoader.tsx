import styled, { keyframes } from 'styled-components'

/* ── Animations ─────────────────────────────────────────────────────────── */

const pulse = keyframes`
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.6; transform: scale(0.92); }
`

const dotBounce = keyframes`
  0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
  40%           { transform: translateY(-10px); opacity: 1; }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`

const shimmer = keyframes`
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
`

/* ── Styled ─────────────────────────────────────────────────────────────── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--content-bg, #f8fafc);
  z-index: 9999;
  gap: 28px;
`

const LogoWrap = styled.div`
  animation: ${pulse} 2s ease-in-out infinite;
`

const LogoCircle = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 22px;
  background: linear-gradient(135deg, #1c8ee5 0%, #0d6ebd 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 12px 40px rgba(28, 142, 229, 0.4),
    0 4px 12px rgba(28, 142, 229, 0.2);
`

const LogoText = styled.span`
  color: #fff;
  font-size: 28px;
  font-weight: 800;
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -1px;
  line-height: 1;
`

const TextBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  animation: ${fadeIn} 0.5s ease forwards;
`

const AppName = styled.div`
  font-size: 22px;
  font-weight: 700;
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.5px;
  background: linear-gradient(
    90deg,
    var(--primary, #1c8ee5) 0%,
    #7c3aed 50%,
    var(--primary, #1c8ee5) 100%
  );
  background-size: 200% auto;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${shimmer} 2.5s linear infinite;
`

const SubText = styled.div`
  font-size: 13px;
  color: var(--text-muted, #9ca3af);
  font-weight: 500;
  letter-spacing: 0.2px;
`

const DotsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`

const Dot = styled.div<{ $delay: number }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--primary, #1c8ee5);
  animation: ${dotBounce} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`

/* ── Component ──────────────────────────────────────────────────────────── */

export function BrandLoader() {
  return (
    <Overlay>
      <LogoWrap>
        <LogoCircle>
          <LogoText>M</LogoText>
        </LogoCircle>
      </LogoWrap>

      <TextBlock>
        <AppName>MilBaant</AppName>
        <SubText>is Loading…</SubText>
      </TextBlock>

      <DotsRow>
        <Dot $delay={0} />
        <Dot $delay={0.2} />
        <Dot $delay={0.4} />
      </DotsRow>
    </Overlay>
  )
}
