import styled, { keyframes, css } from 'styled-components'

/* ── Animations ─────────────────────────────────────────────────────────── */

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const fadeOut = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`

const spinRing = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const spinRingReverse = keyframes`
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(-360deg); }
`

const logoPulse = keyframes`
  0%, 100% { transform: scale(1);    box-shadow: 0 8px 32px rgba(22,119,255,0.35), 0 2px 8px rgba(0,0,0,0.18); }
  50%       { transform: scale(1.04); box-shadow: 0 12px 40px rgba(22,119,255,0.5),  0 4px 12px rgba(0,0,0,0.22); }
`

const textFadeUp = keyframes`
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
`

const dotBounce = keyframes`
  0%, 80%, 100% { transform: translateY(0);    opacity: 0.35; }
  40%            { transform: translateY(-5px); opacity: 1; }
`

/* ── Overlay ─────────────────────────────────────────────────────────────── */

const Overlay = styled.div<{ $hiding: boolean }>`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  background: var(--app-bg);
  z-index: 9999;
  animation: ${fadeIn} 0.2s ease forwards;
  ${p => p.$hiding && css`
    animation: ${fadeOut} 0.35s ease forwards;
    pointer-events: none;
  `}
`

/* ── Spinner + logo stack ────────────────────────────────────────────────── */

const SpinnerWrap = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
`

/* Outer spinning arc */
const OuterRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #1677ff;
  border-right-color: #1677ff33;
  animation: ${spinRing} 1.1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
`

/* Inner spinning arc — opposite direction, slower */
const InnerRing = styled.div`
  position: absolute;
  inset: 10px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-bottom-color: #06b6d4;
  border-left-color: #06b6d433;
  animation: ${spinRingReverse} 1.6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
`

/* Logo badge */
const LogoBadge = styled.div`
  position: relative;
  z-index: 1;
  width: 62px;
  height: 62px;
  border-radius: 18px;
  background: linear-gradient(145deg, #1465a3 0%, #1677ff 55%, #06b6d4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${logoPulse} 2.4s ease-in-out infinite;
  box-shadow:
    0 2px 0 rgba(255,255,255,0.18) inset,
    0 -2px 0 rgba(0,0,0,0.15) inset,
    0 8px 32px rgba(22,119,255,0.35),
    0 2px 8px rgba(0,0,0,0.18);
`

/* House SVG inside the badge */
function HouseIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {/* Roof */}
      <path
        d="M3 12L12 3L21 12"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Walls */}
      <path
        d="M5 10V20C5 20.55 5.45 21 6 21H10V15H14V21H18C18.55 21 19 20.55 19 20V10"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ── Brand text ──────────────────────────────────────────────────────────── */

const BrandBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  animation: ${textFadeUp} 0.5s ease 0.1s both;
`

const AppName = styled.div`
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.4px;
  background: linear-gradient(90deg, #1677ff 0%, #06b6d4 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`

const Tagline = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  letter-spacing: 0.3px;
`

/* ── Loading dots ────────────────────────────────────────────────────────── */

const Dots = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`

const Dot = styled.div<{ $delay: number }>`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #1677ff;
  animation: ${dotBounce} 1.2s ease-in-out ${p => p.$delay}s infinite;

  [data-theme='dark'] & { background: #49a5ea; }
`

/* ── Exported component ─────────────────────────────────────────────────── */

interface BrandLoaderProps {
  hiding?: boolean
}

export function BrandLoader({ hiding = false }: BrandLoaderProps) {
  return (
    <Overlay $hiding={hiding}>
      <SpinnerWrap>
        <OuterRing />
        <InnerRing />
        <LogoBadge>
          <HouseIcon />
        </LogoBadge>
      </SpinnerWrap>

      <BrandBlock>
        <AppName>MilBaant</AppName>
        <Tagline>Your flat, organised</Tagline>
      </BrandBlock>

      <Dots>
        <Dot $delay={0} />
        <Dot $delay={0.15} />
        <Dot $delay={0.3} />
      </Dots>
    </Overlay>
  )
}
